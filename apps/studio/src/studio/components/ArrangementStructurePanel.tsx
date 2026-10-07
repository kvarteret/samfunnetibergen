import { icons } from "@sanity/icons"
import { Badge, Button, Card, Flex, Grid, Stack, Text } from "@sanity/ui"
import { useToast } from "@sanity/ui/toast"
import { useState } from "react"
import { useClient, useDocumentOperation } from "sanity"
import { usePaneRouter } from "sanity/structure"
import styled from "styled-components"

import { festivalDayInitialValue } from "../templates/arrangementTemplates"
import {
  formatStudioDate,
  normalizeDocumentId,
  todayInOslo,
} from "./arrangementFilters"
import { useListeningQuery } from "./useListeningQuery"

type Kind = "single" | "seriesParent" | "festivalParent"

export const FORMATS: Array<{
  kind: Kind
  title: string
  description: string
}> = [
  {
    kind: "single",
    title: "Arrangement",
    description:
      "Én side med én eller flere datoer. Hver dato vises i kalenderen.",
  },
  {
    kind: "seriesParent",
    title: "Serie",
    description:
      "Gjentas etter et mønster. Hver dag er en egen oppføring som kan endres eller avlyses.",
  },
  {
    kind: "festivalParent",
    title: "Festival",
    description: "Festivaler innebærer at hver dag er unik.",
  },
]

const RELATED_QUERY = `{
  "parent": *[_id in [$parentId, "drafts." + $parentId]] | order(_id desc)[0]{
    _id,
    eventKind,
    "title": localizedTitle[language == "nb"][0].value
  },
  "days": *[_type == "arrangement" && parentEvent._ref in [$documentId, $parentId] && $documentId != ""]{
    _id,
    "parentRef": parentEvent._ref,
    eventStatus,
    "title": localizedTitle[language == "nb"][0].value,
    "date": dates[0].startDate,
    "time": dates[0].startTime
  }
}`
const RELATED_LISTEN_QUERY = `*[_type == "arrangement" && (_id in [$parentId, "drafts." + $parentId] || parentEvent._ref in [$documentId, $parentId])]`

type Day = {
  _id: string
  parentRef: string
  eventStatus?: string | null
  title?: string | null
  date?: string | null
  time?: string | null
}

type Related = {
  parent: { _id: string; eventKind?: string; title?: string | null } | null
  days: Day[]
}

const EMPTY: Related = { parent: null, days: [] }

const DayButton = styled.button`
  all: unset;
  display: block;
  cursor: pointer;
  border-radius: 3px;
  &:focus-visible { outline: 2px solid var(--card-focus-ring-color, currentColor); }
`

function scrollParent(element: HTMLElement): HTMLElement | null {
  let current = element.parentElement
  while (current) {
    const { overflowY } = getComputedStyle(current)
    if (
      /(auto|scroll)/.test(overflowY) &&
      current.scrollHeight > current.clientHeight
    )
      return current
    current = current.parentElement
  }
  return null
}

/** Draft wins over published; returns days sorted by date and time. */
export function daysFor(days: Day[], parentId: string): Day[] {
  const byId = new Map<string, Day>()
  for (const day of days) {
    if (day.parentRef !== parentId) continue
    const id = normalizeDocumentId(day._id)
    if (!byId.has(id) || day._id.startsWith("drafts.")) {
      byId.set(id, { ...day, _id: id })
    }
  }
  return [...byId.values()].sort(
    (a, b) =>
      (a.date ?? "9999").localeCompare(b.date ?? "9999") ||
      (a.time ?? "99").localeCompare(b.time ?? "99"),
  )
}

/** Patch that turns an arrangement into another top-level format. */
export function formatPatch(
  kind: Kind,
  current: { rrule?: string | null; dates?: unknown[] | null },
) {
  if (kind === "single") {
    return [
      { set: { eventKind: "single", isRecurring: false } },
      { unset: ["rrule"] },
    ]
  }
  if (kind === "festivalParent") {
    return [
      { set: { eventKind: "festivalParent", isRecurring: false } },
      { unset: ["rrule", "dates"] },
    ]
  }
  return [
    {
      set: {
        eventKind: "seriesParent",
        isRecurring: true,
        rrule: current.rrule || "FREQ=WEEKLY",
        ...(current.dates && current.dates.length > 1
          ? { dates: current.dates.slice(0, 1) }
          : {}),
      },
    },
  ]
}

function DayRow({ day, onOpen }: { day: Day; onOpen: () => void }) {
  return (
    <DayButton onClick={onOpen} type="button">
      <Card border padding={2} radius={2}>
        <Flex align="center" gap={3} justify="space-between">
          <Text size={1} weight="semibold">
            {[formatStudioDate(day.date ?? undefined), day.time]
              .filter(Boolean)
              .join(" kl. ") || "Uten dato"}
          </Text>
          <Flex align="center" gap={2}>
            {day.title ? (
              <Text muted size={1} textOverflow="ellipsis">
                {day.title}
              </Text>
            ) : null}
            {day.eventStatus === "cancelled" ? (
              <Badge tone="critical">Avlyst</Badge>
            ) : null}
          </Flex>
        </Flex>
      </Card>
    </DayButton>
  )
}

export function ArrangementStructurePanel({
  document,
}: {
  document: {
    _id: string
    eventKind?: string | null
    parentEvent?: { _ref?: string | null } | null
    rrule?: string | null
    dates?: unknown[] | null
  }
}) {
  const { replaceCurrent } = usePaneRouter()
  const client = useClient({ apiVersion: "2026-07-29" })
  const toast = useToast()
  const documentId = normalizeDocumentId(document._id)
  const kind = document.eventKind ?? "single"
  const parentId = normalizeDocumentId(document.parentEvent?._ref ?? "")
  const operations = useDocumentOperation(documentId, "arrangement")
  const [creating, setCreating] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const { data } = useListeningQuery({
    initialValue: EMPTY,
    listenQuery: RELATED_LISTEN_QUERY,
    params: { documentId, parentId },
    query: RELATED_QUERY,
  })
  const open = (id: string) => replaceCurrent({ id })

  if (kind === "seriesInstance" || kind === "festivalSession") {
    const siblings = daysFor(data.days, parentId)
    const index = siblings.findIndex(day => day._id === documentId)
    const previous = siblings[index - 1]
    const next = siblings[index + 1]
    return (
      <Card border padding={3} radius={2} tone="transparent">
        <Flex align="center" gap={2} justify="space-between" wrap="wrap">
          <Button
            icon={icons["arrow-left"]}
            mode="bleed"
            onClick={() => parentId && open(parentId)}
            text={`${kind === "seriesInstance" ? "Seriedag i" : "Festivaldag i"} ${data.parent?.title ?? "…"}`}
          />
          <Flex gap={1}>
            <Button
              disabled={!previous}
              icon={icons["chevron-left"]}
              mode="bleed"
              onClick={() => previous && open(previous._id)}
              title="Forrige dag"
            />
            <Text muted size={1} style={{ alignSelf: "center" }}>
              {index >= 0 ? `${index + 1} av ${siblings.length}` : ""}
            </Text>
            <Button
              disabled={!next}
              icon={icons["chevron-right"]}
              mode="bleed"
              onClick={() => next && open(next._id)}
              title="Neste dag"
            />
          </Flex>
        </Flex>
      </Card>
    )
  }

  const switchFormat = (anchor: HTMLElement, nextKind: Kind) => {
    const scroller = scrollParent(anchor)
    const top = scroller?.scrollTop ?? 0
    operations.patch.execute(formatPatch(nextKind, document))
    // Fields appear and disappear below; hold the view still while they do.
    let frames = 0
    const hold = () => {
      if (scroller) scroller.scrollTop = top
      if (++frames < 20) requestAnimationFrame(hold)
    }
    requestAnimationFrame(hold)
  }

  const days = daysFor(data.days, documentId)
  const locked = days.length > 0
  const today = todayInOslo()
  const upcoming = days.filter(day => (day.date ?? "") >= today)
  const shownDays = showAll ? days : upcoming.slice(0, 5)
  const addFestivalDay = async () => {
    setCreating(true)
    try {
      const id = crypto.randomUUID()
      await client.create({
        _id: `drafts.${id}`,
        _type: "arrangement",
        ...festivalDayInitialValue(documentId),
      })
      open(id)
    } catch {
      toast.push({ status: "error", title: "Kunne ikke opprette festivaldag" })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card border padding={3} radius={2}>
      <Stack gap={3}>
        <Grid gridTemplateColumns={[1, 1, 3]} gap={2}>
          {FORMATS.map(format => {
            const selected = format.kind === kind
            return (
              <Card
                as="button"
                border
                disabled={locked && !selected}
                key={format.kind}
                onClick={event =>
                  !selected && switchFormat(event.currentTarget, format.kind)
                }
                // Keep focus where it is; a focused button makes Studio
                // scroll the form when the fields below change.
                onMouseDown={event => event.preventDefault()}
                type="button"
                padding={3}
                radius={2}
                style={{
                  cursor: selected ? "default" : "pointer",
                  textAlign: "left",
                }}
                tone={selected ? "primary" : "default"}
              >
                <Stack gap={2}>
                  <Text size={1} weight="semibold">
                    {format.title}
                  </Text>
                  <Text muted size={1}>
                    {format.description}
                  </Text>
                </Stack>
              </Card>
            )
          })}
        </Grid>
        {kind !== "single" ? (
          <Stack gap={2}>
            <Flex align="center" justify="space-between">
              <Text size={1} weight="semibold">
                Dager ({days.length})
              </Text>
              {kind === "festivalParent" ? (
                <Button
                  fontSize={1}
                  icon={icons.add}
                  loading={creating}
                  mode="ghost"
                  onClick={() => void addFestivalDay()}
                  text="Festivaldag"
                />
              ) : null}
            </Flex>
            {shownDays.map(day => (
              <DayRow day={day} key={day._id} onOpen={() => open(day._id)} />
            ))}
            {shownDays.length < days.length ? (
              <Button
                fontSize={1}
                mode="bleed"
                onClick={() => setShowAll(true)}
                text={`Vis alle ${days.length}`}
              />
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  )
}
