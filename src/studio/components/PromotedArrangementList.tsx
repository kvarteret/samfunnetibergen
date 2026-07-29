import { OrderableDocumentList } from "@sanity/orderable-document-list"
import { Badge, Button, Card, Flex, Stack, Text, useToast } from "@sanity/ui"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { useClient, usePerspective } from "sanity"
import styled from "styled-components"

import { PromotedArrangementPicker } from "./PromotedArrangementPicker"
import { PROMOTED_ARRANGEMENTS_FILTER } from "./promotedArrangementFilter"
import {
  decidePromotedDrag,
  normalizedDocumentId,
  placementsAfterDecision,
  topDocumentIds,
  type PromotedPlacementDocument,
} from "./promotedArrangementPlacement"

const API_VERSION = "2026-07-29"

type OrderableListHandle = {
  actionHandlers: {
    resetOrder: () => Promise<void>
    showIncrements: () => void
  }
}

type ListedDocument = PromotedPlacementDocument & {
  documentIds: string[]
}

type PendingDrag = {
  before: ListedDocument[]
  draggedId: string
}

const OrderedListFrame = styled.div<{ $topCount: number }>`
  ${({ $topCount }) =>
    $topCount > 0
      ? `
        [data-rfd-droppable-id="documentSortZone"] > div:nth-child(${$topCount}) {
          border-bottom: 2px solid var(--card-border-color, currentColor);
          margin-bottom: 1rem;
          padding-bottom: 1rem;
        }
      `
      : ""}
`

export function PromotedArrangementList({ today }: { today: string }) {
  const client = useClient({ apiVersion: API_VERSION })
  const { perspectiveStack } = usePerspective()
  const toast = useToast()
  const listRef = useRef<OrderableListHandle>(null)
  const pendingDragRef = useRef<PendingDrag | null>(null)
  const clearPendingDragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const [documents, setDocuments] = useState<ListedDocument[]>([])
  const [unrankedCount, setUnrankedCount] = useState(0)
  const [initializing, setInitializing] = useState(false)
  const options = useMemo(
    () => ({
      type: "arrangement",
      client,
      currentVersion: perspectiveStack[0],
      filter: PROMOTED_ARRANGEMENTS_FILTER,
      params: { today },
    }),
    [client, perspectiveStack, today],
  )
  const loadDocuments = useCallback(async () => {
    const rawDocuments = await client.fetch<
      Array<{
        _id: string
        orderRank?: string
        promotedPlacement?: "top" | "pool"
      }>
    >(
      `*[
            _type == "arrangement" &&
            (${PROMOTED_ARRANGEMENTS_FILTER})
          ]{_id, orderRank, promotedPlacement}`,
      { today },
      { perspective: "previewDrafts" },
    )
    const byId = new Map<string, ListedDocument>()
    for (const document of rawDocuments) {
      const id = normalizedDocumentId(document._id)
      const current = byId.get(id)
      const documentIds = [...(current?.documentIds ?? []), document._id]
      if (!current || document._id.startsWith("drafts.")) {
        byId.set(id, { ...document, documentIds })
      } else {
        current.documentIds = documentIds
      }
    }
    return [...byId.values()].sort((first, second) =>
      (first.orderRank ?? "~").localeCompare(second.orderRank ?? "~"),
    )
  }, [client, today])

  const applyDocuments = useCallback((nextDocuments: ListedDocument[]) => {
    setDocuments(nextDocuments)
    setUnrankedCount(
      nextDocuments.filter(document => !document.orderRank).length,
    )
  }, [])

  const savePlacements = useCallback(
    async (
      before: ListedDocument[],
      decision: Extract<
        ReturnType<typeof decidePromotedDrag>,
        { type: "move" }
      >,
    ) => {
      const placements = placementsAfterDecision(before, decision)
      const transaction = client.transaction()
      for (const { id, placement } of placements) {
        const document = before.find(
          candidate => normalizedDocumentId(candidate._id) === id,
        )
        for (const documentId of document?.documentIds ?? []) {
          transaction.patch(documentId, patch =>
            patch.set({ promotedPlacement: placement }),
          )
        }
      }
      await transaction.commit({ visibility: "sync" })
    },
    [client],
  )

  const restoreOrder = useCallback(
    async (before: ListedDocument[], after: ListedDocument[]) => {
      const transaction = client.transaction()
      for (const previous of before) {
        const current = after.find(
          document =>
            normalizedDocumentId(document._id) ===
            normalizedDocumentId(previous._id),
        )
        if (!current || current.orderRank === previous.orderRank) continue
        transaction.patch(current._id, patch =>
          previous.orderRank
            ? patch.set({ orderRank: previous.orderRank })
            : patch.unset(["orderRank"]),
        )
      }
      await transaction.commit({ visibility: "sync" })
    },
    [client],
  )

  const refreshAndReconcile = useCallback(async () => {
    const nextDocuments = await loadDocuments()
    const pendingDrag = pendingDragRef.current
    if (!pendingDrag) {
      applyDocuments(nextDocuments)
      return
    }

    const orderChanged =
      pendingDrag.before.map(document => document._id).join("\n") !==
      nextDocuments.map(document => document._id).join("\n")
    const decision = decidePromotedDrag(
      pendingDrag.before,
      nextDocuments,
      pendingDrag.draggedId,
    )
    if (decision.type === "none") {
      if (orderChanged) {
        pendingDragRef.current = null
        if (clearPendingDragTimerRef.current) {
          clearTimeout(clearPendingDragTimerRef.current)
        }
      }
      applyDocuments(nextDocuments)
      return
    }

    pendingDragRef.current = null
    if (clearPendingDragTimerRef.current) {
      clearTimeout(clearPendingDragTimerRef.current)
    }

    if (decision.type === "move") {
      await savePlacements(pendingDrag.before, decision)
      applyDocuments(await loadDocuments())
      return
    }

    await restoreOrder(pendingDrag.before, nextDocuments)
    applyDocuments(await loadDocuments())
    toast.push({
      status: "warning",
      title:
        decision.type === "rejectMaximum"
          ? "Du kan legge til maksimalt tre arrangementer som fremhevet. Flytt først et annet arrangement ned."
          : "Minst ett arrangement må være fremhevet over linjen.",
    })
  }, [applyDocuments, loadDocuments, restoreOrder, savePlacements, toast])

  useEffect(() => {
    void loadDocuments().then(applyDocuments)
    const subscription = client
      .listen(
        `*[
          _type == "arrangement" &&
          (${PROMOTED_ARRANGEMENTS_FILTER})
        ]`,
        { today },
        { includeResult: false, visibility: "query" },
      )
      .subscribe(() => void refreshAndReconcile())
    return () => {
      subscription.unsubscribe()
      if (clearPendingDragTimerRef.current) {
        clearTimeout(clearPendingDragTimerRef.current)
      }
    }
  }, [applyDocuments, client, loadDocuments, refreshAndReconcile, today])

  const initializeOrder = async () => {
    setInitializing(true)
    try {
      await listRef.current?.actionHandlers.resetOrder()
      applyDocuments(await loadDocuments())
    } finally {
      setInitializing(false)
    }
  }
  const topCount = topDocumentIds(documents).size
  const placementLabel =
    topCount === 0
      ? "Minst én mangler"
      : topCount === 1
        ? "Plass 1"
        : `Plass 1–${topCount}`

  return (
    <Stack space={4}>
      <Card border padding={4} radius={2} tone="primary">
        <Stack space={3}>
          <Flex align="center" gap={2} wrap="wrap">
            <Badge tone={topCount === 0 ? "caution" : "positive"}>
              {placementLabel}
            </Badge>
            <Text weight="semibold">Vises øverst på forsiden</Text>
          </Flex>
          <Text muted size={1}>
            Minst ett og maksimalt tre arrangementer vises. Dra dem til ønsket
            rekkefølge; linjen markerer de som vises. Festivaler fjernes etter
            siste festivaldag, og andre avsluttede arrangementer fjernes etter
            siste arrangementsdato.
          </Text>
          {unrankedCount > 0 ? (
            <Button
              disabled={initializing}
              mode="ghost"
              onClick={() => void initializeOrder()}
              text={
                initializing
                  ? "Klargjør …"
                  : `Klargjør rekkefølge (${unrankedCount})`
              }
            />
          ) : null}
        </Stack>
      </Card>
      <PromotedArrangementPicker
        onAdded={initializeOrder}
        placeAboveLine={topCount === 0}
        today={today}
      />
      <OrderedListFrame
        $topCount={topCount}
        onPointerDownCapture={(event: ReactPointerEvent<HTMLDivElement>) => {
          const target = event.target
          if (!(target instanceof Element)) return
          const draggable = target.closest<HTMLElement>(
            "[data-rfd-draggable-id]",
          )
          const draggedId = draggable?.dataset.rfdDraggableId
          if (!draggedId) return
          pendingDragRef.current = {
            before: documents,
            draggedId,
          }
          if (clearPendingDragTimerRef.current) {
            clearTimeout(clearPendingDragTimerRef.current)
          }
          clearPendingDragTimerRef.current = setTimeout(() => {
            pendingDragRef.current = null
          }, 3000)
        }}
      >
        <OrderableDocumentList options={options} ref={listRef} />
      </OrderedListFrame>
    </Stack>
  )
}
