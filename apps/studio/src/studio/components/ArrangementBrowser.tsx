import { icons } from "@sanity/icons"
import { createImageUrlBuilder } from "@sanity/image-url"
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
import { useClient } from "sanity"
import { IntentLink } from "sanity/router"
import { usePaneRouter } from "sanity/structure"
import styled from "styled-components"

import {
  type ArrangementBrowserItem,
  type ArrangementFilterState,
  defaultArrangementFilters,
  filterArrangements,
  formatStudioDate,
  nextArrangementDate,
  todayInOslo,
} from "./arrangementFilters"
import { useListeningQuery } from "./useListeningQuery"

const RowLink = styled.div`
  flex: 1;
  min-width: 0;
  a { color: inherit; text-decoration: none; display: block; border-radius: 3px; }
  a:focus-visible { outline: 2px solid var(--card-focus-ring-color, currentColor); outline-offset: 2px; }
`

const Thumbnail = styled.span`
  display: grid;
  place-items: center;
  flex: none;
  width: 64px;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 3px;
  background: var(--card-muted-bg-color, rgb(127 127 127 / 0.15));
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`

const ARRANGEMENTS_QUERY = `*[
  _type == "arrangement" &&
  approvalStatus == "approved" &&
  coalesce(eventKind, "single") in ["single", "seriesParent", "festivalParent"]
] {
  _id,
  "title": coalesce(localizedTitle[language == "nb" && defined(value) && value != ""][0].value, "Arrangement uten tittel"),
  "eventKind": coalesce(eventKind, "single"),
  "approvalStatus": coalesce(approvalStatus, "pending"),
  "eventStatus": coalesce(eventStatus, "scheduled"),
  "isRecurring": coalesce(isRecurring, false),
  _createdAt,
  image,
  "imageRef": coalesce(image.asset._ref, ""),
  "roomTitle": room->localizedTitle[language == "nb"][0].value,
  dates[]{startDate, startTime, endTime},
  "eventType": eventType->{_id, "name": coalesce(localizedName[language == "nb" && defined(value) && value != ""][0].value, "Type uten navn"), "taxonomyGroup": taxonomyGroup->{_id, "name": coalesce(localizedName[language == "nb" && defined(value) && value != ""][0].value, "Gruppe uten navn")}},
  "childDates": *[
    _type == "arrangement" &&
    parentEvent._ref == ^._id &&
    approvalStatus == "approved" &&
    defined(dates[0].startDate)
  ].dates[0].startDate
}`
const TAXONOMY_QUERY = `{
  "groups": *[_type == "eventTaxonomyGroup"] | order(orderRank asc){_id, "name": coalesce(localizedName[language == "nb" && defined(value) && value != ""][0].value, "Gruppe uten navn")},
  "types": *[_type == "eventType"] | order(orderRank asc){_id, "name": coalesce(localizedName[language == "nb" && defined(value) && value != ""][0].value, "Type uten navn"), "groupId": taxonomyGroup._ref}
}`
const BROWSER_DATA_QUERY = `{
  "documents": ${ARRANGEMENTS_QUERY},
  "taxonomyDocuments": ${TAXONOMY_QUERY}
}`
const BROWSER_LISTEN_QUERY =
  '*[_type in ["arrangement", "eventType", "eventTaxonomyGroup"]]'

type BrowserRow = ArrangementBrowserItem & {
  _createdAt?: string
  image?: { asset?: { _ref?: string } } | null
  imageRef?: string
  roomTitle?: string | null
}

const KIND_LABELS: Record<string, string> = {
  seriesParent: "Serie",
  festivalParent: "Festival",
}

type Taxonomy = {
  groups: Array<{ _id: string; name?: string }>
  types: Array<{ _id: string; name?: string; groupId?: string }>
}

type BrowserData = {
  documents: BrowserRow[]
  taxonomyDocuments: Taxonomy
}

const EMPTY_BROWSER_DATA: BrowserData = {
  documents: [],
  taxonomyDocuments: {
    groups: [],
    types: [],
  },
}

/** Opens a fresh, unsaved arrangement beside the list. */
function NewArrangementButton({
  template,
  text,
}: {
  template: "arrangement" | "festival"
  text: string
}) {
  const { ChildLink } = usePaneRouter()
  const [id, setId] = useState(() => crypto.randomUUID())
  return (
    <RowLink style={{ flex: "none" }}>
      <ChildLink childId={id} childParameters={{ template }}>
        <Button
          as="span"
          icon={icons.add}
          // A new id per click, so each button starts its own document.
          onClick={() => window.setTimeout(() => setId(crypto.randomUUID()))}
          mode={template === "arrangement" ? "default" : "ghost"}
          text={text}
          tone={template === "arrangement" ? "primary" : "default"}
        />
      </ChildLink>
    </RowLink>
  )
}

function ArrangementBrowser() {
  const filterId = useId()
  const client = useClient({ apiVersion: "2026-07-29" })
  const imageBuilder = useMemo(() => createImageUrlBuilder(client), [client])
  const { ChildLink, routerPanesState, groupIndex } = usePaneRouter()
  const openId = routerPanesState[groupIndex + 1]?.[0]?.id
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
      <Stack gap={4}>
        <Flex align="center" gap={3} justify="space-between" wrap="wrap">
          <Heading size={2}>Arrangementer</Heading>
          <Flex gap={2} wrap="wrap">
            <NewArrangementButton
              template="arrangement"
              text="Nytt arrangement"
            />
            <NewArrangementButton template="festival" text="Ny festival" />
            <Button
              icon={icons.reset}
              mode="bleed"
              onClick={() => setFilters(defaultArrangementFilters())}
              text="Nullstill filtre"
            />
          </Flex>
        </Flex>
        <Grid gridTemplateColumns={[1, 1, 3]} gap={3}>
          <Stack gap={2}>
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
          <Stack gap={2}>
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
              <option value="recurring">Gjentakende serier</option>
              <option value="festivals">Festivaler</option>
            </Select>
          </Stack>
          <Stack gap={2}>
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
              <option value="approved">Kommende</option>
              <option value="completed">Gjennomført</option>
              <option value="archived">Arkivert</option>
              <option value="cancelled">Kansellert</option>
            </Select>
          </Stack>
          <Stack gap={2}>
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
          <Stack gap={2}>
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
            <Stack gap={3}>
              <Heading size={1}>Ingen arrangementer passer filtrene</Heading>
              <Text muted>Prøv å nullstille eller endre ett av filtrene.</Text>
            </Stack>
          </Card>
        ) : (
          <Stack gap={2}>
            {results.map(item => {
              const nextDate = nextArrangementDate(item, today)
              const nextTime = item.dates?.find(
                date => date.startDate === nextDate,
              )?.startTime
              const needsDays =
                item.eventKind === "seriesParent" &&
                item.isRecurring === true &&
                !(item.childDates ?? []).some(date => {
                  const horizon = new Date()
                  horizon.setDate(horizon.getDate() + 8 * 7)
                  return date >= horizon.toISOString().slice(0, 10)
                })
              const isFestival = item.eventKind === "festivalParent"
              const kindLabel = KIND_LABELS[item.eventKind ?? ""]
              const thumbnail = item.imageRef
                ? imageBuilder
                    .image(item.image ?? item.imageRef)
                    .width(128)
                    .height(96)
                    .fit("crop")
                    .auto("format")
                    .url()
                : null
              const selected = openId === item._id
              return (
                <Card
                  border
                  key={item._id}
                  radius={2}
                  tone={selected ? "primary" : "default"}
                >
                  <Flex align="center" gap={3} padding={2}>
                    <RowLink>
                      <ChildLink childId={item._id}>
                        <Flex align="center" gap={3}>
                          <Thumbnail>
                            {thumbnail ? (
                              <img alt="" src={thumbnail} />
                            ) : (
                              <icons.image />
                            )}
                          </Thumbnail>
                          <Stack gap={2} style={{ minWidth: 0 }}>
                            <Text
                              size={2}
                              textOverflow="ellipsis"
                              weight="semibold"
                            >
                              {item.title ?? "Arrangement uten tittel"}
                            </Text>
                            <Text muted size={1} textOverflow="ellipsis">
                              {[
                                [formatStudioDate(nextDate), nextTime]
                                  .filter(Boolean)
                                  .join(" kl. "),
                                item.roomTitle,
                                item.eventType?.name,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "Ingen dato"}
                            </Text>
                            <Flex align="center" gap={2} wrap="wrap">
                              {kindLabel ? (
                                <Badge fontSize={0}>{kindLabel}</Badge>
                              ) : null}
                              {needsDays ? (
                                <Badge fontSize={0} tone="caution">
                                  Mangler kommende dager
                                </Badge>
                              ) : null}
                              {item._createdAt ? (
                                <Text muted size={0}>
                                  Lagt ut{" "}
                                  {formatStudioDate(item._createdAt, false)}
                                </Text>
                              ) : null}
                            </Flex>
                          </Stack>
                        </Flex>
                      </ChildLink>
                    </RowLink>
                    {isFestival ? (
                      <Button
                        as={IntentLink}
                        fontSize={1}
                        icon={icons.add}
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
                        text="Festivaldag"
                      />
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

export const ArrangementsPane = () => <ArrangementBrowser />
