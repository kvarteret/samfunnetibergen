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
  Heading,
  Spinner,
  Stack,
  Text,
  useToast,
} from "@sanity/ui"
import { useCallback, useEffect, useRef, useState } from "react"
import { useClient } from "sanity"
import { IntentLink } from "sanity/router"

import { createCoalescedAsyncRunner } from "./coalescedAsyncRunner"
import {
  applyFeaturedSelection,
  getFeaturedVisibleCount,
  moveFeaturedDocumentBetweenSections,
  normalizedArrangementId,
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
const ARRANGEMENT_DRAFT_IDS_QUERY =
  '*[_type == "arrangement" && _id in path("drafts.**")]._id'
const VISIBLE_DROPPABLE_ID = "featured-visible"
const QUEUE_ENTRY_DROPPABLE_ID = "featured-queue-entry"
const QUEUE_DROPPABLE_ID = "featured-queue"

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
  const [visibleCount, setVisibleCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const refreshRunner = useRef(createCoalescedAsyncRunner())

  const loadDocuments = useCallback(async () => {
    const [rawDocuments, draftIds] = await Promise.all([
      client.fetch<RawFeaturedDocument[]>(
        FEATURED_DOCUMENTS_QUERY,
        { today },
        { perspective: "drafts" },
      ),
      client.fetch<string[]>(
        ARRANGEMENT_DRAFT_IDS_QUERY,
        {},
        { perspective: "raw" },
      ),
    ])
    const draftIdSet = new Set(draftIds)
    const byId = new Map<string, FeaturedDocument>()
    for (const document of rawDocuments) {
      const id = normalizedArrangementId(document._id)
      const current = byId.get(id)
      const draftId = `drafts.${id}`
      const documentIds = [id, ...(draftIdSet.has(draftId) ? [draftId] : [])]
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
      }
    }
    return [...byId.values()]
  }, [client, today])

  const persistSelection = useCallback(
    async (
      allDocuments: FeaturedDocument[],
      nextSelection: FeaturedDocument[],
      nextVisibleCount: number,
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
                promotedPlacement:
                  selectedIndex < nextVisibleCount ? "top" : "pool",
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
      await transaction.commit({ visibility: "async" })
    },
    [client],
  )

  const performRefresh = useCallback(async () => {
    const nextDocuments = await loadDocuments()
    let nextSelection = selectFeaturedDocuments(nextDocuments)
    let nextVisibleCount = getFeaturedVisibleCount(nextSelection)
    if (nextSelection.length === 0 && nextDocuments[0]) {
      nextSelection = [nextDocuments[0]]
      nextVisibleCount = 1
    }
    if (
      selectionNeedsNormalization(
        nextDocuments,
        nextSelection,
        nextVisibleCount,
      )
    ) {
      await persistSelection(nextDocuments, nextSelection, nextVisibleCount)
      const normalizedDocuments = applyFeaturedSelection(
        nextDocuments,
        nextSelection,
        nextVisibleCount,
      )
      setDocuments(normalizedDocuments)
      setSelectedDocuments(selectFeaturedDocuments(normalizedDocuments))
    } else {
      setDocuments(nextDocuments)
      setSelectedDocuments(nextSelection)
    }
    setVisibleCount(nextVisibleCount)
    setLoading(false)
  }, [loadDocuments, persistSelection])

  const refresh = useCallback(() => {
    return refreshRunner.current(performRefresh)
  }, [performRefresh])

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      void refresh().catch(() => setLoading(false))
    }, 0)
    return () => {
      window.clearTimeout(initialRefresh)
    }
  }, [refresh])

  const saveSelection = async (
    nextSelection: FeaturedDocument[],
    nextVisibleCount = visibleCount,
  ) => {
    setSaving(true)
    setSelectedDocuments(nextSelection)
    setVisibleCount(nextVisibleCount)
    try {
      await persistSelection(documents, nextSelection, nextVisibleCount)
      const normalizedDocuments = applyFeaturedSelection(
        documents,
        nextSelection,
        nextVisibleCount,
      )
      setDocuments(normalizedDocuments)
      setSelectedDocuments(selectFeaturedDocuments(normalizedDocuments))
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
    const sourceSection =
      result.source.droppableId === VISIBLE_DROPPABLE_ID ? "visible" : "queue"
    const destinationSection =
      result.destination.droppableId === VISIBLE_DROPPABLE_ID
        ? "visible"
        : "queue"
    const destinationIndex =
      result.destination.droppableId === QUEUE_ENTRY_DROPPABLE_ID
        ? 0
        : result.destination.index
    if (
      sourceSection === "queue" &&
      destinationSection === "visible" &&
      visibleCount >= 3
    ) {
      toast.push({
        status: "warning",
        title:
          "Du kan legge til maksimalt tre arrangementer som fremhevet. Flytt først et annet arrangement ned.",
      })
      return
    }
    const moved = moveFeaturedDocumentBetweenSections(
      selectedDocuments,
      visibleCount,
      sourceSection,
      result.source.index,
      destinationSection,
      destinationIndex,
    )
    if (
      moved.documents === selectedDocuments &&
      moved.visibleCount === visibleCount
    )
      return
    void saveSelection(moved.documents, moved.visibleCount)
  }

  const remove = (document: FeaturedDocument) => {
    if (selectedDocuments.length <= 1 || saving) return
    const id = normalizedArrangementId(document._id)
    const selectedIndex = selectedDocuments.findIndex(
      selected => normalizedArrangementId(selected._id) === id,
    )
    const nextSelection = selectedDocuments.filter(
      selected => normalizedArrangementId(selected._id) !== id,
    )
    const nextVisibleCount =
      selectedIndex < visibleCount
        ? Math.min(visibleCount, nextSelection.length)
        : visibleCount
    void saveSelection(nextSelection, nextVisibleCount)
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
  const visibleDocuments = selectedDocuments.slice(0, visibleCount)
  const queuedDocuments = selectedDocuments.slice(visibleCount)

  const renderDocument = (
    document: FeaturedDocument,
    index: number,
    section: "visible" | "queue",
  ) => {
    const id = normalizedArrangementId(document._id)
    const position = section === "visible" ? index : index + 3
    return (
      <Draggable draggableId={id} index={index} key={id}>
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
              <Badge tone={section === "visible" ? "primary" : "default"}>
                {section === "visible"
                  ? `Plass ${position + 1}`
                  : `Kø ${position - 2}`}
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
                    {document.title ?? "Arrangement uten tittel"}
                  </Text>
                </IntentLink>
                <Text muted size={1}>
                  {[document.nextDate, KIND_LABELS[document.eventKind]]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </Stack>
              <Button
                aria-label={`Fjern ${document.title ?? "arrangement"} fra fremhevede`}
                disabled={selectedDocuments.length <= 1 || saving}
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
    )
  }

  return (
    <Stack space={4}>
      <Card border padding={4} radius={2} tone="primary">
        <Stack space={3}>
          <Flex align="center" gap={2} wrap="wrap">
            <Badge tone="positive">{visibleCount} vises</Badge>
            {queuedDocuments.length > 0 ? (
              <Badge tone="caution">{queuedDocuments.length} i kø</Badge>
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
        <Droppable droppableId={VISIBLE_DROPPABLE_ID}>
          {provided => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <Stack space={2}>
                {visibleDocuments.map((document, index) =>
                  renderDocument(document, index, "visible"),
                )}
                {provided.placeholder}
              </Stack>
            </div>
          )}
        </Droppable>

        <Droppable droppableId={QUEUE_ENTRY_DROPPABLE_ID}>
          {provided => (
            <div
              ref={provided.innerRef}
              style={{
                minHeight: 88,
                position: "relative",
              }}
              {...provided.droppableProps}
            >
              <Flex
                align="center"
                gap={3}
                justify="center"
                style={{
                  inset: 0,
                  pointerEvents: "none",
                  position: "absolute",
                }}
              >
                <Card borderTop flex={1} />
                <Text muted size={1} weight="semibold">
                  Kø – slipp her for å vise automatisk senere
                </Text>
                <Card borderTop flex={1} />
              </Flex>
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        <Droppable droppableId={QUEUE_DROPPABLE_ID}>
          {provided => (
            <div
              ref={provided.innerRef}
              style={{ minHeight: 52 }}
              {...provided.droppableProps}
            >
              <Stack space={2}>
                {queuedDocuments.map((document, index) =>
                  renderDocument(document, index, "queue"),
                )}
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

export function PromotedArrangementsPane() {
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Oslo",
  }).format(new Date())

  return (
    <Card height="fill" overflow="auto" padding={4}>
      <Stack space={4}>
        <Heading size={2}>Fremhevede arrangementer</Heading>
        <PromotedArrangementList today={today} />
      </Stack>
    </Card>
  )
}
