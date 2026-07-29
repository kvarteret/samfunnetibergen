import { OrderableDocumentList } from "@sanity/orderable-document-list"
import { Badge, Button, Card, Flex, Stack, Text } from "@sanity/ui"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useClient, usePerspective } from "sanity"
import styled from "styled-components"

import { PromotedArrangementPicker } from "./PromotedArrangementPicker"
import { PROMOTED_ARRANGEMENTS_FILTER } from "./promotedArrangementFilter"

const API_VERSION = "2026-07-29"

type OrderableListHandle = {
  actionHandlers: {
    resetOrder: () => Promise<void>
    showIncrements: () => void
  }
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
  const listRef = useRef<OrderableListHandle>(null)
  const [promotedCount, setPromotedCount] = useState(0)
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
  const refreshCounts = useCallback(
    () =>
      client
        .fetch<Array<{ _id: string; orderRank?: string }>>(
          `*[
            _type == "arrangement" &&
            (${PROMOTED_ARRANGEMENTS_FILTER})
          ]{_id, orderRank}`,
          { today },
          { perspective: "previewDrafts" },
        )
        .then(documents => {
          const byId = new Map<string, { _id: string; orderRank?: string }>()
          for (const document of documents) {
            const id = document._id.replace(/^drafts\./, "")
            const current = byId.get(id)
            if (!current || document._id.startsWith("drafts.")) {
              byId.set(id, document)
            }
          }
          const uniqueDocuments = [...byId.values()]
          setPromotedCount(uniqueDocuments.length)
          setUnrankedCount(
            uniqueDocuments.filter(document => !document.orderRank).length,
          )
        }),
    [client, today],
  )

  useEffect(() => {
    void refreshCounts()
    const subscription = client
      .listen(
        `*[
          _type == "arrangement" &&
          (${PROMOTED_ARRANGEMENTS_FILTER})
        ]`,
        { today },
        { includeResult: false, visibility: "query" },
      )
      .subscribe(() => void refreshCounts())
    return () => subscription.unsubscribe()
  }, [client, refreshCounts, today])

  const initializeOrder = async () => {
    setInitializing(true)
    try {
      await listRef.current?.actionHandlers.resetOrder()
      await refreshCounts()
    } finally {
      setInitializing(false)
    }
  }
  const topCount = Math.min(3, promotedCount)
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
      <PromotedArrangementPicker onAdded={initializeOrder} today={today} />
      <OrderedListFrame $topCount={topCount}>
        <OrderableDocumentList options={options} ref={listRef} />
      </OrderedListFrame>
    </Stack>
  )
}
