import {
  type AutoPromotionCandidate,
  FEATURED_SLOT_COUNT,
  pickAutoPromotions,
} from "@samfunnet/content-domain/promotion"
import { ArrowDownIcon } from "@sanity/icons/ArrowDown"
import { ArrowUpIcon } from "@sanity/icons/ArrowUp"
import { CloseIcon } from "@sanity/icons/Close"
import { ImageIcon } from "@sanity/icons/Image"
import { PinIcon } from "@sanity/icons/Pin"
import { SearchIcon } from "@sanity/icons/Search"
import { createImageUrlBuilder } from "@sanity/image-url"
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Spinner,
  Stack,
  Text,
  TextInput,
} from "@sanity/ui"
import { useToast } from "@sanity/ui/toast"
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useClient } from "sanity"
import { usePaneRouter } from "sanity/structure"
import styled from "styled-components"

import { formatStudioDate } from "./arrangementFilters"
import {
  applyPromotionState,
  changedPromotions,
  type FeaturedSelectionDocument,
  normalizedArrangementId,
  promotionState,
  reorderFeaturedDocuments,
  selectFeaturedDocuments,
} from "./featuredArrangementSelection"
import { featuredSchedule } from "./featuredSchedule"
import { PROMOTABLE_ARRANGEMENTS_FILTER } from "./promotedArrangementFilter"

const API_VERSION = "2026-07-29"
// Published documents only: the website never shows drafts.
const PROMOTABLE_DOCUMENTS_QUERY = `*[
  _type == "arrangement" &&
  (${PROMOTABLE_ARRANGEMENTS_FILTER}) &&
  coalesce(isInternalEvent, false) != true &&
  coalesce(infoScreenOnly, false) != true
] {
  _id,
  "title": coalesce(
    localizedTitle[language == "nb" && defined(value) && value != ""][0].value,
    localizedTitle[language == "en" && defined(value) && value != ""][0].value,
    "Arrangement uten tittel"
  ),
  "eventKind": coalesce(eventKind, "single"),
  eventStatus,
  isSoldOut,
  image,
  "hasImage": defined(image.asset),
  "organizerId": organizerGroup._ref,
  isPromoted,
  promotedPlacement,
  promotedOrder,
  orderRank,
  "dates": select(
    coalesce(eventKind, "single") in ["seriesParent", "festivalParent"] => *[
      _type == "arrangement" &&
      parentEvent._ref == ^._id &&
      approvalStatus == "approved"
    ].dates[startDate >= $today][]{startDate, startTime, isSoldOut},
    dates[startDate >= $today]{startDate, startTime, isSoldOut}
  )
}`
const ARRANGEMENT_DRAFT_IDS_QUERY =
  '*[_type == "arrangement" && _id in path("drafts.**")]._id'
const PICKER_PAGE_SIZE = 8

const KIND_LABELS: Record<string, string> = {
  single: "Arrangement",
  seriesParent: "Serie",
  festivalParent: "Festival",
}

type PromotableDocument = FeaturedSelectionDocument &
  AutoPromotionCandidate & {
    title: string
    image?: { asset?: { _ref?: string } } | null
    dates: Array<{ startDate: string; startTime?: string | null }>
  }

const RowLink = styled.div`
  flex: 1;
  min-width: 0;
  a { color: inherit; text-decoration: none; display: block; border-radius: 3px; }
  a:focus-visible { outline: 2px solid var(--card-focus-ring-color, currentColor); outline-offset: 2px; }
`

const Thumbnail = styled.span<{ $wide?: boolean }>`
  display: grid;
  place-items: center;
  flex: none;
  width: ${props => (props.$wide ? "100%" : "56px")};
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 3px;
  background: var(--card-muted-bg-color, rgb(127 127 127 / 0.15));
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`

const SlotNumber = styled.span`
  display: grid;
  place-items: center;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  background: var(--card-badge-default-bg-color, rgb(127 127 127 / 0.2));
`

function nextDateLabel(document: PromotableDocument) {
  const next = [...document.dates].sort((first, second) =>
    `${first.startDate}${first.startTime ?? ""}`.localeCompare(
      `${second.startDate}${second.startTime ?? ""}`,
    ),
  )[0]
  if (!next) return "Ingen kommende datoer"
  const label = [formatStudioDate(next.startDate), next.startTime]
    .filter(Boolean)
    .join(" kl. ")
  return document.dates.length > 1
    ? `${label} (+${document.dates.length - 1} datoer)`
    : label
}

function lastDate(document: PromotableDocument) {
  return document.dates
    .map(date => date.startDate)
    .sort()
    .at(-1)
}

function Section({
  children,
  description,
  title,
}: {
  children: ReactNode
  description?: ReactNode
  title: string
}) {
  return (
    <Stack gap={3}>
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          {title}
        </Text>
        {description ? (
          <Text muted size={1}>
            {description}
          </Text>
        ) : null}
      </Stack>
      {children}
    </Stack>
  )
}

export function PromotedArrangementList({ today }: { today: string }) {
  const client = useClient({ apiVersion: API_VERSION })
  const imageBuilder = useMemo(() => createImageUrlBuilder(client), [client])
  const { ChildLink } = usePaneRouter()
  const toast = useToast()
  const [documents, setDocuments] = useState<PromotableDocument[]>([])
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [pickerLimit, setPickerLimit] = useState(PICKER_PAGE_SIZE)

  const refresh = useCallback(async () => {
    const [nextDocuments, nextDraftIds] = await Promise.all([
      client.fetch<PromotableDocument[]>(
        PROMOTABLE_DOCUMENTS_QUERY,
        { today },
        { perspective: "published" },
      ),
      client.fetch<string[]>(
        ARRANGEMENT_DRAFT_IDS_QUERY,
        {},
        { perspective: "raw" },
      ),
    ])
    setDocuments(
      nextDocuments.map(document => ({
        ...document,
        dates: document.dates ?? [],
      })),
    )
    setDraftIds(new Set(nextDraftIds))
  }, [client, today])

  useEffect(() => {
    void refresh()
      .catch(() =>
        toast.push({
          status: "error",
          title: "Kunne ikke hente arrangementer.",
        }),
      )
      .finally(() => setLoading(false))
  }, [refresh, toast])

  const selected = useMemo(
    () => selectFeaturedDocuments(documents),
    [documents],
  )
  const selectedIds = selected.map(document =>
    normalizedArrangementId(document._id),
  )
  const automatic = useMemo(
    () =>
      pickAutoPromotions(documents, {
        count: FEATURED_SLOT_COUNT - selected.length,
        excludeIds: selected.map(document => document._id),
        today,
      }),
    [documents, selected, today],
  )
  const slots = [
    ...selected
      .slice(0, FEATURED_SLOT_COUNT)
      .map(document => ({ document, automatic: false })),
    ...automatic.map(document => ({ document, automatic: true })),
  ]
  const schedule = featuredSchedule(
    selected.map(document => ({ lastDate: lastDate(document) })),
    FEATURED_SLOT_COUNT,
    today,
  )

  const saveSelection = async (nextIds: string[]) => {
    if (saving) return
    const changes = changedPromotions(documents, nextIds)
    if (changes.length === 0) return
    setSaving(true)
    setDocuments(current =>
      current.map(document =>
        applyPromotionState(document, promotionState(nextIds, document._id)),
      ),
    )
    try {
      const transaction = client.transaction()
      for (const { document, state } of changes) {
        const id = normalizedArrangementId(document._id)
        for (const documentId of [
          id,
          ...(draftIds.has(`drafts.${id}`) ? [`drafts.${id}`] : []),
        ]) {
          transaction.patch(documentId, patch =>
            state.isPromoted
              ? patch.set(state)
              : patch
                  .set({ isPromoted: false, promotedPlacement: "pool" })
                  .unset(["promotedOrder"]),
          )
        }
      }
      await transaction.commit({ visibility: "async" })
    } catch {
      toast.push({
        status: "error",
        title: "Kunne ikke lagre fremhevede arrangementer.",
      })
      await refresh().catch(() => undefined)
    } finally {
      setSaving(false)
    }
  }

  const add = (id: string) =>
    void saveSelection([...selectedIds, normalizedArrangementId(id)])
  const remove = (id: string) =>
    void saveSelection(
      selectedIds.filter(
        selectedId => selectedId !== normalizedArrangementId(id),
      ),
    )
  const move = (index: number, offset: -1 | 1) =>
    void saveSelection(
      reorderFeaturedDocuments(selectedIds, index, index + offset),
    )

  const thumbnailUrl = (document: PromotableDocument, width: number) =>
    document.image?.asset?._ref
      ? imageBuilder
          .image(document.image)
          .width(width)
          .height(Math.round((width * 3) / 4))
          .fit("crop")
          .auto("format")
          .url()
      : null

  const renderThumbnail = (document: PromotableDocument, wide = false) => {
    const url = thumbnailUrl(document, wide ? 480 : 112)
    return (
      <Thumbnail $wide={wide}>
        {url ? <img alt="" src={url} /> : <ImageIcon />}
      </Thumbnail>
    )
  }

  if (loading) {
    return (
      <Flex align="center" gap={3} padding={5}>
        <Spinner />
        <Text>Laster fremhevede arrangementer …</Text>
      </Flex>
    )
  }

  const automaticIds = new Set(automatic.map(document => document._id))
  const normalizedQuery = query.trim().toLocaleLowerCase("nb")
  const pickerDocuments = documents
    .filter(
      document => !selectedIds.includes(normalizedArrangementId(document._id)),
    )
    .filter(document =>
      normalizedQuery
        ? document.title.toLocaleLowerCase("nb").includes(normalizedQuery)
        : true,
    )
    .sort((first, second) =>
      (first.dates.map(date => date.startDate).sort()[0] ?? "").localeCompare(
        second.dates.map(date => date.startDate).sort()[0] ?? "",
      ),
    )

  return (
    <Stack gap={5}>
      <Section
        description="Slik ser fremhevingen ut på forsiden akkurat nå. Infoskjermen hopper over arrangementer som er i dag."
        title="Vises nå"
      >
        <Grid gap={3} gridTemplateColumns={[1, 1, 3]}>
          {slots.map(({ document, automatic: isAutomatic }, index) => (
            <Card
              border
              key={document._id}
              padding={2}
              radius={2}
              tone={isAutomatic ? "transparent" : "default"}
            >
              <Stack gap={3}>
                <ChildLink childId={normalizedArrangementId(document._id)}>
                  {renderThumbnail(document, true)}
                </ChildLink>
                <Flex align="center" gap={2}>
                  <SlotNumber>{index + 1}</SlotNumber>
                  <Badge tone={isAutomatic ? "default" : "primary"}>
                    {isAutomatic ? "Automatisk" : "Valgt"}
                  </Badge>
                </Flex>
                <Stack gap={2}>
                  <Text size={1} textOverflow="ellipsis" weight="semibold">
                    {document.title}
                  </Text>
                  <Text muted size={1} textOverflow="ellipsis">
                    {nextDateLabel(document)}
                  </Text>
                </Stack>
                {isAutomatic ? (
                  <Button
                    disabled={saving}
                    fontSize={1}
                    icon={PinIcon}
                    mode="ghost"
                    onClick={() => add(document._id)}
                    text="Behold fast"
                    title="Velg dette arrangementet, så det ikke byttes ut automatisk"
                  />
                ) : null}
              </Stack>
            </Card>
          ))}
          {slots.length === 0 ? (
            <Card border padding={4} radius={2} tone="caution">
              <Text size={1}>Ingen kommende arrangementer kan fremheves.</Text>
            </Card>
          ) : null}
        </Grid>
      </Section>

      <Section
        description={
          selected.length === 0
            ? "Ingen er valgt, så alle plassene fylles automatisk med de neste arrangementene som har bilde."
            : "De tre øverste vises. Når et arrangement er over, rykker det neste opp. Tomme plasser fylles automatisk."
        }
        title={`Valgt av redaksjonen (${selected.length})`}
      >
        {selected.length > 0 ? (
          <Stack gap={2}>
            {selected.map((document, index) => {
              const id = normalizedArrangementId(document._id)
              const window = schedule[index]
              const status =
                index < FEATURED_SLOT_COUNT
                  ? { tone: "positive" as const, text: "Vises nå" }
                  : window?.from
                    ? {
                        tone: "caution" as const,
                        text: `Venter, vises fra ${formatStudioDate(window.from, false)}`,
                      }
                    : {
                        tone: "critical" as const,
                        text: "Får ikke plass før det er over",
                      }
              return (
                <Card border key={id} padding={2} radius={2}>
                  <Flex align="center" gap={3}>
                    <SlotNumber>{index + 1}</SlotNumber>
                    <RowLink>
                      <ChildLink childId={id}>
                        <Flex align="center" gap={3}>
                          {renderThumbnail(document)}
                          <Stack gap={2} style={{ minWidth: 0 }}>
                            <Text
                              size={1}
                              textOverflow="ellipsis"
                              weight="semibold"
                            >
                              {document.title}
                            </Text>
                            <Text muted size={1} textOverflow="ellipsis">
                              {nextDateLabel(document)}
                            </Text>
                          </Stack>
                        </Flex>
                      </ChildLink>
                    </RowLink>
                    <Box display={["none", "block"]}>
                      <Badge tone={status.tone}>{status.text}</Badge>
                    </Box>
                    <Flex gap={1}>
                      <Button
                        aria-label={`Flytt ${document.title} opp`}
                        disabled={saving || index === 0}
                        icon={ArrowUpIcon}
                        mode="bleed"
                        onClick={() => move(index, -1)}
                        title="Flytt opp"
                      />
                      <Button
                        aria-label={`Flytt ${document.title} ned`}
                        disabled={saving || index === selected.length - 1}
                        icon={ArrowDownIcon}
                        mode="bleed"
                        onClick={() => move(index, 1)}
                        title="Flytt ned"
                      />
                      <Button
                        aria-label={`Fjern ${document.title} fra fremhevede`}
                        disabled={saving}
                        icon={CloseIcon}
                        mode="bleed"
                        onClick={() => remove(document._id)}
                        title="Fjern"
                        tone="critical"
                      />
                    </Flex>
                  </Flex>
                </Card>
              )
            })}
          </Stack>
        ) : null}
      </Section>

      <Section
        description="Kommende arrangementer, de nærmeste først."
        title="Legg til"
      >
        <TextInput
          aria-label="Søk etter arrangement"
          icon={SearchIcon}
          onChange={event => {
            setQuery(event.currentTarget.value)
            setPickerLimit(PICKER_PAGE_SIZE)
          }}
          placeholder="Søk etter arrangement"
          value={query}
        />
        {pickerDocuments.length === 0 ? (
          <Text muted size={1}>
            Ingen kommende arrangementer passer søket.
          </Text>
        ) : (
          <Stack gap={2}>
            {pickerDocuments.slice(0, pickerLimit).map(document => {
              const id = normalizedArrangementId(document._id)
              return (
                <Card border key={id} padding={2} radius={2}>
                  <Flex align="center" gap={3}>
                    <RowLink>
                      <ChildLink childId={id}>
                        <Flex align="center" gap={3}>
                          {renderThumbnail(document)}
                          <Stack gap={2} style={{ minWidth: 0 }}>
                            <Text
                              size={1}
                              textOverflow="ellipsis"
                              weight="semibold"
                            >
                              {document.title}
                            </Text>
                            <Text muted size={1} textOverflow="ellipsis">
                              {[
                                nextDateLabel(document),
                                KIND_LABELS[document.eventKind ?? "single"],
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </Text>
                          </Stack>
                        </Flex>
                      </ChildLink>
                    </RowLink>
                    {automaticIds.has(document._id) ? (
                      <Box display={["none", "block"]}>
                        <Badge>Vises automatisk</Badge>
                      </Box>
                    ) : null}
                    <Button
                      disabled={saving}
                      fontSize={1}
                      mode="ghost"
                      onClick={() => add(document._id)}
                      text="Velg"
                    />
                  </Flex>
                </Card>
              )
            })}
            {pickerDocuments.length > pickerLimit ? (
              <Button
                fontSize={1}
                mode="bleed"
                onClick={() =>
                  setPickerLimit(limit => limit + PICKER_PAGE_SIZE)
                }
                text={`Vis flere (${pickerDocuments.length - pickerLimit})`}
              />
            ) : null}
          </Stack>
        )}
      </Section>
    </Stack>
  )
}

export function PromotedArrangementsPane() {
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Oslo",
  }).format(new Date())

  return (
    <Card height="fill" overflow="auto" padding={4}>
      <Stack gap={5} style={{ maxWidth: 880 }}>
        <Stack gap={3}>
          <Heading size={2}>Fremhevede arrangementer</Heading>
          <Text muted size={1}>
            Forsiden og infoskjermen viser alltid tre arrangementer. Velg selv
            hva som skal vises, eller la systemet fylle ledige plasser.
          </Text>
        </Stack>
        <PromotedArrangementList today={today} />
      </Stack>
    </Card>
  )
}
