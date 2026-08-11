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
import { useId, useMemo, useState } from "react"
import { IntentLink } from "sanity/router"

import {
  ARRANGEMENT_LIST_STATUS_LABELS,
  type ArrangementBrowserItem,
  type ArrangementFilterState,
  arrangementListStatus,
  defaultArrangementFilters,
  filterArrangements,
  latestArrangementDate,
  todayInOslo,
} from "./arrangementFilters"
import { useListeningQuery } from "./useListeningQuery"

const ARRANGEMENTS_QUERY = `*[
  _type == "arrangement" &&
  approvalStatus == "approved" &&
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
    approvalStatus == "approved" &&
    defined(dates[0].startDate)
  ].dates[0].startDate
}`
const TAXONOMY_QUERY = `{
  "groups": *[_type == "eventTaxonomyGroup"] | order(orderRank asc){_id, name},
  "types": *[_type == "eventType"] | order(orderRank asc){_id, name, "groupId": taxonomyGroup._ref}
}`
const BROWSER_DATA_QUERY = `{
  "documents": ${ARRANGEMENTS_QUERY},
  "taxonomyDocuments": ${TAXONOMY_QUERY}
}`
const BROWSER_LISTEN_QUERY =
  '*[_type in ["arrangement", "eventType", "eventTaxonomyGroup"]]'

type Taxonomy = {
  groups: Array<{ _id: string; name?: string }>
  types: Array<{ _id: string; name?: string; groupId?: string }>
}

type BrowserData = {
  documents: ArrangementBrowserItem[]
  taxonomyDocuments: Taxonomy
}

const EMPTY_BROWSER_DATA: BrowserData = {
  documents: [],
  taxonomyDocuments: {
    groups: [],
    types: [],
  },
}

function ArrangementBrowser() {
  const filterId = useId()
  const [filters, setFilters] = useState<ArrangementFilterState>(
    defaultArrangementFilters,
  )
  const {
    data: { documents: items, taxonomyDocuments: taxonomy },
    loading,
  } = useListeningQuery({
    initialValue: EMPTY_BROWSER_DATA,
    listenQuery: BROWSER_LISTEN_QUERY,
    query: BROWSER_DATA_QUERY,
  })

  const today = todayInOslo()
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
              <option value="completed">Gjennomført</option>
              <option value="archived">Arkivert</option>
              <option value="cancelled">Kansellert</option>
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
              const status = arrangementListStatus(item, today)
              const statusLabel = ARRANGEMENT_LIST_STATUS_LABELS[status]
              const nextDate =
                [
                  ...(item.dates ?? []),
                  ...(item.childDates ?? []).map(startDate => ({
                    startDate,
                  })),
                ]
                  .map(date => date.startDate)
                  .filter((date): date is string =>
                    Boolean(date && date >= today),
                  )
                  .sort()[0] ?? latestArrangementDate(item)
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
                        {[nextDate, item.eventType?.name]
                          .filter(Boolean)
                          .join(" · ") || "Ingen dato"}
                      </Text>
                    </Stack>
                    <Flex align="center" gap={2}>
                      <Badge
                        tone={
                          status === "cancelled"
                            ? "critical"
                            : status === "completed"
                              ? "positive"
                              : status === "archived"
                                ? "default"
                                : "primary"
                        }
                      >
                        {statusLabel}
                      </Badge>
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
