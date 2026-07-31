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
import { useEffect, useId, useMemo, useState } from "react"
import { useClient } from "sanity"
import { IntentLink } from "sanity/router"

import {
  type ArrangementBrowserItem,
  type ArrangementFilterState,
  defaultArrangementFilters,
  filterArrangements,
} from "./arrangementFilters"

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

function ArrangementBrowser() {
  const client = useClient({ apiVersion: API_VERSION })
  const filterId = useId()
  const [items, setItems] = useState<ArrangementBrowserItem[]>([])
  const [taxonomy, setTaxonomy] = useState<Taxonomy>({
    groups: [],
    types: [],
  })
  const [filters, setFilters] = useState<ArrangementFilterState>(
    defaultArrangementFilters,
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

  return (
    <Card height="fill" overflow="auto" padding={4}>
      <Stack space={4}>
        <Flex align="center" gap={3} justify="space-between" wrap="wrap">
          <Heading size={2}>Arrangementer</Heading>
          <Button
            icon={icons.reset}
            mode="ghost"
            onClick={() => setFilters(defaultArrangementFilters())}
            text="Nullstill filtre"
          />
        </Flex>
        <Grid columns={[1, 1, 3]} gap={3}>
          <Stack space={2}>
            <Text
              as="label"
              htmlFor={`${filterId}-query`}
              size={1}
              weight="semibold"
            >
              Søk
            </Text>
            <TextInput
              id={`${filterId}-query`}
              icon={icons.search}
              onChange={event => update("query", event.currentTarget.value)}
              placeholder="Søk i titler"
              value={filters.query}
            />
          </Stack>
          <Stack space={2}>
            <Text
              as="label"
              htmlFor={`${filterId}-date`}
              size={1}
              weight="semibold"
            >
              Dato
            </Text>
            <Select
              id={`${filterId}-date`}
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
          </Stack>
          <Stack space={2}>
            <Text
              as="label"
              htmlFor={`${filterId}-format`}
              size={1}
              weight="semibold"
            >
              Format
            </Text>
            <Select
              id={`${filterId}-format`}
              onChange={event =>
                update(
                  "format",
                  event.currentTarget.value as ArrangementFilterState["format"],
                )
              }
              value={filters.format}
            >
              <option value="all">Alle</option>
              <option value="single">Enkeltarrangementer</option>
              <option value="recurring">Recurring</option>
              <option value="festivals">Festivaler</option>
            </Select>
          </Stack>
          <Stack space={2}>
            <Text
              as="label"
              htmlFor={`${filterId}-status`}
              size={1}
              weight="semibold"
            >
              Status
            </Text>
            <Select
              id={`${filterId}-status`}
              onChange={event =>
                update(
                  "status",
                  event.currentTarget.value as ArrangementFilterState["status"],
                )
              }
              value={filters.status}
            >
              <option value="approved">Godkjent</option>
              <option value="paused">Skjult</option>
              <option value="archived">Arkivert</option>
              <option value="cancelled">Avlyst</option>
              <option value="postponed">Utsatt</option>
              <option value="all">Alle statuser</option>
            </Select>
          </Stack>
          <Stack space={2}>
            <Text
              as="label"
              htmlFor={`${filterId}-category`}
              size={1}
              weight="semibold"
            >
              Kategori
            </Text>
            <Select
              id={`${filterId}-category`}
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
          </Stack>
          <Stack space={2}>
            <Text
              as="label"
              htmlFor={`${filterId}-type`}
              size={1}
              weight="semibold"
            >
              Arrangementstype
            </Text>
            <Select
              id={`${filterId}-type`}
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
          </Stack>
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
                item.eventKind === "seriesParent" &&
                item.isRecurring === true &&
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
      </Stack>
    </Card>
  )
}

export const ArrangementsPane = () => <ArrangementBrowser />
