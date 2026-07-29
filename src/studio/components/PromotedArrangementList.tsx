import { DragHandleIcon } from "@sanity/icons/DragHandle"
import { TrashIcon } from "@sanity/icons/Trash"
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd"
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Spinner,
  Stack,
  Text,
  useToast,
} from "@sanity/ui"
import { useCallback, useEffect, useState } from "react"
import { useClient } from "sanity"
import { IntentLink } from "sanity/router"

import {
  normalizedArrangementId,
  reorderFeaturedDocuments,
  selectFeaturedDocuments,
  selectionNeedsNormalization,
  type FeaturedSelectionDocument,
} from "./featuredArrangementSelection"
import { PromotedArrangementPicker } from "./PromotedArrangementPicker"
import { PROMOTABLE_ARRANGEMENTS_FILTER } from "./promotedArrangementFilter"

const API_VERSION = "2026-07-29"
const FEATURED_DOCUMENTS_QUERY = `*[
  _type == "arrangement" &&
  (${PROMOTABLE_ARRANGEMENTS_FILTER})
] {
  _id,
  title,
  "eventKind": coalesce(eventKind, "single"),
  "approvalStatus": coalesce(approvalStatus, "pending"),
  isPromoted,
  promotedPlacement,
  promotedOrder,
  orderRank,
  dates[]{startDate},
  "childDates": *[
    _type == "arrangement" &&
    parentEvent._ref == string::split(^._id, "drafts.")[-1] &&
    approvalStatus == "approved"
  ].dates[].startDate
}`

type FeaturedDocument = FeaturedSelectionDocument & {
  approvalStatus: string
  documentIds: string[]
  eventKind: "single" | "seriesParent" | "festivalParent"
  nextDate?: string
  title?: string
}

type RawFeaturedDocument = Omit<
  FeaturedDocument,
  "documentIds" | "nextDate"
> & {
  childDates?: string[]
  dates?: Array<{ startDate?: string }>
}

const KIND_LABELS: Record<FeaturedDocument["eventKind"], string> = {
  single: "Arrangement",
  seriesParent: "Serie",
  festivalParent: "Festival",
}

export function PromotedArrangementList({ today }: { today: string }) {
  const client = useClient({ apiVersion: API_VERSION })
  const toast = useToast()
  const [documents, setDocuments] = useState<FeaturedDocument[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<
    FeaturedDocument[]
  >([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadDocuments = useCallback(async () => {
    const rawDocuments = await client.fetch<RawFeaturedDocument[]>(
      FEATURED_DOCUMENTS_QUERY,
      { today },
      { perspective: "previewDrafts" },
    )
    const byId = new Map<string, FeaturedDocument>()
    for (const document of rawDocuments) {
      const id = normalizedArrangementId(document._id)
      const current = byId.get(id)
      const documentIds = [...(current?.documentIds ?? []), document._id]
      const nextDate = [
        ...(document.dates ?? []).map(date => date.startDate),
        ...(document.childDates ?? []),
      ]
        .filter((date): date is string => Boolean(date && date >= today))
        .sort()[0]
      const documentFields = {
        _id: document._id,
        approvalStatus: document.approvalStatus,
        eventKind: document.eventKind,
        isPromoted: document.isPromoted,
        orderRank: document.orderRank,
        promotedOrder: document.promotedOrder,
        promotedPlacement: document.promotedPlacement,
        title: document.title,
      }
      if (!current || document._id.startsWith("drafts.")) {
        byId.set(id, { ...documentFields, documentIds, nextDate })
      } else {
        current.documentIds = documentIds
      }
    }
    return [...byId.values()]
  }, [client, today])

  const persistSelection = useCallback(
    async (
      allDocuments: FeaturedDocument[],
      nextSelection: FeaturedDocument[],
    ) => {
      const selectedIds = new Set(
        nextSelection.map(document => normalizedArrangementId(document._id)),
      )
      const transaction = client.transaction()
      for (const document of allDocuments) {
        const id = normalizedArrangementId(document._id)
        const selectedIndex = nextSelection.findIndex(
          selected => normalizedArrangementId(selected._id) === id,
        )
        if (selectedIds.has(id)) {
          for (const documentId of document.documentIds) {
            transaction.patch(documentId, patch =>
              patch.set({
                isPromoted: true,
                promotedOrder: selectedIndex,
                promotedPlacement: selectedIndex < 3 ? "top" : "pool",
              }),
            )
          }
          continue
        }
        if (
          document.isPromoted === true ||
          document.promotedPlacement === "top" ||
          typeof document.promotedOrder === "number"
        ) {
          for (const documentId of document.documentIds) {
            transaction.patch(documentId, patch =>
              patch
                .set({ isPromoted: false, promotedPlacement: "pool" })
                .unset(["promotedOrder"]),
            )
          }
        }
      }
      await transaction.commit({ visibility: "sync" })
    },
    [client],
  )

  const refresh = useCallback(async () => {
    const nextDocuments = await loadDocuments()
    let nextSelection = selectFeaturedDocuments(nextDocuments)
    if (nextSelection.length === 0 && nextDocuments[0]) {
      nextSelection = [nextDocuments[0]]
    }
    if (selectionNeedsNormalization(nextDocuments, nextSelection)) {
      await persistSelection(nextDocuments, nextSelection)
      const normalizedDocuments = await loadDocuments()
      setDocuments(normalizedDocuments)
      setSelectedDocuments(selectFeaturedDocuments(normalizedDocuments))
    } else {
      setDocuments(nextDocuments)
      setSelectedDocuments(nextSelection)
    }
    setLoading(false)
  }, [loadDocuments, persistSelection])

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0)
    const subscription = client
      .listen(
        `*[_type == "arrangement" && (${PROMOTABLE_ARRANGEMENTS_FILTER})]`,
        { today },
        { includeResult: false, visibility: "query" },
      )
      .subscribe(() => void refresh())
    return () => {
      window.clearTimeout(initialRefresh)
      subscription.unsubscribe()
    }
  }, [client, refresh, today])

  const saveSelection = async (nextSelection: FeaturedDocument[]) => {
    setSaving(true)
    setSelectedDocuments(nextSelection)
    try {
      await persistSelection(documents, nextSelection)
      await refresh()
    } catch {
      await refresh()
      toast.push({
        status: "error",
        title: "Kunne ikke lagre fremhevede arrangementer.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || saving) return
    const reordered = reorderFeaturedDocuments(
      selectedDocuments,
      result.source.index,
      result.destination.index,
    )
    if (reordered === selectedDocuments) return
    void saveSelection(reordered)
  }

  const remove = (document: FeaturedDocument) => {
    if (selectedDocuments.length <= 1 || saving) return
    const id = normalizedArrangementId(document._id)
    void saveSelection(
      selectedDocuments.filter(
        selected => normalizedArrangementId(selected._id) !== id,
      ),
    )
  }

  if (loading) {
    return (
      <Flex align="center" gap={3} padding={5}>
        <Spinner />
        <Text>Laster fremhevede arrangementer …</Text>
      </Flex>
    )
  }

  const selectedIds = selectedDocuments.map(document =>
    normalizedArrangementId(document._id),
  )

  return (
    <Stack space={4}>
      <Card border padding={4} radius={2} tone="primary">
        <Stack space={3}>
          <Flex align="center" gap={2} wrap="wrap">
            <Badge tone="positive">
              {Math.min(selectedDocuments.length, 3)} vises
            </Badge>
            {selectedDocuments.length > 3 ? (
              <Badge tone="caution">{selectedDocuments.length - 3} i kø</Badge>
            ) : null}
            <Text weight="semibold">Vises øverst på forsiden</Text>
          </Flex>
          <Text muted size={1}>
            De tre første kommende arrangementene vises. Legg gjerne flere i kø;
            neste arrangement vises automatisk når et tidligere arrangement er
            avsluttet. Dra for å endre rekkefølgen.
          </Text>
        </Stack>
      </Card>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="featured-arrangements">
          {provided => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <Stack space={2}>
                {selectedDocuments.map((document, index) => {
                  const id = normalizedArrangementId(document._id)
                  return (
                    <Stack key={id} space={2}>
                      {index === 3 ? (
                        <Flex align="center" gap={3} paddingY={2}>
                          <Card borderTop flex={1} />
                          <Text muted size={1} weight="semibold">
                            Kø – vises automatisk senere
                          </Text>
                          <Card borderTop flex={1} />
                        </Flex>
                      ) : null}
                      <Draggable draggableId={id} index={index}>
                        {(draggable, snapshot) => (
                          <Card
                            border
                            padding={3}
                            radius={2}
                            ref={draggable.innerRef}
                            shadow={snapshot.isDragging ? 2 : undefined}
                            tone={snapshot.isDragging ? "primary" : "default"}
                            {...draggable.draggableProps}
                            style={draggable.draggableProps.style}
                          >
                            <Flex align="center" gap={3}>
                              <Box
                                aria-label={`Flytt ${document.title ?? "arrangement"}`}
                                padding={2}
                                style={{ cursor: saving ? "wait" : "grab" }}
                                {...draggable.dragHandleProps}
                              >
                                <DragHandleIcon />
                              </Box>
                              <Badge tone={index < 3 ? "primary" : "default"}>
                                {index < 3
                                  ? `Plass ${index + 1}`
                                  : `Kø ${index - 2}`}
                              </Badge>
                              <Stack flex={1} space={2}>
                                <IntentLink
                                  intent="edit"
                                  params={{
                                    id,
                                    mode: "structure",
                                    type: "arrangement",
                                  }}
                                  style={{
                                    color: "inherit",
                                    textDecoration: "none",
                                  }}
                                >
                                  <Text size={2} weight="semibold">
                                    {document.title ??
                                      "Arrangement uten tittel"}
                                  </Text>
                                </IntentLink>
                                <Text muted size={1}>
                                  {[
                                    document.nextDate,
                                    KIND_LABELS[document.eventKind],
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </Text>
                              </Stack>
                              <Button
                                aria-label={`Fjern ${document.title ?? "arrangement"} fra fremhevede`}
                                disabled={
                                  selectedDocuments.length <= 1 || saving
                                }
                                icon={TrashIcon}
                                mode="ghost"
                                onClick={() => remove(document)}
                                text="Fjern"
                                tone="critical"
                              />
                            </Flex>
                          </Card>
                        )}
                      </Draggable>
                    </Stack>
                  )
                })}
                {provided.placeholder}
              </Stack>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <PromotedArrangementPicker
        onAdded={refresh}
        selectedIds={selectedIds}
        today={today}
      />
    </Stack>
  )
}
