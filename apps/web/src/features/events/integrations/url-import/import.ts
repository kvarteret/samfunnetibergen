import { randomUUID } from "node:crypto"
import type { SanityClient } from "@sanity/client"
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
import { taxonomyForImport } from "../ticketco/importer"
import { type Extraction, extractWithLuna } from "../ticketco/luna"
import {
  bestEffortRoom,
  matchBookingRoom,
  overlappingRooms,
} from "../ticketco/rooms"
import { pageImage, pageText, type TicketCoEvent } from "../ticketco/source"
import type { LunaWorkflow } from "../ticketco/telemetry"
import { facebookEventUrl, ticketDetails } from "../ticketco/ticket-details"
import { getEventUrlPrompt } from "./prompt"
import { fetchPublic } from "./public-fetch"

const WORKFLOW: LunaWorkflow = {
  name: "studio_url_import",
  distinctId: "studio-url-import",
  spanName: "Studio event URL extraction",
}

/** Fields written into the editor's draft; submitter and status stay theirs. */
const FIELDS = [
  "localizedTitle",
  "localizedDescription",
  "eventType",
  "dates",
  "room",
  "localizedRoomText",
  "organizerGroup",
  "localizedOrganizerText",
  "priceOrdinar",
  "priceStudent",
  "priceMedlem",
  "ticketUrl",
  "facebookUrl",
  "image",
] as const

export type UrlImportResult = {
  fields: Record<string, unknown>
  /** What the editor still has to fill in before publishing. */
  missing: string[]
}

export type UrlImportDependencies = {
  fetchPage: (url: string) => Promise<string>
  extract: typeof extractWithLuna
  calendar: typeof fetchVenueCalendar
  taxonomy: typeof taxonomyForImport
  image: (client: SanityClient, url: string) => Promise<string | undefined>
}

const defaults: UrlImportDependencies = {
  fetchPage: async url => (await fetchPublic(url)).text(),
  extract: extractWithLuna,
  calendar: fetchVenueCalendar,
  taxonomy: taxonomyForImport,
  image: async (client, url) => {
    const response = await fetchPublic(url, EVENT_IMAGE_MAX_SIZE_BYTES)
    const type = response.headers.get("content-type")?.split(";")[0] ?? ""
    if (!isAcceptedEventImageType(type)) return undefined
    const buffer = Buffer.from(await response.arrayBuffer())
    return (await client.assets.upload("image", buffer, { contentType: type }))
      ._id
  },
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const PRICE = /^\d+(?:\.\d{1,2})?$/

/**
 * Read any public event page with KI and return Studio field values. Crescat
 * bookings are model context only and are never returned or stored; the only
 * write is the uploaded image asset.
 */
export async function importEventFromUrl(
  client: SanityClient,
  url: string,
  deps: UrlImportDependencies = defaults,
): Promise<UrlImportResult> {
  const html = await deps.fetchPage(url)
  const taxonomy = await deps.taxonomy(client)
  const details = ticketDetails(html)
  const source: TicketCoEvent = { "@type": "Event", name: "", url }
  const extracted: Extraction = await deps.extract(
    source,
    `${pageText(html)}\nVerified ticket-page details: ${JSON.stringify(details)}`,
    taxonomy,
    [],
    { traceId: randomUUID(), prompt: getEventUrlPrompt, workflow: WORKFLOW },
  )
  const hasSchedule =
    /^\d{4}-\d{2}-\d{2}$/.test(extracted.startDate) &&
    TIME.test(extracted.startTime) &&
    TIME.test(extracted.endTime)
  const bookings = hasSchedule
    ? (
        await Promise.all(
          Object.values(ROOM_CALENDAR_SLUGS).map(slug =>
            deps.calendar(
              slug,
              extracted.startDate,
              addDaysDateOnly(extracted.startDate, 2),
            ),
          ),
        )
      ).flat()
    : []
  const candidates = hasSchedule
    ? overlappingRooms(
        extracted.startDate,
        extracted.startTime,
        extracted.endTime,
        bookings,
        taxonomy.rooms,
      )
    : []
  const known = (id: string, options: { _id: string }[]) =>
    options.some(option => option._id === id) ? id : ""
  const room =
    matchBookingRoom(extracted.title, candidates) ||
    known(extracted.room, taxonomy.rooms) ||
    bestEffortRoom(candidates) ||
    ""
  const organizerGroup = known(extracted.organizerGroup, taxonomy.groups)
  const price = (field: "priceOrdinar" | "priceStudent" | "priceMedlem") => {
    const value = details[field] || extracted[field]
    return PRICE.test(value) ? value : ""
  }
  const isFree = extracted.isFree && !details.isSoldOut
  const form: FormState = {
    ...initialState,
    title: extracted.title,
    titleEnglish: extracted.titleEnglish,
    description: extracted.description,
    descriptionEnglish: extracted.descriptionEnglish,
    dates: hasSchedule
      ? [
          {
            id: "imported",
            startDate: extracted.startDate,
            startTime: extracted.startTime,
            endTime: extracted.endTime,
          },
        ]
      : [],
    room,
    roomText: room ? "" : extracted.roomText,
    roomTextEnglish: room ? "" : extracted.roomTextEnglish,
    organizerGroup,
    organizerText: organizerGroup ? "" : extracted.organizerText,
    organizerTextEnglish: organizerGroup ? "" : extracted.organizerTextEnglish,
    eventTypeId: known(extracted.eventTypeId, taxonomy.eventTypes),
    isFree,
    isSoldOut: details.isSoldOut,
    priceOrdinar: price("priceOrdinar"),
    priceStudent: price("priceStudent"),
    priceMedlem: price("priceMedlem"),
    // The pasted page is usually where tickets are sold.
    ticketUrl: isFree ? "" : url,
    facebookUrl:
      details.facebookUrls[0] ?? facebookEventUrl(extracted.facebookUrl) ?? "",
  }

  let imageAssetId: string | undefined
  const imageUrl = pageImage(html)
  if (imageUrl)
    imageAssetId = await deps
      .image(client, new URL(imageUrl, url).href)
      .catch(() => undefined)

  const document = buildEventDocument({ ...form, imageAssetId })
  const fields: Record<string, unknown> = {
    isFree: form.isFree,
    isSoldOut: form.isSoldOut,
  }
  for (const key of FIELDS)
    if (document[key] !== undefined) fields[key] = document[key]
  if (!form.dates.length) delete fields.dates

  // The submission rules list what is still missing; submitter is the editor's.
  const check = eventFormSchema.safeParse({
    ...form,
    hasImage: Boolean(imageAssetId),
    submittedBy: "-",
    submittedByEmail: "editor@example.org",
  })
  const missing = check.success
    ? []
    : [...new Set(check.error.issues.map(issue => issue.message))]
  return { fields, missing }
}
