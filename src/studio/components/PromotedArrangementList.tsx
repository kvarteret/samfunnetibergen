import { OrderableDocumentList } from "@sanity/orderable-document-list"
import { Badge, Button, Card, Flex, Stack, Text } from "@sanity/ui"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useClient, usePerspective } from "sanity"
import styled from "styled-components"

import { PROMOTED_ARRANGEMENTS_FILTER } from "./promotedArrangementFilter"

const API_VERSION = "2026-07-29"

type OrderableListHandle = {
  actionHandlers: {
    resetOrder: () => Promise<void>
    showIncrements: () => void
  }
}

const OrderedListFrame = styled.div`
  [data-rfd-droppable-id="documentSortZone"] > div:nth-child(3) {
    border-bottom: 2px solid var(--card-border-color, currentColor);
    margin-bottom: 1rem;
    padding-bottom: 1rem;
  }
`

export function PromotedArrangementList({ today }: { today: string }) {
  const client = useClient({ apiVersion: API_VERSION })
  const { perspectiveStack } = usePerspective()
  const listRef = useRef<OrderableListHandle>(null)
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
  const refreshUnrankedCount = useCallback(
    () =>
      client
        .fetch<number>(
          `count(*[
            _type == "arrangement" &&
            (${PROMOTED_ARRANGEMENTS_FILTER}) &&
            !defined(orderRank)
          ])`,
          { today },
          { perspective: "previewDrafts" },
        )
        .then(setUnrankedCount),
    [client, today],
  )

  useEffect(() => {
    void refreshUnrankedCount()
    const subscription = client
      .listen(
        `*[
          _type == "arrangement" &&
          (${PROMOTED_ARRANGEMENTS_FILTER})
        ]`,
        { today },
        { includeResult: false, visibility: "query" },
      )
      .subscribe(() => void refreshUnrankedCount())
    return () => subscription.unsubscribe()
  }, [client, refreshUnrankedCount, today])

  const initializeOrder = async () => {
    setInitializing(true)
    try {
      await listRef.current?.actionHandlers.resetOrder()
      await refreshUnrankedCount()
    } finally {
      setInitializing(false)
    }
  }

  return (
    <Stack space={4}>
      <Card border padding={4} radius={2} tone="primary">
        <Stack space={3}>
          <Flex align="center" gap={2} wrap="wrap">
            <Badge tone="positive">Plass 1–3</Badge>
            <Text weight="semibold">Vises øverst på forsiden</Text>
          </Flex>
          <Text muted size={1}>
            Dra arrangementene til ønsket rekkefølge. Linjen etter tredje
            arrangement markerer skillet. Avsluttede arrangementer fjernes
            automatisk fra listen og forsiden.
          </Text>
          <Flex gap={2} wrap="wrap">
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
            <Button
              mode="ghost"
              onClick={() => listRef.current?.actionHandlers.showIncrements()}
              text="Vis flytteknapper"
            />
          </Flex>
        </Stack>
      </Card>
      <OrderedListFrame>
        <OrderableDocumentList options={options} ref={listRef} />
      </OrderedListFrame>
    </Stack>
  )
}
