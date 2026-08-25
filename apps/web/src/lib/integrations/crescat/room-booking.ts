import {
  resolveAssignmentDateTime,
  resolveEndDateTime,
  toDateTime,
} from "./datetime"
import {
  AUDIENCE_COUNT,
  BAR_KVARTERET,
  BAR_SELF,
  CATERING_PARENT_ID,
  CATERING_WISHES,
  FREE_OR_PAID,
  FURNITURE,
  INVOICE_ADDRESS,
  INVOICE_CONTACT,
  INVOICE_EMAIL,
  INVOICE_ORG_NUMBER,
  INVOICE_PARENT_ID,
  INVOICE_PHONE,
  KVARTERET_PAYMENT_TERMINAL,
  metaField,
  NEEDS_AMPHI,
  ON_BEHALF_OF_STUDENT_ORG,
  OPEN_OR_CLOSED,
  ORDER_PARENT_ID,
  OWN_PAYMENT_TERMINAL,
  OWN_TICKET_SYSTEM,
  PROMOTION_PARENT_ID,
  STUDENT_ORG_NAME,
  STUDENT_ORG_PARENT_ID,
  TECH_EQUIPMENT,
  TICKET_TYPES,
  TICKETING_PARENT_ID,
} from "./fields"
import { splitE164ForCrescat } from "./phone"
import type { Assignment, EventRequestBody, KeyContact } from "./types"

// The two venue forms behind this integration. Both slugs were verified at
// HTTP 201 from captured HAR traces. See docs/adr/001-crescat-integration.md.
export const ROOM_BOOKING_SLUGS = {
  ekstern: "studentersamfunnet-i-bergen-bookingskjema-standard",
  intern: "studentersamfunnet-i-bergen-bookingskjema-dorger-borger-og-interne",
} as const

// The website offers three booker types. Studentorg books through the same
// standard form as ekstern, but flags the "på vegne av studentorganisasjon"
// metadata; intern uses the internal form.
export type BookerType = "ekstern" | "studentorg" | "intern"

const SLUG_BY_BOOKER_TYPE: Record<
  BookerType,
  (typeof ROOM_BOOKING_SLUGS)[keyof typeof ROOM_BOOKING_SLUGS]
> = {
  ekstern: ROOM_BOOKING_SLUGS.ekstern,
  studentorg: ROOM_BOOKING_SLUGS.ekstern,
  intern: ROOM_BOOKING_SLUGS.intern,
}

export function slugForBookerType(bookerType: BookerType): string {
  return SLUG_BY_BOOKER_TYPE[bookerType]
}

export interface RoomBookingInput {
  eventName: string
  roomId?: number
  startDate: string
  endDate?: string
  startTime: string
  endTime: string
  description: string
  audienceCount: number
  openOrClosed: "Åpent" | "Lukket"
  furniture: string
  techEquipment: string
  cateringWishes: string
  freeOrPaid: "Gratis" | "Betalt"
  ticketTypes: string
  // Paid events only: "house" = husets billettkasse, "ownTerminal" = egen
  // betalingsterminal. Maps to the new Crescat ticketing metadata field.
  ticketSalesMethod?: "house" | "ownTerminal"
  contactName: string
  contactEmail: string
  contactPhone: string
  // Optional: when doors open each day (HH:mm), indexed from startDate. Each
  // non-empty entry adds a 0-minute "Doors" timeline entry for that day.
  doorsTimes?: string[]
  // Optional: estimated public end time per day. Each non-empty entry adds a
  // 0-minute "Antatt slutt" timeline entry.
  estimatedEndTimes?: string[]
  // Ekstern only
  onBehalfOfStudentOrg?: boolean
  studentOrgName?: string
  invoiceAddress?: string
  orgNumber?: number | null
  // Ekstern only: flexible on date/room. No Crescat field — appended to description.
  flexibleDates?: boolean
  // New Crescat fields (2026-06-15 drift reconciliation)
  needsAmphi?: boolean
  barSelf?: boolean
  barKvarteret?: boolean
  alternativeDates?: string[]
  recurringDates?: string[]
  roomIds: number[]
  keyContacts?: KeyContact[]
  contactRole?: string
}

function commonHead(input: RoomBookingInput): { start: string; end: string } {
  return {
    start: toDateTime(input.startDate, input.startTime),
    end: resolveEndDateTime(
      input.endDate ?? input.startDate,
      input.startTime,
      input.endTime,
    ),
  }
}

function baseBody(
  input: RoomBookingInput,
  start: string,
  end: string,
): Omit<EventRequestBody, "sections"> {
  const phone = splitE164ForCrescat(input.contactPhone)

  return {
    name: input.eventName,
    start,
    end,
    description: input.description,
    request_by_email: input.contactEmail,
    request_by_name: input.contactName,
    request_by_phone: phone.phone,
    request_by_country_code: phone.countryCode,
    model_id: null,
    model_type: null,
  }
}

// Derived fallbacks so the faithful Crescat payload stays complete even when
// our leaner UI leaves an optional input blank.
const ticketTypesOrNA = (input: RoomBookingInput) =>
  input.freeOrPaid === "Gratis" || !input.ticketTypes.trim()
    ? "N/A"
    : input.ticketTypes.trim()
const cateringOrNo = (input: RoomBookingInput) =>
  input.cateringWishes.trim() ? input.cateringWishes.trim() : "Nei"

function splitKeyContactPhone(contact: KeyContact): KeyContact {
  const phone = splitE164ForCrescat(contact.phone)
  return {
    ...contact,
    phone: phone.phone,
    country_code: phone.countryCode,
  }
}

// 0-minute timeline entries for "Doors" and "Antatt slutt" per day.
function timelineAssignments(input: RoomBookingInput): Assignment[] {
  const doorsTimes = input.doorsTimes ?? []
  const estimatedEndTimes = input.estimatedEndTimes ?? []
  const isMultiDay = Math.max(doorsTimes.length, estimatedEndTimes.length) > 1

  const dayCount = Math.max(doorsTimes.length, estimatedEndTimes.length)
  const entries: Assignment[] = []

  for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
    const doorsTime = doorsTimes[dayIndex]
    const estimatedEnd = estimatedEndTimes[dayIndex]

    if (doorsTime) {
      const start = resolveAssignmentDateTime({
        startDate: input.startDate,
        endDate: input.endDate,
        startTime: input.startTime,
        endTime: input.endTime,
        assignmentTime: doorsTime,
        dayIndex,
      })
      const title = isMultiDay ? `Doors dag ${dayIndex + 1}` : "Doors"
      entries.push({ title, description: null, start, end: start })
    }

    if (estimatedEnd) {
      const start = resolveAssignmentDateTime({
        startDate: input.startDate,
        endDate: input.endDate,
        startTime: input.startTime,
        endTime: input.endTime,
        assignmentTime: estimatedEnd,
        dayIndex,
      })
      const title = isMultiDay
        ? `Antatt slutt dag ${dayIndex + 1}`
        : "Antatt slutt"
      entries.push({ title, description: null, start, end: start })
    }
  }

  return entries
}

// Ekstern/studentorg may flag flexibility on date/room (no Crescat field).
// When set, the note is prepended to the description so the room coordinator
// sees it first, ahead of the organizer's own text. When structured alternative
// dates are provided, skip the free-text note to avoid duplicate signal.
const FLEXIBLE_DATES_NOTE =
  "Dato og rom er fleksibelt. Kvarteret kan foreslå et annet tidspunkt eller rom hvis dette passer bedre."

function descriptionWithFlexible(input: RoomBookingInput): string {
  if (!input.flexibleDates) return input.description
  if (input.alternativeDates?.length) return input.description
  return input.description.trim()
    ? `${FLEXIBLE_DATES_NOTE}\n\n${input.description.trim()}`
    : FLEXIBLE_DATES_NOTE
}

function roomBookingsFor(input: RoomBookingInput, start: string, end: string) {
  const ids = input.roomIds?.length
    ? input.roomIds
    : input.roomId
      ? [input.roomId]
      : []
  if (ids.length === 0)
    throw new Error("roomBookingsFor: at least one room ID is required")
  return ids.map(roomId => ({ title: "", room_id: roomId, start, end }))
}

export function buildExternalBooking(
  input: RoomBookingInput,
): EventRequestBody {
  const { start, end } = commonHead(input)
  const description = descriptionWithFlexible(input)

  return {
    ...baseBody(input, start, end),
    description,
    sections: [
      {
        title: "Ønsket rom",
        description: "",
        type: "roomBooking",
        content: {
          roomBookings: roomBookingsFor(input, start, end),
          description: input.description,
        },
      },
      {
        title: "Er bookingen på vegne av en studentorganisasjon?",
        description:
          "Studentorganisasjoner registrert under Studentbergen.no får booke rom hos Kvarteret gratis. Ekstratjenester som catering, teknikere, underholdningspakker og liknende kommer som betalt tillegg.",
        type: "metaData",
        content: {
          fields: [
            metaField(
              ON_BEHALF_OF_STUDENT_ORG,
              Boolean(input.onBehalfOfStudentOrg),
            ),
            metaField(STUDENT_ORG_NAME, input.studentOrgName?.trim() ?? ""),
          ],
          parent_id: STUDENT_ORG_PARENT_ID,
        },
      },
      {
        title: "Alternative datoer",
        description:
          "Hvis du har alternative datoer som kan passe for ditt arrangement ber vi deg velge dem her.",
        type: "alternativeDates",
        content: input.alternativeDates ?? [],
      },
      {
        title: "Bestilling",
        description:
          "Vennligst beskriv så godt som mulig hva du har behov for.",
        type: "metaData",
        content: {
          fields: [
            metaField(FURNITURE, input.furniture.trim()),
            metaField(TECH_EQUIPMENT, input.techEquipment.trim()),
            metaField(AUDIENCE_COUNT, input.audienceCount),
            metaField(NEEDS_AMPHI, Boolean(input.needsAmphi)),
            metaField(OPEN_OR_CLOSED, input.openOrClosed),
          ],
          parent_id: ORDER_PARENT_ID,
        },
      },
      {
        title: "Billettsalg / inngangspriser",
        description:
          'Skal du selge billetter og/eller ta betalt for inngang til ditt arrangement ønsker vi å vite hvilke typer billetter som selges og hva disse koster. Er ikke dette feltet relevant for ditt arrangement ber vi om at feltet fylles ut som "N/A"',
        type: "metaData",
        content: {
          fields: [
            metaField(TICKET_TYPES, ticketTypesOrNA(input)),
            metaField(
              KVARTERET_PAYMENT_TERMINAL,
              input.ticketSalesMethod === "house",
            ),
            metaField(
              OWN_PAYMENT_TERMINAL,
              input.ticketSalesMethod === "ownTerminal",
            ),
          ],
          parent_id: TICKETING_PARENT_ID,
        },
      },
      {
        title: "Mat og drikke",
        description:
          "Det Akademiske Kvarter tilbyr et bredt utvalg av god mat og drikke. Trenger du mat, snacks, drikke osv. kan du forespørre det her. Medbragt mat og drikke er ikke tillatt.",
        type: "metaData",
        content: {
          fields: [
            metaField(CATERING_WISHES, cateringOrNo(input)),
            metaField(BAR_SELF, Boolean(input.barSelf)),
            metaField(BAR_KVARTERET, Boolean(input.barKvarteret)),
          ],
          parent_id: CATERING_PARENT_ID,
        },
      },
      {
        title: "Dagsplan",
        description:
          "Har du oversikt over tentative tider for arrangementet? Venligst noter ned punkter som rigg, prøver, arrangement, nedrigg osv i feltet under.",
        type: "assignments",
        content: timelineAssignments(input),
      },
      {
        title: "Promotering",
        description:
          "Vi vil gjerne promotere ditt arrangement på vår nettside. Du blir tilsendt instruksjoner for hvordan du går frem når bookingen er godkjent av en administrator.",
        type: "metaData",
        content: { fields: [], parent_id: PROMOTION_PARENT_ID },
      },
      {
        title: "Fakturainformasjon",
        description:
          "Om vi har behov for å sende en faktura trenger vi fakturainformasjon.",
        type: "metaData",
        content: {
          fields: [
            metaField(INVOICE_CONTACT, input.contactName),
            metaField(INVOICE_ADDRESS, input.invoiceAddress?.trim() ?? ""),
            metaField(INVOICE_EMAIL, input.contactEmail),
            metaField(INVOICE_PHONE, input.contactPhone),
            metaField(INVOICE_ORG_NUMBER, input.orgNumber ?? ""),
          ],
          parent_id: INVOICE_PARENT_ID,
        },
      },
      {
        title: "Vilkår for booking",
        description:
          "For å booke rom på Det Akademiske Kvarter må du godkjenne våre bookingvilkår.",
        type: "termsOfUse",
        content: { accepted: true },
      },
      {
        title: "Vilkår for avbestilling",
        description: "",
        type: "moreInformation",
        content: {
          url: "https://samfunnetibergen.no/avbestillingsvilkar",
          text: "<p></p>",
          title: "Avbestillingsvilkår for Det Akademiske Kvarter (2022)",
        },
      },
    ],
  }
}

export function buildInternalBooking(
  input: RoomBookingInput,
): EventRequestBody {
  const { start, end } = commonHead(input)

  return {
    ...baseBody(input, start, end),
    sections: [
      {
        title: "Gjentagende arrangement",
        description:
          "Hvis arrangementet skal gjentas flere ganger over tid kan du velge det her",
        type: "recurringDates",
        content: input.recurringDates ?? null,
      },
      {
        title: "Kontaktpersoner",
        description: "Fyll ut kontaktpersoner for arrangementet her.",
        type: "keyContacts",
        content: input.keyContacts?.length
          ? input.keyContacts.map(splitKeyContactPhone)
          : [
              splitKeyContactPhone({
                name: input.contactName,
                role: input.contactRole ?? "",
                email: input.contactEmail,
                phone: input.contactPhone,
                country_code: "+47",
              }),
            ],
      },
      {
        title: "Lokaler",
        description: "Lokaler som skal brukes i forbindelse med arrangementet.",
        type: "roomBooking",
        content: {
          roomBookings: roomBookingsFor(input, start, end),
          description: input.description,
        },
      },
      {
        title: "Dagsplan",
        description:
          "Her fyller du ut når ting skjer (get-in, arrangementets start og når det er ferdig)",
        type: "assignments",
        content: timelineAssignments(input),
      },
      {
        title: "Bestilling",
        description: "",
        type: "metaData",
        content: {
          fields: [
            metaField(FURNITURE, input.furniture.trim()),
            metaField(TECH_EQUIPMENT, input.techEquipment.trim()),
            metaField(AUDIENCE_COUNT, input.audienceCount),
            metaField(NEEDS_AMPHI, Boolean(input.needsAmphi)),
            metaField(OPEN_OR_CLOSED, input.openOrClosed),
          ],
          parent_id: ORDER_PARENT_ID,
        },
      },
      {
        title: "Billettsalg",
        description:
          "Hvis du skal selge billetter gjennom vårt kassesystem vil vi at du oppgir billettyper og hva disse koster i feltet under.",
        type: "metaData",
        content: {
          fields: [
            metaField(FREE_OR_PAID, input.freeOrPaid),
            metaField(TICKET_TYPES, ticketTypesOrNA(input)),
            metaField(
              KVARTERET_PAYMENT_TERMINAL,
              input.ticketSalesMethod === "house",
            ),
            metaField(
              OWN_TICKET_SYSTEM,
              input.ticketSalesMethod === "ownTerminal",
            ),
          ],
          parent_id: TICKETING_PARENT_ID,
        },
      },
      {
        title: "Catering/bar",
        description:
          "Det Akademiske Kvarter tilbyr et bredt utvalg av god mat og drikke. Trenger du mat, snacks, drikke osv. kan du forespørre det her.",
        type: "metaData",
        content: {
          fields: [metaField(CATERING_WISHES, cateringOrNo(input))],
          parent_id: CATERING_PARENT_ID,
        },
      },
      {
        title: "Avbestillingsvilkår",
        description: "",
        type: "termsOfUse",
        content: { accepted: true },
      },
    ],
  }
}

export function buildRoomBooking(
  bookerType: BookerType,
  input: RoomBookingInput,
): EventRequestBody {
  if (bookerType === "intern") {
    return buildInternalBooking(input)
  }
  // ekstern + studentorg both submit the standard form; studentorg flags the
  // "på vegne av studentorganisasjon" metadata.
  const isStudentOrg = bookerType === "studentorg"
  return buildExternalBooking({
    ...input,
    onBehalfOfStudentOrg: isStudentOrg,
    studentOrgName: isStudentOrg ? (input.studentOrgName ?? "") : "",
  })
}
