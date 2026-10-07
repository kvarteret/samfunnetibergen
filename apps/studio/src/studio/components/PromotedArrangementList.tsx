import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd"
import { DragHandleIcon } from "@sanity/icons/DragHandle"
import { ImageIcon } from "@sanity/icons/Image"
import { TrashIcon } from "@sanity/icons/Trash"
import { createImageUrlBuilder } from "@sanity/image-url"
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
} from "@sanity/ui"
import { useToast } from "@sanity/ui/toast"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useClient } from "sanity"
import { usePaneRouter } from "sanity/structure"
import styled from "styled-components"

import { formatStudioDate } from "./arrangementFilters"
import { createCoalescedAsyncRunner } from "./coalescedAsyncRunner"
import {
  applyFeaturedSelection,
  type FeaturedSelectionDocument,
  getFeaturedVisibleCount,
  moveFeaturedDocumentBetweenSections,
  normalizedArrangementId,
  selectFeaturedDocuments,
  selectionNeedsNormalization,
} from "./featuredArrangementSelection"
import { featuredSchedule } from "./featuredSchedule"
import { PromotedArrangementPicker } from "./PromotedArrangementPicker"
import { PROMOTABLE_ARRANGEMENTS_FILTER } from "./promotedArrangementFilter"

const API_VERSION = "2026-07-29"
const FEATURED_DOCUMENTS_QUERY = `*[
  _type == "arrangement" &&
  (${PROMOTABLE_ARRANGEMENTS_FILTER})
] {
  _id,
  "title": coalesce(
    localizedTitle[language == "nb" && defined(value) && value != ""][0].value,
    localizedTitle[language == "en" && defined(value) && value != ""][0].value,
    "Arrangement uten tittel"
  ),
  "eventKind": coalesce(eventKind, "single"),
  "approvalStatus": coalesce(approvalStatus, "pending"),
  isPromoted,
  promotedPlacement,
  promotedOrder,
  orderRank,
  _createdAt,
  image,
  dates[]{startDate, startTime},
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
  nextTime?: string
  lastDate?: string
  createdAt?: string
  image?: { asset?: { _ref?: string } } | null
  title?: string
}

type RawFeaturedDocument = Omit<
  FeaturedDocument,
  "documentIds" | "nextDate" | "nextTime" | "lastDate" | "createdAt"
> & {
  _createdAt?: string
  childDates?: string[]
  dates?: Array<{ startDate?: string; startTime?: string }>
}

const RowLink = styled.div`
  flex: 1;
  min-width: 0;
  a { color: inherit; text-decoration: none; display: block; border-radius: 3px; }
  a:focus-visible { outline: 2px solid var(--card-focus-ring-color, currentColor); outline-offset: 2px; }
`

const Thumbnail = styled.span`
  display: grid;
  place-items: center;
  flex: none;
  width: 64px;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 3px;
  background: var(--card-muted-bg-color, rgb(127 127 127 / 0.15));
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`

export function PromotedArrangementList({ today }: { today: string }) {
  const client = useClient({ apiVersion: API_VERSION })
  const imageBuilder = useMemo(() => createImageUrlBuilder(client), [client])
  const { ChildLink } = usePaneRouter()
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
      const allDates = [
        ...(document.dates ?? []).map(date => date.startDate),
        ...(document.childDates ?? []),
      ]
        .filter((date): date is string => Boolean(date))
        .sort()
      const nextDate = allDates.find(date => date >= today)
      const nextTime = document.dates?.find(
        date => date.startDate === nextDate,
      )?.startTime
      const lastDate = allDates.at(-1)
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
        byId.set(id, {
          ...documentFields,
          createdAt: document._createdAt,
          documentIds,
          image: document.image,
          lastDate,
          nextDate,
          nextTime,
        })
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

  const move = (
    section: "visible" | "queue",
    index: number,
    destinationSection: "visible" | "queue",
    destinationIndex: number,
  ) => {
    if (saving) return
    if (
      section === "queue" &&
      destinationSection === "visible" &&
      visibleCount >= 3
    ) {
      toast.push({
        status: "warning",
        title:
          "Forsiden har allerede tre arrangementer. Flytt først et av dem til køen.",
      })
      return
    }
    const moved = moveFeaturedDocumentBetweenSections(
      selectedDocuments,
      visibleCount,
      section,
      index,
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
  const schedule = featuredSchedule(selectedDocuments, visibleCount, today)

  const renderDocument = (
    document: FeaturedDocument,
    index: number,
    section: "visible" | "queue",
  ) => {
    const id = normalizedArrangementId(document._id)
    const slot = schedule[section === "visible" ? index : visibleCount + index]
    const until =
      slot?.until && slot.until !== document.nextDate
        ? `til ${formatStudioDate(slot.until, false)}`
        : null
    const queueLabel =
      section === "queue"
        ? slot?.from
          ? `Fra ${formatStudioDate(slot.from)}`
          : "Får ikke plass"
        : null
    const thumbnail = document.image?.asset?._ref
      ? imageBuilder
          .image(document.image)
          .width(128)
          .height(96)
          .fit("crop")
          .auto("format")
          .url()
      : null
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
                aria-label={`Dra ${document.title ?? "arrangement"}`}
                padding={1}
                style={{ cursor: saving ? "wait" : "grab" }}
                {...draggable.dragHandleProps}
              >
                <DragHandleIcon />
              </Box>
              <RowLink>
                <ChildLink childId={id}>
                  <Flex align="center" gap={3}>
                    <Thumbnail>
                      {thumbnail ? (
                        <img alt="" src={thumbnail} />
                      ) : (
                        <ImageIcon />
                      )}
                    </Thumbnail>
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <Text size={2} textOverflow="ellipsis" weight="semibold">
                        {document.title ?? "Arrangement uten tittel"}
                      </Text>
                      <Text muted size={1} textOverflow="ellipsis">
                        {[
                          [
                            formatStudioDate(document.nextDate),
                            document.nextTime,
                          ]
                            .filter(Boolean)
                            .join(" kl. "),
                          until,
                          document.createdAt
                            ? `lagt ut ${formatStudioDate(document.createdAt, false)}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                      {queueLabel ? (
                        <Text size={1} weight="medium">
                          {queueLabel}
                        </Text>
                      ) : null}
                    </Stack>
                  </Flex>
                </ChildLink>
              </RowLink>
              <Flex align="center" gap={1}>
                <Button
                  disabled={
                    saving ||
                    (section === "visible"
                      ? visibleCount <= 1
                      : visibleCount >= 3)
                  }
                  fontSize={1}
                  mode="ghost"
                  onClick={() =>
                    section === "visible"
                      ? move("visible", index, "queue", 0)
                      : move("queue", index, "visible", visibleCount)
                  }
                  text={section === "visible" ? "Til kø" : "Vis nå"}
                />
                <Button
                  aria-label={`Fjern ${document.title ?? "arrangement"} fra fremhevede`}
                  disabled={selectedDocuments.length <= 1 || saving}
                  icon={TrashIcon}
                  mode="bleed"
                  onClick={() => remove(document)}
                  title="Fjern fra fremhevede"
                  tone="critical"
                />
              </Flex>
            </Flex>
          </Card>
        )}
      </Draggable>
    )
  }

  return (
    <Stack gap={4}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Flex align="center" gap={2}>
          <Text size={1} weight="semibold">
            På forsiden nå
          </Text>
          <Text muted size={1}>
            {visibleCount}/3
          </Text>
        </Flex>
        <Droppable droppableId={VISIBLE_DROPPABLE_ID}>
          {provided => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <Stack gap={2}>
                {visibleDocuments.map((document, index) =>
                  renderDocument(document, index, "visible"),
                )}
                {provided.placeholder}
              </Stack>
            </div>
          )}
        </Droppable>

        <Droppable droppableId={QUEUE_ENTRY_DROPPABLE_ID}>
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <Card
                borderTop
                paddingTop={4}
                tone={snapshot.isDraggingOver ? "primary" : "default"}
              >
                <Flex align="center" gap={2}>
                  <Text size={1} weight="semibold">
                    Kø
                  </Text>
                  {queuedDocuments.length ? null : (
                    <Text muted size={1}>
                      Dra hit for å vise senere
                    </Text>
                  )}
                </Flex>
              </Card>
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
              <Stack gap={2}>
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
      <Stack gap={4}>
        <Heading size={2}>Fremhevede arrangementer</Heading>
        <PromotedArrangementList today={today} />
      </Stack>
    </Card>
  )
}
