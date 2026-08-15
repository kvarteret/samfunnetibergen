import { icons } from "@sanity/icons"
import { Button, Card, Flex, Stack, Text } from "@sanity/ui"
import { useFormValue } from "sanity"
import { IntentLink } from "sanity/router"

import { useListeningQuery } from "./useListeningQuery"

const FESTIVAL_DAYS_QUERY = `*[
  _type == "arrangement" &&
  eventKind == "festivalSession" &&
  parentEvent._ref == $parentId
] | order(dates[0].startDate asc, localizedTitle[language == "nb" && defined(value) && value != ""][0].value asc) {
  _id,
  "title": coalesce(localizedTitle[language == "nb" && defined(value) && value != ""][0].value, "Festivaldag uten tittel"),
  "date": dates[0].startDate,
  "time": dates[0].startTime
}`
const FESTIVAL_DAYS_LISTEN_QUERY = `*[
  _type == "arrangement" &&
  eventKind == "festivalSession" &&
  parentEvent._ref == $parentId
]`

type FestivalDay = {
  _id: string
  title?: string | null
  date?: string | null
  time?: string | null
}

const EMPTY_DAYS: FestivalDay[] = []

function publishedId(id: string) {
  return id.replace(/^drafts\./, "")
}

function deduplicateDays(days: FestivalDay[]) {
  const byId = new Map<string, FestivalDay>()
  for (const day of days) {
    const id = publishedId(day._id)
    const current = byId.get(id)
    if (!current || day._id.startsWith("drafts.")) {
      byId.set(id, { ...day, _id: id })
    }
  }
  return [...byId.values()].sort((a, b) => {
    const dateOrder = (a.date ?? "9999-99-99").localeCompare(
      b.date ?? "9999-99-99",
    )
    if (dateOrder !== 0) return dateOrder
    return (a.time ?? "99:99").localeCompare(b.time ?? "99:99")
  })
}

export function FestivalDayShortcutInput() {
  const id = String(useFormValue(["_id"]) ?? "").replace(/^drafts\./, "")
  const { data } = useListeningQuery({
    enabled: Boolean(id),
    initialValue: EMPTY_DAYS,
    listenQuery: FESTIVAL_DAYS_LISTEN_QUERY,
    params: { parentId: id },
    query: FESTIVAL_DAYS_QUERY,
  })
  const days = deduplicateDays(data)

  return (
    <Card border padding={3} radius={2} tone="primary">
      <Stack space={3}>
        <Flex align="center" gap={3} justify="space-between" wrap="wrap">
          <Stack space={2}>
            <Text weight="semibold">Festivaldager</Text>
            <Text muted size={1}>
              {days.length === 0
                ? "Ingen festivaldager er opprettet ennå."
                : `${days.length} ${days.length === 1 ? "festivaldag" : "festivaldager"}`}
            </Text>
          </Stack>
          <Button
            as={IntentLink}
            disabled={!id}
            icon={icons.add}
            intent="create"
            params={[
              {
                mode: "structure",
                template: "festival-day",
                type: "arrangement",
              },
              { parentId: id },
            ]}
            text="Legg til festivaldag"
            tone="primary"
          />
        </Flex>
        {days.length > 0 ? (
          <Stack space={1}>
            {days.map(day => (
              <Card key={day._id} border padding={2} radius={2} tone="default">
                <IntentLink
                  intent="edit"
                  params={{
                    id: day._id,
                    mode: "structure",
                    type: "arrangement",
                  }}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  <Flex align="center" justify="space-between" gap={3}>
                    <Text weight="semibold">
                      {day.title ?? "Festivaldag uten tittel"}
                    </Text>
                    <Text muted size={1}>
                      {[day.date, day.time].filter(Boolean).join(" · ") ||
                        "Ingen dato"}
                    </Text>
                  </Flex>
                </IntentLink>
              </Card>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  )
}
