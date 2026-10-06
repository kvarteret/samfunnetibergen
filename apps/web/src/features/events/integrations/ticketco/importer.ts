import { randomUUID } from "node:crypto"
import { createClient, type SanityClient } from "@sanity/client"
import { z } from "zod"
import {
  fetchVenueCalendar,
  ROOM_CALENDAR_SLUGS,
} from "@/lib/integrations/crescat/calendar"
import { addDaysDateOnly } from "@/lib/integrations/crescat/datetime"
import { eventFormSchema } from "../../domain/eventFormSchema"
import { type FormState, initialState } from "../../domain/formState"
import {
  EVENT_IMAGE_MAX_SIZE_BYTES,
  isAcceptedEventImageType,
} from "../../domain/imageUpload"
import { buildEventDocument } from "../../server/event-document"
import { notifyPendingRequest } from "../../server/pending-slack"
import { type Extraction, extractWithLuna, type ImportTaxonomy } from "./luna"
import { matchBookingRoom, overlappingRooms, type RoomCandidate } from "./rooms"
import {
  approvedImageUrl,
  canonicalTicketUrl,
  discoverEvents,
  fetchBounded,
  pageImage,
  pageText,
  type TicketCoEvent,
  ticketDocumentId,
} from "./source"

export const INTERVAL_MS = 72 * 60 * 60 * 1000
const STATE_ID = "ticketco-import-state"
const LEASE_MS = 30 * 60 * 1000
const stateSchema = { _id: STATE_ID, _type: "ticketcoImportState" }
type RunState = {
  _id: string
  _rev: string
  lastSuccessAt?: string
  leaseUntil?: string
  owner?: string
}
export type ImportReport = {
  discovered: number
  imported: number
  skipped: number
  failed: { url: string; reason: string }[]
  status: "complete" | "not-due" | "busy"
}

export function isDue(lastSuccessAt: string | undefined, now: number): boolean {
  return (
    !lastSuccessAt ||
    !Number.isFinite(Date.parse(lastSuccessAt)) ||
    now - Date.parse(lastSuccessAt) >= INTERVAL_MS
  )
}

export function formFromExtraction(
  extracted: Extraction,
  url: string,
  taxonomy: ImportTaxonomy,
  candidates: RoomCandidate[],
): FormState {
  const room = matchBookingRoom(extracted.title, candidates) || extracted.room
  for (const [id, options] of [
    [room, taxonomy.rooms],
    [extracted.organizerGroup, taxonomy.groups],
    [extracted.eventTypeId, taxonomy.eventTypes],
  ] as const) {
    if (id && !options.some(option => option._id === id))
      throw new Error("Luna selected an unknown reference")
  }
  if (extracted.facebookUrl) {
    const facebook = new URL(extracted.facebookUrl)
    if (
      facebook.protocol !== "https:" ||
      !["facebook.com", "www.facebook.com", "m.facebook.com"].includes(
        facebook.hostname,
      )
    )
      throw new Error("Invalid Facebook link")
  }
  for (const price of [
    extracted.priceOrdinar,
    extracted.priceStudent,
    extracted.priceMedlem,
  ]) {
    if (
      price &&
      (!/^\d+(?:\.\d{1,2})?$/.test(price) || !Number.isFinite(Number(price)))
    )
      throw new Error("Invalid price")
  }
  return eventFormSchema.parse({
    ...initialState,
    ...extracted,
    room,
    dates: [
      {
        id: "ticketco-date",
        startDate: extracted.startDate,
        startTime: extracted.startTime,
        endTime: extracted.endTime,
      },
    ],
    isRecurring: false,
    rrule: "",
    isInternalEvent: false,
    ticketUrl: url,
    submittedBy: "E-tjenesten's Skonk",
    submittedByEmail: "it.leder@kvarteret.no",
  })
}

export type ImportDependencies = {
  discover: typeof discoverEvents
  extract: typeof extractWithLuna
  fetchPage: (url: string) => Promise<string>
  calendar: typeof fetchVenueCalendar
}
const defaultDependencies: ImportDependencies = {
  discover: discoverEvents,
  extract: extractWithLuna,
  fetchPage: async url => (await fetchBounded(url)).text(),
  calendar: fetchVenueCalendar,
}

async function taxonomyForImport(
  client: SanityClient,
): Promise<ImportTaxonomy> {
  return client.fetch(`{
    "rooms": *[_type == "room" && !(_id in path("drafts.**"))]{_id, "name": coalesce(localizedTitle[language == "nb"][0].value, ""), crescatRoomId},
    "groups": *[_type == "studentGroup" && !(_id in path("drafts.**"))]{_id, "name": coalesce(localizedName[language == "nb"][0].value, "")},
    "eventTypes": *[_type == "eventType" && isActive != false && !(_id in path("drafts.**"))]{_id, "name": coalesce(localizedName[language == "nb"][0].value, "")}
  }`)
}

async function sourceImage(
  client: SanityClient,
  url: string | undefined,
): Promise<string | undefined> {
  if (!url || !approvedImageUrl(url)) return undefined
  const response = await fetchBounded(url, EVENT_IMAGE_MAX_SIZE_BYTES)
  const contentType = response.headers.get("content-type")?.split(";")[0] ?? ""
  if (!isAcceptedEventImageType(contentType)) return undefined
  const asset = await client.assets.upload(
    "image",
    Buffer.from(await response.arrayBuffer()),
    { contentType, filename: "ticketco-event" },
  )
  return asset._id
}

// TicketCo JSON-LD times are hints only. The model reads the displayed schedule;
// this window includes the full local day and following day for overnight shows.
function calendarDate(event: TicketCoEvent): string | null {
  const value = event.startDate?.slice(0, 10)
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

export async function importEvents(
  client: SanityClient,
  dryRun = false,
  dependencies = defaultDependencies,
): Promise<ImportReport> {
  const events = await dependencies.discover()
  const taxonomy = await taxonomyForImport(client)
  // Raw perspective includes pending, rejected and draft arrangements. Preserve
  // manual submissions and editorial corrections, including locale variants.
  const existing = await client.fetch<{ _id: string; ticketUrl?: string }[]>(
    `*[_type == "arrangement" && defined(ticketUrl)]{_id, ticketUrl}`,
  )
  const seen = new Set(
    existing.flatMap(event => {
      const url = canonicalTicketUrl(event.ticketUrl ?? "")
      return url ? [url] : []
    }),
  )
  const report: ImportReport = {
    discovered: events.length,
    imported: 0,
    skipped: 0,
    failed: [],
    status: "complete",
  }
  const calendars = new Map<
    string,
    Awaited<ReturnType<typeof fetchVenueCalendar>>
  >()
  async function bookingsFor(date: string) {
    let bookings = calendars.get(date)
    if (!bookings) {
      const results = await Promise.all(
        Object.values(ROOM_CALENDAR_SLUGS).map(slug =>
          dependencies.calendar(slug, date, addDaysDateOnly(date, 2)),
        ),
      )
      bookings = results.flat()
      calendars.set(date, bookings)
    }
    return bookings
  }
  for (const event of events) {
    const url = canonicalTicketUrl(event.url)
    if (!url) {
      report.failed.push({ url: event.url, reason: "Invalid source URL" })
      continue
    }
    if (
      seen.has(url) ||
      (await client.getDocument(ticketDocumentId(url))) ||
      (await client.getDocument(`drafts.${ticketDocumentId(url)}`))
    ) {
      report.skipped++
      continue
    }
    try {
      const html = await dependencies.fetchPage(url)
      const date = calendarDate(event)
      const window = date
        ? overlappingRooms(
            date,
            "00:00",
            "00:00",
            await bookingsFor(date),
            taxonomy.rooms,
          )
        : []
      const extracted = await dependencies.extract(
        event,
        pageText(html),
        taxonomy,
        window,
      )
      // Recompute against the actual extracted local schedule. A provisional
      // full-day booking cannot establish a room by title alone.
      const parsed = formFromExtraction(extracted, url, taxonomy, [])
      const candidates = overlappingRooms(
        parsed.dates[0].startDate,
        parsed.dates[0].startTime,
        parsed.dates[0].endTime,
        await bookingsFor(parsed.dates[0].startDate),
        taxonomy.rooms,
      )
      const form = formFromExtraction(extracted, url, taxonomy, candidates)
      // Do not import historical or cancelled search results as scheduled events.
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Oslo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date())
      if (
        form.dates[0].startDate < today ||
        String(event.eventStatus).includes("Cancelled")
      ) {
        report.skipped++
        continue
      }
      let imageAssetId: string | undefined
      if (!dryRun) {
        try {
          imageAssetId = await sourceImage(
            client,
            pageImage(html) ?? event.image,
          )
        } catch {
          /* Missing image does not block an otherwise complete submission. */
        }
        const created = await client.createIfNotExists({
          ...buildEventDocument({ ...form, imageAssetId }),
          _id: ticketDocumentId(url),
        })
        try {
          await notifyPendingRequest(client, created)
        } catch {
          /* Scheduled sync retries. */
        }
      }
      seen.add(url)
      report.imported++
    } catch (error) {
      // Status and validation paths are useful; page text, model output and
      // request headers must never reach operator logs.
      const reason =
        error instanceof z.ZodError
          ? `Validation: ${error.issues.map(issue => `${issue.path.join(".")}:${issue.code}`).join(", ")}`
          : error instanceof TypeError && error.cause
            ? `Network failure: ${(error.cause as { code?: string })?.code || "request"}`
            : error instanceof Error &&
                /^(Luna HTTP \d+|Source HTTP \d+|Luna response incomplete|Luna returned no structured output|Luna selected an unknown reference|Invalid price|Invalid Facebook link|Source exceeds size limit)$/.test(
                  error.message,
                )
              ? error.message
              : "Extraction or validation failed; event will be retried"
      report.failed.push({ url, reason })
    }
  }
  return report
}

export async function runTicketCoImport(
  client: SanityClient,
  options: { dryRun?: boolean; force?: boolean } = {},
  dependencies = defaultDependencies,
): Promise<ImportReport> {
  if (options.dryRun) return importEvents(client, true, dependencies)
  await client.createIfNotExists(stateSchema)
  const state = await client.getDocument<RunState>(STATE_ID)
  if (!state) throw new Error("Import state unavailable")
  const empty: ImportReport = {
    discovered: 0,
    imported: 0,
    skipped: 0,
    failed: [],
    status: "complete",
  }
  const now = Date.now()
  if (Date.parse(state.leaseUntil ?? "") > now)
    return { ...empty, status: "busy" }
  if (!options.force && !isDue(state.lastSuccessAt, now))
    return { ...empty, status: "not-due" }
  const owner = randomUUID()
  let lease: RunState
  try {
    lease = (await client
      .patch(STATE_ID)
      .ifRevisionId(state._rev)
      .set({ owner, leaseUntil: new Date(now + LEASE_MS).toISOString() })
      .commit()) as RunState
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 409)
      return { ...empty, status: "busy" }
    throw error
  }
  try {
    const report = await importEvents(client, false, dependencies)
    const patch = client
      .patch(STATE_ID)
      .ifRevisionId(lease._rev)
      .unset(["owner", "leaseUntil"])
    if (!report.failed.length)
      patch.set({ lastSuccessAt: new Date().toISOString() })
    await patch.commit()
    return report
  } catch (error) {
    await client
      .patch(STATE_ID)
      .ifRevisionId(lease._rev)
      .unset(["owner", "leaseUntil"])
      .commit()
    throw error
  }
}

export function importClient(): SanityClient {
  if (!process.env.SANITY_WRITE_TOKEN)
    throw new Error("SANITY_WRITE_TOKEN is not configured")
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "mkjoahvv",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    token: process.env.SANITY_WRITE_TOKEN,
    apiVersion: "2024-01-01",
    useCdn: false,
    perspective: "raw",
  })
}
