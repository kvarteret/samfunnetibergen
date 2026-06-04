import { resolveEndDateTime, toDateTime } from "./datetime"
import {
    AUDIENCE_COUNT,
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
    metaField,
    ON_BEHALF_OF_STUDENT_ORG,
    OPEN_OR_CLOSED,
    ORDER_PARENT_ID,
    PROMOTION_PARENT_ID,
    STUDENT_ORG_NAME,
    STUDENT_ORG_PARENT_ID,
    TECH_EQUIPMENT,
    TICKET_TYPES,
    TICKETING_PARENT_ID,
} from "./fields"
import type { EventRequestBody } from "./types"

// The two venue forms behind this integration. Both slugs were verified at
// HTTP 201 from captured HAR traces. See docs/adr/001-crescat-integration.md.
export const ROOM_BOOKING_SLUGS = {
    ekstern: "studentersamfunnet-i-bergen-bookingskjema-standard",
    intern: "studentersamfunnet-i-bergen-bookingskjema-dorger-borger-og-interne",
} as const

export type BookerType = keyof typeof ROOM_BOOKING_SLUGS

export interface RoomBookingInput {
    eventName: string
    roomId: number
    startDate: string
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
    contactName: string
    contactEmail: string
    contactPhone: string
    // Ekstern only
    onBehalfOfStudentOrg?: boolean
    studentOrgName?: string
    invoiceAddress?: string
    orgNumber?: number | null
}

function commonHead(input: RoomBookingInput): { start: string; end: string } {
    return {
        start: toDateTime(input.startDate, input.startTime),
        end: resolveEndDateTime(input.startDate, input.startTime, input.endTime),
    }
}

function baseBody(
    input: RoomBookingInput,
    start: string,
    end: string,
): Omit<EventRequestBody, "sections"> {
    return {
        name: input.eventName,
        start,
        end,
        description: input.description,
        request_by_email: input.contactEmail,
        request_by_name: input.contactName,
        request_by_phone: input.contactPhone,
        request_by_country_code: "+47",
        model_id: null,
        model_type: null,
    }
}

// Derived fallbacks so the faithful Crescat payload stays complete even when
// our leaner UI leaves an optional input blank.
const ticketTypesOrNA = (input: RoomBookingInput) =>
    input.freeOrPaid === "Gratis" || !input.ticketTypes.trim() ? "N/A" : input.ticketTypes.trim()
const cateringOrNo = (input: RoomBookingInput) =>
    input.cateringWishes.trim() ? input.cateringWishes.trim() : "Nei"

export function buildExternalBooking(input: RoomBookingInput): EventRequestBody {
    const { start, end } = commonHead(input)

    return {
        ...baseBody(input, start, end),
        sections: [
            {
                title: "Ønsket rom",
                description: "",
                type: "roomBooking",
                content: {
                    roomBookings: [{ title: "", room_id: input.roomId, start, end }],
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
                        metaField(ON_BEHALF_OF_STUDENT_ORG, Boolean(input.onBehalfOfStudentOrg)),
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
                content: [],
            },
            {
                title: "Bestilling",
                description: "Vennligst beskriv så godt som mulig hva du har behov for.",
                type: "metaData",
                content: {
                    fields: [
                        metaField(FURNITURE, input.furniture.trim()),
                        metaField(TECH_EQUIPMENT, input.techEquipment.trim()),
                        metaField(AUDIENCE_COUNT, input.audienceCount),
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
                    fields: [metaField(TICKET_TYPES, ticketTypesOrNA(input))],
                    parent_id: TICKETING_PARENT_ID,
                },
            },
            {
                title: "Bar og catering",
                description:
                    "Det Akademiske Kvarter tilbyr et bredt utvalg av god mat og drikke. Trenger du mat, snacks, drikke osv. kan du forespørre det her. Medbragt mat og drikke er ikke tillatt.",
                type: "metaData",
                content: {
                    fields: [metaField(CATERING_WISHES, cateringOrNo(input))],
                    parent_id: CATERING_PARENT_ID,
                },
            },
            {
                title: "Dagsplan",
                description:
                    "Har du oversikt over tentative tider for arrangementet? Venligst noter ned punkter som rigg, prøver, arrangement, nedrigg osv i feltet under.",
                type: "assignments",
                content: [],
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
                    url: "https://kvarteret.no/avbestillingsvilkar/",
                    text: "<p></p>",
                    title: "Avbestillingsvilkår for Det Akademiske Kvarter (2022)",
                },
            },
        ],
    }
}

export function buildInternalBooking(input: RoomBookingInput): EventRequestBody {
    const { start, end } = commonHead(input)

    return {
        ...baseBody(input, start, end),
        sections: [
            {
                title: "Gjentagende arrangement",
                description:
                    "Hvis arrangementet skal gjentas flere ganger over tid kan du velge det her",
                type: "recurringDates",
                content: null,
            },
            {
                title: "Kontaktpersoner",
                description: "Fyll ut kontaktpersoner for arrangementet her.",
                type: "keyContacts",
                content: [
                    {
                        name: input.contactName,
                        role: "",
                        email: input.contactEmail,
                        phone: input.contactPhone,
                        country_code: "+47",
                    },
                ],
            },
            {
                title: "Lokaler",
                description: "Lokaler som skal brukes i forbindelse med arrangementet.",
                type: "roomBooking",
                content: {
                    roomBookings: [{ title: "", room_id: input.roomId, start, end }],
                    description: input.description,
                },
            },
            {
                title: "Dagsplan",
                description:
                    "Her fyller du ut når ting skjer (get-in, arrangementets start og når det er ferdig)",
                type: "assignments",
                content: [],
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
    return bookerType === "intern" ? buildInternalBooking(input) : buildExternalBooking(input)
}
