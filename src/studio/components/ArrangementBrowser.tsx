import { icons } from "@sanity/icons"
import {
  Badge,
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
import { useEffect, useMemo, useState } from "react"
import { useClient } from "sanity"
import { IntentLink } from "sanity/router"

import {
  type ArrangementBrowserItem,
  type ArrangementFilterState,
  type ArrangementPreset,
  defaultArrangementFilters,
  filterArrangements,
} from "./arrangementFilters"
import { PromotedArrangementList } from "./PromotedArrangementList"

const API_VERSION = "2026-07-29"
const ARRANGEMENTS_QUERY = `*[
  _type == "arrangement" &&
  coalesce(eventKind, "single") in ["single", "seriesParent", "festivalParent"]
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

async function fetchBrowserData(client: ReturnType<typeof useClient>): Promise<{
  documents: ArrangementBrowserItem[]
  taxonomyDocuments: Taxonomy
}> {
  const [documents, taxonomyDocuments] = await Promise.all([
    client.fetch<ArrangementBrowserItem[]>(
      ARRANGEMENTS_QUERY,
      {},
      { perspective: "previewDrafts" },
    ),
    client.fetch<Taxonomy>(TAXONOMY_QUERY),
  ])
  return { documents, taxonomyDocuments }
}

const PRESET_TITLES: Record<ArrangementPreset, string> = {
  arrangements: "Alle",
  recurring: "Recurring",
  festivals: "Festivaler",
  promoted: "Fremhevede",
}

const PRESETS = [
  "arrangements",
  "recurring",
  "festivals",
  "promoted",
] as const satisfies readonly ArrangementPreset[]

function ArrangementBrowser() {
  const client = useClient({ apiVersion: API_VERSION })
  const [items, setItems] = useState<ArrangementBrowserItem[]>([])
  const [taxonomy, setTaxonomy] = useState<Taxonomy>({
    groups: [],
    types: [],
  })
  const [filters, setFilters] = useState<ArrangementFilterState>(() =>
    defaultArrangementFilters("arrangements"),
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const { documents, taxonomyDocuments } = await fetchBrowserData(client)
        if (!active) return
        setItems(documents)
        setTaxonomy(taxonomyDocuments)
      } catch {
        // Keep transient Studio connectivity failures from becoming
        // unhandled promise rejections.
      } finally {
        if (active) setLoading(false)
      }
    }

    void refresh()
    const subscription = client
      .listen(
        '*[_type in ["arrangement", "eventType", "eventTaxonomyGroup"]]',
        {},
        { includeResult: false, visibility: "query" },
      )
      .subscribe({
        next: () => void refresh(),
        error: () => undefined,
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client])

  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Oslo",
  }).format(new Date())
  const results = useMemo(
    () => filterArrangements(items, filters, today),
    [filters, items, today],
  )
  const update = <K extends keyof ArrangementFilterState>(
    key: K,
    value: ArrangementFilterState[K],
  ) => setFilters(current => ({ ...current, [key]: value }))
  const selectPreset = (preset: ArrangementPreset) =>
    setFilters(current => ({ ...current, preset }))
  const preset = filters.preset

  return (
    <Card height="fill" overflow="auto" padding={4}>
      <Stack space={4}>
        <Flex align="center" gap={3} justify="space-between" wrap="wrap">
          <Heading size={2}>Arrangementer</Heading>
          {preset !== "promoted" ? (
            <Button
              icon={icons.reset}
              mode="ghost"
              onClick={() => setFilters(defaultArrangementFilters(preset))}
              text="Nullstill filtre"
            />
          ) : null}
        </Flex>
        <Flex
          aria-label="Arrangementsvisning"
          gap={1}
          role="tablist"
          wrap="wrap"
        >
          {PRESETS.map(candidate => (
            <Button
              aria-selected={preset === candidate}
              key={candidate}
              mode={preset === candidate ? "default" : "ghost"}
              onClick={() => selectPreset(candidate)}
              role="tab"
              selected={preset === candidate}
              text={PRESET_TITLES[candidate]}
            />
          ))}
        </Flex>
        {preset === "promoted" ? (
          <PromotedArrangementList today={today} />
        ) : (
          <>
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
                <option value="all">Alle statuser</option>
                <option value="scheduled">Kommende</option>
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
                  <Heading size={1}>
                    Ingen arrangementer passer filtrene
                  </Heading>
                  <Text muted>
                    Prøv å nullstille eller endre ett av filtrene.
                  </Text>
                </Stack>
              </Card>
            ) : (
              <Stack space={2}>
                {results.map(item => {
                  const nextDate = [
                    ...(item.dates ?? []),
                    ...(item.childDates ?? []).map(startDate => ({
                      startDate,
                    })),
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
                  const isFestival = item.eventKind === "festivalParent"
                  return (
                    <Card border key={item._id} padding={3} radius={2}>
                      <Flex align="center" gap={3} justify="space-between">
                        <Stack space={2}>
                          <IntentLink
                            intent="edit"
                            params={{
                              id: item._id,
                              mode: "structure",
                              type: "arrangement",
                            }}
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            <Text size={2} weight="semibold">
                              {item.title ?? "Arrangement uten tittel"}
                            </Text>
                          </IntentLink>
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
                        <Flex align="center" gap={2}>
                          {isFestival ? (
                            <Button
                              as={IntentLink}
                              intent="create"
                              mode="ghost"
                              params={[
                                {
                                  mode: "structure",
                                  template: "festival-day",
                                  type: "arrangement",
                                },
                                { parentId: item._id },
                              ]}
                              text="Legg til festivaldag"
                            />
                          ) : null}
                          {needsDays ? (
                            <Badge tone="caution">Mangler kommende dager</Badge>
                          ) : null}
                        </Flex>
                      </Flex>
                    </Card>
                  )
                })}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Card>
  )
}

export const ArrangementsPane = () => <ArrangementBrowser />
