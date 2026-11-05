// Event lookups the model can trust: the GROQ is written and tested here, so
// the model never has to rediscover how dates, series titles, drafts and
// website visibility work in this dataset.

import { tool } from "ai"
import { z } from "zod"

const API_VERSION = "2025-02-19"
const MAX_RANGE_DAYS = 92
const MAX_OCCURRENCES = 80
const DATE = /^\d{4}-\d{2}-\d{2}$/

export type SanityScope = {
  projectId: string
  dataset: string
  token: string
  studioUrl: string
  siteUrl?: string
}

type Fetch = typeof fetch

/** One GROQ query over Sanity's HTTP API. `raw` sees drafts as well. */
export async function sanityQuery<T>(
  scope: SanityScope,
  query: string,
  params: Record<string, unknown>,
  fetchFn: Fetch = (input, init) => fetch(input, init),
): Promise<T> {
  const url = `https://${scope.projectId}.api.sanity.io/v${API_VERSION}/data/query/${scope.dataset}?perspective=raw`
  const response = await fetchFn(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${scope.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, params }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`Sanity svarte ${response.status}.`)
  const json = (await response.json()) as { result: T }
  return json.result
}

const nb = (field: string) =>
  `${field}[language == "nb" && defined(value) && value != ""][0].value`

// A published document, or a draft that has never been published. Release
// versions are never shown.
const CURRENT_DOCUMENT = `!(_id in path("versions.**"))
  && (!(_id in path("drafts.**")) || count(*[_id == string::split(^._id, "drafts.")[1]]) == 0)`

const EVENT_FIELDS = `
  "id": string::split(_id, "drafts.")[-1],
  "draftOnly": _id in path("drafts.**"),
  "hasDraft": count(*[_id == "drafts." + ^._id]) > 0,
  "kind": coalesce(eventKind, "single"),
  "approvalStatus": coalesce(approvalStatus, "pending"),
  eventStatus,
  "title": coalesce(${nb("localizedTitle")}, ${nb("parentEvent->localizedTitle")}, localizedTitle[defined(value) && value != ""][0].value),
  "parent": parentEvent->{"id": _id, "title": ${nb("localizedTitle")}},
  "room": coalesce(${nb("room->localizedTitle")}, ${nb("localizedRoomText")}, ${nb("parentEvent->room->localizedTitle")}, ${nb("parentEvent->localizedRoomText")}),
  "organizer": coalesce(${nb("organizerGroup->localizedName")}, ${nb("localizedOrganizerText")}, ${nb("parentEvent->organizerGroup->localizedName")}, ${nb("parentEvent->localizedOrganizerText")}),
  "internal": coalesce(isInternalEvent, parentEvent->isInternalEvent, false),
  "infoScreenOnly": coalesce(infoScreenOnly, false),
  "ticketUrl": coalesce(ticketUrl, parentEvent->ticketUrl),
  "slug": slug.current,
  submittedBy`

export const FIND_EVENTS_QUERY = `*[_type == "arrangement"
  && ${CURRENT_DOCUMENT}
  && coalesce(eventKind, "single") in $kinds
  && coalesce(approvalStatus, "pending") in $statuses
  && count(dates[startDate >= $from && startDate <= $to]) > 0
  && ($terms == null || localizedTitle[].value match $terms || parentEvent->localizedTitle[].value match $terms)
][0...300]{
  ${EVENT_FIELDS},
  "dates": dates[startDate >= $from && startDate <= $to]{startDate, startTime, endTime}
}`

export const GET_EVENT_QUERY = `*[_type == "arrangement"
  && ${CURRENT_DOCUMENT}
  && (string::split(_id, "drafts.")[-1] == $id || slug.current == $slug)
][0]{
  ${EVENT_FIELDS},
  "titleEn": localizedTitle[language == "en"][0].value,
  "description": pt::text(${nb("localizedDescription")}),
  "eventType": ${nb("eventType->localizedName")},
  "coOrganizers": coOrganizerGroups[]->localizedName[language == "nb"][0].value,
  "prices": {priceOrdinar, priceStudent, priceMedlem, isFree, isSoldOut},
  sourceTicketUrls,
  facebookUrl,
  "dates": dates[0...60]{startDate, startTime, endTime, isSoldOut},
  "dateCount": count(dates),
  "children": *[_type == "arrangement" && parentEvent._ref == ^._id && !(_id in path("drafts.**"))]
    | order(dates[0].startDate asc)[0...40]{
      "id": _id, "title": ${nb("localizedTitle")}, "kind": eventKind,
      approvalStatus, "dates": dates[]{startDate, startTime}
    },
  "childCount": count(*[_type == "arrangement" && parentEvent._ref == ^._id && !(_id in path("drafts.**"))]),
  "draft": *[_id == "drafts." + ^._id][0]{
    "title": ${nb("localizedTitle")}, "approvalStatus": approvalStatus,
    "dates": dates[0...20]{startDate, startTime, endTime}, _updatedAt
  },
  _updatedAt
}`

type RawEvent = {
  id: string
  draftOnly: boolean
  hasDraft: boolean
  kind: string
  approvalStatus: string
  eventStatus: string | null
  title: string | null
  parent: { id: string; title: string | null } | null
  room: string | null
  organizer: string | null
  internal: boolean
  infoScreenOnly: boolean
  ticketUrl: string | null
  slug: string | null
  submittedBy: string | null
  dates: { startDate: string; startTime?: string; endTime?: string }[] | null
}

export function onWebsite(event: RawEvent) {
  return (
    !event.draftOnly &&
    event.approvalStatus === "approved" &&
    !event.internal &&
    !event.infoScreenOnly &&
    Boolean(event.slug) &&
    ["single", "seriesInstance", "festivalSession"].includes(event.kind)
  )
}

export function eventLinks(event: RawEvent, scope: SanityScope) {
  const site = (scope.siteUrl ?? "https://www.samfunnetibergen.no").replace(
    /\/$/,
    "",
  )
  return {
    studioUrl: `${scope.studioUrl.replace(/\/$/, "")}/intent/edit/id=${event.id};type=arrangement/`,
    websiteUrl:
      onWebsite(event) && event.slug
        ? `${site}/nb/arrangementer/${event.slug}`
        : undefined,
  }
}

/** Title words become prefix terms for GROQ `match`: "impro" finds "Impro…". */
export function searchTerms(text: string | undefined) {
  const words = (text ?? "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(word => word.length > 1)
    .slice(0, 6)
  return words.length ? words.map(word => `${word}*`) : null
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function dateRange(today: string, from?: string, to?: string) {
  const start = from ?? today
  const end = to ?? start
  if (!DATE.test(start) || !DATE.test(end))
    throw new Error("Datoer må være YYYY-MM-DD.")
  if (end < start) throw new Error("to kan ikke være før from.")
  if (end > addDays(start, MAX_RANGE_DAYS))
    throw new Error(`Maks ${MAX_RANGE_DAYS} dager per søk; del opp perioden.`)
  return { from: start, to: end }
}

const STATUSES = {
  approved: ["approved"],
  pending: ["pending"],
  rejected: ["rejected"],
  open: ["approved", "pending"],
  all: ["approved", "pending", "rejected"],
} as const

/** One row per date, sorted, so "what happens on Friday" reads straight off. */
export function occurrences(rows: RawEvent[], scope: SanityScope) {
  return rows
    .flatMap(event =>
      (event.dates ?? []).map(date => ({
        date: date.startDate,
        start: date.startTime,
        end: date.endTime,
        id: event.id,
        title: event.title ?? "(uten tittel)",
        series: event.parent?.title ?? undefined,
        kind: event.kind,
        approvalStatus: event.approvalStatus,
        cancelled: event.eventStatus === "cancelled" || undefined,
        onWebsite: onWebsite(event),
        internal: event.internal || undefined,
        infoScreenOnly: event.infoScreenOnly || undefined,
        draftOnly: event.draftOnly || undefined,
        hasDraft: event.hasDraft || undefined,
        room: event.room ?? undefined,
        organizer: event.organizer ?? undefined,
        ticketUrl: event.ticketUrl ?? undefined,
        imported: event.submittedBy === "E-tjenesten's Skonk" || undefined,
        ...eventLinks(event, scope),
      })),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.start ?? "").localeCompare(b.start ?? "") ||
        a.title.localeCompare(b.title),
    )
}

/** An id, a slug, a website URL or a Studio URL, reduced to what GROQ matches on. */
export function eventRef(ref: string) {
  const value = ref.trim()
  const studio = value.match(/id=([\w.-]+)/)
  if (studio) return { id: studio[1].replace(/^drafts\./, ""), slug: null }
  const site = value.match(/\/arrangementer\/([\w-]+)/)
  if (site) return { id: null, slug: site[1] }
  const id = value.replace(/^drafts\./, "")
  return { id, slug: id }
}

export function eventTools(
  scope: SanityScope,
  today: () => string,
  fetchFn?: Fetch,
) {
  return {
    find_events: tool({
      description:
        "Finn arrangementer i Sanity for en dato eller periode (Oslo-datoer), valgfritt filtrert på ord i tittelen. Bruk denne FØRST for alle spørsmål om hva som skjer når, og for å sjekke om et arrangement finnes. Gir én rad per dato med tittel (også for serier), tid, rom, arrangør, godkjenningsstatus, om det vises på nettsiden, og lenker til Studio og nettsiden.",
      inputSchema: z.object({
        from: z
          .string()
          .optional()
          .describe("Første dato, YYYY-MM-DD. Standard: i dag."),
        to: z
          .string()
          .optional()
          .describe("Siste dato (inklusiv), YYYY-MM-DD. Standard: lik from."),
        text: z
          .string()
          .optional()
          .describe(
            "Ord fra tittelen, f.eks. 'impro' eller 'quiz'. Utelat for alt.",
          ),
        status: z
          .enum(["open", "approved", "pending", "rejected", "all"])
          .optional()
          .describe(
            "open (standard) = godkjente og ventende; approved = bare godkjente.",
          ),
        include_parents: z
          .boolean()
          .optional()
          .describe(
            "Ta med serie- og festivalforeldre i tillegg til enkeltarrangementer.",
          ),
      }),
      execute: async ({ from, to, text, status, include_parents }) => {
        try {
          const range = dateRange(today(), from, to)
          const rows = await sanityQuery<RawEvent[]>(
            scope,
            FIND_EVENTS_QUERY,
            {
              ...range,
              terms: searchTerms(text),
              statuses: STATUSES[status ?? "open"],
              kinds: [
                "single",
                "seriesInstance",
                "festivalSession",
                ...(include_parents ? ["seriesParent", "festivalParent"] : []),
              ],
            },
            fetchFn,
          )
          const all = occurrences(rows, scope)
          return {
            ...range,
            count: all.length,
            onWebsite: all.filter(row => row.onWebsite).length,
            occurrences: all.slice(0, MAX_OCCURRENCES),
            note:
              all.length > MAX_OCCURRENCES
                ? `Viser ${MAX_OCCURRENCES} av ${all.length}; snevre inn perioden eller teksten.`
                : all.length === 0
                  ? "Ingen treff. Prøv en lengre periode, færre ord, eller status all."
                  : undefined,
          }
        } catch (error) {
          return {
            error:
              error instanceof Error ? error.message : "Søket feilet i Sanity.",
          }
        }
      },
    }),
    get_event: tool({
      description:
        "Hent alle detaljer om ett arrangement: beskrivelse, alle datoer, priser, billettlenker, arrangør, rom, serieforelder og -barn, og om det finnes et upublisert utkast. Tar id, slug, nettside-URL eller Studio-URL.",
      inputSchema: z.object({
        ref: z
          .string()
          .describe("Dokument-id, slug, nettside-URL eller Studio-URL."),
      }),
      execute: async ({ ref }) => {
        try {
          const event = await sanityQuery<
            (RawEvent & Record<string, unknown>) | null
          >(scope, GET_EVENT_QUERY, eventRef(ref), fetchFn)
          if (!event) return { error: "Fant ikke arrangementet." }
          return {
            ...event,
            submittedBy: undefined,
            imported: event.submittedBy === "E-tjenesten's Skonk",
            onWebsite: onWebsite(event),
            ...eventLinks(event, scope),
          }
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "Oppslaget feilet.",
          }
        }
      },
    }),
  }
}
