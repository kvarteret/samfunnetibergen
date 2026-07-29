import { icons } from "@sanity/icons"
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Select,
  Spinner,
  Stack,
  Text,
  TextInput,
} from "@sanity/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useClient } from "sanity"
import { IntentLink } from "sanity/router"

import {
  type ArrangementBrowserItem,
  type ArrangementFilterState,
  type ArrangementPreset,
  defaultArrangementFilters,
  filterArrangements,
} from "./arrangementFilters"

const API_VERSION = "2026-07-29"
const ARRANGEMENTS_QUERY = `*[
  _type == "arrangement" &&
  coalesce(eventKind, "single") in ["single", "seriesParent"]
] {
  _id,
  title,
  "eventKind": coalesce(eventKind, "single"),
  "approvalStatus": coalesce(approvalStatus, "pending"),
  "eventStatus": coalesce(eventStatus, "scheduled"),
  "isRecurring": coalesce(isRecurring, false),
  "isPromoted": coalesce(isPromoted, false),
  dates[]{startDate, startTime},
  "eventType": eventType->{_id, name, "taxonomyGroup": taxonomyGroup->{_id, name}},
  "childDates": *[
    _type == "arrangement" &&
    parentEvent._ref == ^._id &&
    defined(dates[0].startDate)
  ].dates[0].startDate
}`
const TAXONOMY_QUERY = `{
  "groups": *[_type == "eventTaxonomyGroup"] | order(orderRank asc){_id, name},
  "types": *[_type == "eventType"] | order(orderRank asc){_id, name, "groupId": taxonomyGroup._ref}
}`

type Taxonomy = {
  groups: Array<{ _id: string; name?: string }>
  types: Array<{ _id: string; name?: string; groupId?: string }>
}

const PRESET_TITLES: Record<ArrangementPreset, string> = {
  arrangements: "Arrangementer",
  recurring: "recurring",
  promoted: "Fremhevede arrangementer",
}

function ArrangementBrowser({ preset }: { preset: ArrangementPreset }) {
  const client = useClient({ apiVersion: API_VERSION })
  const [items, setItems] = useState<ArrangementBrowserItem[]>([])
  const [taxonomy, setTaxonomy] = useState<Taxonomy>({
    groups: [],
    types: [],
  })
  const [filters, setFilters] = useState<ArrangementFilterState>(() =>
    defaultArrangementFilters(preset),
  )
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [documents, taxonomyDocuments] = await Promise.all([
      client.fetch<ArrangementBrowserItem[]>(
        ARRANGEMENTS_QUERY,
        {},
        { perspective: "previewDrafts" },
      ),
      client.fetch<Taxonomy>(TAXONOMY_QUERY),
    ])
    setItems(documents)
    setTaxonomy(taxonomyDocuments)
    setLoading(false)
  }, [client])

  useEffect(() => {
    void refresh()
    const subscription = client
      .listen(
        '*[_type in ["arrangement", "eventType", "eventTaxonomyGroup"]]',
        {},
        { includeResult: false, visibility: "query" },
      )
      .subscribe(() => void refresh())
    return () => subscription.unsubscribe()
  }, [client, refresh])

  const today = new Date().toISOString().slice(0, 10)
  const results = useMemo(
    () => filterArrangements(items, filters, today),
    [filters, items, today],
  )
  const update = <K extends keyof ArrangementFilterState>(
    key: K,
    value: ArrangementFilterState[K],
  ) => setFilters(current => ({ ...current, [key]: value }))

  return (
    <Card height="fill" overflow="auto" padding={4}>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Heading size={2}>{PRESET_TITLES[preset]}</Heading>
          <Button
            icon={icons.reset}
            mode="ghost"
            onClick={() => setFilters(defaultArrangementFilters(preset))}
            text="Nullstill filtre"
          />
        </Flex>
        <Grid columns={[1, 1, 3]} gap={3}>
          <TextInput
            aria-label="Søk i titler"
            icon={icons.search}
            onChange={event => update("query", event.currentTarget.value)}
            placeholder="Søk i titler"
            value={filters.query}
          />
          <Select
            aria-label="Dato"
            onChange={event =>
              update(
                "date",
                event.currentTarget.value as ArrangementFilterState["date"],
              )
            }
            value={filters.date}
          >
            <option value="all">Alle datoer</option>
            <option value="upcoming">Kommende</option>
            <option value="past">Tidligere</option>
          </Select>
          <Select
            aria-label="Synlighet"
            onChange={event =>
              update(
                "visibility",
                event.currentTarget
                  .value as ArrangementFilterState["visibility"],
              )
            }
            value={filters.visibility}
          >
            <option value="approved">Godkjent</option>
            <option value="paused">Skjult</option>
            <option value="archived">Arkivert</option>
            <option value="all">Alle</option>
          </Select>
          <Select
            aria-label="Faktisk status"
            onChange={event =>
              update(
                "eventStatus",
                event.currentTarget
                  .value as ArrangementFilterState["eventStatus"],
              )
            }
            value={filters.eventStatus}
          >
            <option value="all">Alle faktiske statuser</option>
            <option value="scheduled">Planlagt</option>
            <option value="cancelled">Avlyst</option>
            <option value="postponed">Utsatt</option>
          </Select>
          <Select
            aria-label="Kategori"
            onChange={event =>
              update("taxonomyGroupId", event.currentTarget.value || null)
            }
            value={filters.taxonomyGroupId ?? ""}
          >
            <option value="">Alle kategorier</option>
            {taxonomy.groups.map(group => (
              <option key={group._id} value={group._id}>
                {group.name ?? "Kategori uten navn"}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Arrangementstype"
            onChange={event =>
              update("eventTypeId", event.currentTarget.value || null)
            }
            value={filters.eventTypeId ?? ""}
          >
            <option value="">Alle arrangementstyper</option>
            {taxonomy.types
              .filter(
                type =>
                  !filters.taxonomyGroupId ||
                  type.groupId === filters.taxonomyGroupId,
              )
              .map(type => (
                <option key={type._id} value={type._id}>
                  {type.name ?? "Type uten navn"}
                </option>
              ))}
          </Select>
        </Grid>
        <Text muted size={1}>
          {loading
            ? "Henter arrangementer …"
            : `${results.length} ${results.length === 1 ? "resultat" : "resultater"}`}
        </Text>
        {loading ? (
          <Flex align="center" gap={3} padding={5}>
            <Spinner />
            <Text>Laster arrangementer …</Text>
          </Flex>
        ) : results.length === 0 ? (
          <Card border padding={5} radius={2} tone="transparent">
            <Stack space={3}>
              <Heading size={1}>Ingen arrangementer passer filtrene</Heading>
              <Text muted>Prøv å nullstille eller endre ett av filtrene.</Text>
            </Stack>
          </Card>
        ) : (
          <Stack space={2}>
            {results.map(item => {
              const nextDate = [
                ...(item.dates ?? []),
                ...(item.childDates ?? []).map(startDate => ({ startDate })),
              ]
                .map(date => date.startDate)
                .filter((date): date is string =>
                  Boolean(date && date >= today),
                )
                .sort()[0]
              const needsDays =
                preset === "recurring" &&
                !(item.childDates ?? []).some(date => {
                  const horizon = new Date()
                  horizon.setDate(horizon.getDate() + 8 * 7)
                  return date >= horizon.toISOString().slice(0, 10)
                })
              return (
                <Card
                  as={IntentLink}
                  border
                  intent="edit"
                  key={item._id}
                  padding={3}
                  params={{ id: item._id, type: "arrangement" }}
                  radius={2}
                  style={{ textDecoration: "none" }}
                >
                  <Flex align="center" gap={3} justify="space-between">
                    <Stack space={2}>
                      <Text size={2} weight="semibold">
                        {item.title ?? "Arrangement uten tittel"}
                      </Text>
                      <Text muted size={1}>
                        {[
                          nextDate,
                          item.eventType?.name,
                          item.eventStatus === "cancelled"
                            ? "Avlyst"
                            : item.eventStatus === "postponed"
                              ? "Utsatt"
                              : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Ingen dato"}
                      </Text>
                    </Stack>
                    {needsDays ? (
                      <Badge tone="caution">Mangler kommende dager</Badge>
                    ) : null}
                  </Flex>
                </Card>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

export const ArrangementsPane = () => (
  <ArrangementBrowser preset="arrangements" />
)
export const RecurringArrangementsPane = () => (
  <ArrangementBrowser preset="recurring" />
)
export const PromotedArrangementsPane = () => (
  <ArrangementBrowser preset="promoted" />
)
