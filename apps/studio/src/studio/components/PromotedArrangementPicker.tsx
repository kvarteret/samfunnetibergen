import { icons } from "@sanity/icons"
import { Button, Card, Flex, Spinner, Stack, Text, TextInput } from "@sanity/ui"
import { useCallback, useMemo, useState } from "react"
import { useClient } from "sanity"

import { PROMOTABLE_ARRANGEMENTS_FILTER } from "./promotedArrangementFilter"

const API_VERSION = "2026-07-29"
const CANDIDATES_QUERY = `*[
  _type == "arrangement" &&
  (${PROMOTABLE_ARRANGEMENTS_FILTER})
] | order(localizedTitle[language == "nb" && defined(value) && value != ""][0].value asc) {
  _id,
  "title": coalesce(localizedTitle[language == "nb" && defined(value) && value != ""][0].value, "Arrangement uten tittel"),
  "eventKind": coalesce(eventKind, "single")
}`

type PromotionCandidate = {
  _id: string
  title?: string | null
  eventKind: "single" | "seriesParent" | "festivalParent"
}

const KIND_LABELS: Record<PromotionCandidate["eventKind"], string> = {
  single: "Arrangement",
  seriesParent: "Serie",
  festivalParent: "Festival",
}

export function PromotedArrangementPicker({
  onAdded,
  selectedIds,
  today,
}: {
  onAdded: () => Promise<void>
  selectedIds: string[]
  today: string
}) {
  const client = useClient({ apiVersion: API_VERSION })
  const [candidates, setCandidates] = useState<PromotionCandidate[]>([])
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setCandidates(
        await client.fetch<PromotionCandidate[]>(
          CANDIDATES_QUERY,
          { today },
          { perspective: "published" },
        ),
      )
    } finally {
      setLoading(false)
    }
  }, [client, today])

  const openPicker = () => {
    setOpen(true)
    void refresh()
  }

  const visibleCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("nb")
    return candidates
      .filter(candidate => !selectedIds.includes(candidate._id))
      .filter(candidate =>
        normalizedQuery
          ? (candidate.title ?? "")
              .toLocaleLowerCase("nb")
              .includes(normalizedQuery)
          : true,
      )
      .slice(0, 8)
  }, [candidates, query, selectedIds])

  const add = async (candidate: PromotionCandidate) => {
    setAddingId(candidate._id)
    try {
      const draftId = `drafts.${candidate._id}`
      const hasDraft = await client.fetch<boolean>(
        "defined(*[_id == $draftId][0])",
        { draftId },
        { perspective: "raw" },
      )
      const transaction = client.transaction().patch(candidate._id, patch =>
        patch.set({
          isPromoted: true,
          promotedOrder: selectedIds.length,
          promotedPlacement: selectedIds.length < 3 ? "top" : "pool",
        }),
      )
      if (hasDraft) {
        transaction.patch(draftId, patch =>
          patch.set({
            isPromoted: true,
            promotedOrder: selectedIds.length,
            promotedPlacement: selectedIds.length < 3 ? "top" : "pool",
          }),
        )
      }
      await transaction.commit({ visibility: "sync" })
      await onAdded()
      setQuery("")
      setOpen(false)
    } finally {
      setAddingId(null)
    }
  }

  if (!open) {
    return (
      <Button
        icon={icons.add}
        onClick={openPicker}
        text="Legg til arrangement"
        tone="primary"
      />
    )
  }

  return (
    <Card border padding={3} radius={2}>
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <TextInput
            aria-label="Søk etter arrangement"
            icon={icons.search}
            onChange={event => setQuery(event.currentTarget.value)}
            placeholder="Søk etter arrangement"
            value={query}
          />
          <Button
            icon={icons.close}
            mode="ghost"
            onClick={() => setOpen(false)}
            text="Lukk"
          />
        </Flex>
        {loading ? (
          <Flex align="center" gap={2}>
            <Spinner />
            <Text muted size={1}>
              Henter arrangementer …
            </Text>
          </Flex>
        ) : visibleCandidates.length === 0 ? (
          <Text muted size={1}>
            Ingen kommende arrangementer passer søket.
          </Text>
        ) : (
          <Stack space={2}>
            {visibleCandidates.map(candidate => (
              <Card border key={candidate._id} padding={3} radius={2}>
                <Flex align="center" gap={3} justify="space-between">
                  <Stack space={2}>
                    <Text weight="semibold">
                      {candidate.title ?? "Arrangement uten tittel"}
                    </Text>
                    <Text muted size={1}>
                      {KIND_LABELS[candidate.eventKind]}
                    </Text>
                  </Stack>
                  <Button
                    disabled={addingId !== null}
                    loading={addingId === candidate._id}
                    onClick={() => void add(candidate)}
                    text="Legg til"
                  />
                </Flex>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
