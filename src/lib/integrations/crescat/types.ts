import type { Result } from "@/lib/result"

export interface RoomBookingSection {
    title: string
    description: string
    type: "roomBooking"
    content: {
        roomBookings: Array<{
            title: string
            room_id: number
            start: string
            end: string
        }>
        description: string
    }
}

export interface MetaDataSection {
    title: string
    description: string
    type: "metaData"
    content: {
        fields: Array<{
            id: number
            title: string
            value: string | number | boolean
            component: string
            options: unknown
            class: string
            linebreak_after: boolean
            required: boolean
        }>
        parent_id: number
    }
}

export interface TermsSection {
    title: string
    description: string
    type: "termsOfUse"
    content: { accepted: boolean }
}

export interface RecurringDatesSection {
    title: string
    description: string
    type: "recurringDates"
    content: null
}

export interface KeyContact {
    name: string
    role: string
    email: string
    phone: string
    country_code: string
}

export interface KeyContactsSection {
    title: string
    description: string
    type: "keyContacts"
    content: KeyContact[]
}

export interface Assignment {
    title: string
    description: string | null
    start: string
    end: string
}

export interface AssignmentsSection {
    title: string
    description: string
    type: "assignments"
    content: Assignment[]
}

export interface AlternativeDatesSection {
    title: string
    description: string
    type: "alternativeDates"
    content: string[]
}

export interface MoreInformationSection {
    title: string
    description: string
    type: "moreInformation"
    content: { url: string; text: string; title: string }
}

export type EventRequestSection =
    | RoomBookingSection
    | MetaDataSection
    | TermsSection
    | RecurringDatesSection
    | KeyContactsSection
    | AssignmentsSection
    | AlternativeDatesSection
    | MoreInformationSection

export interface EventRequestBody {
    name: string
    start: string
    end: string
    description: string
    request_by_email: string
    request_by_name: string
    request_by_phone: string
    request_by_country_code: string
    model_id: null
    model_type: null
    sections: EventRequestSection[]
}

export type CresatResult = Result<number>
