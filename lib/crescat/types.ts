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

export type EventRequestSection = RoomBookingSection | MetaDataSection | TermsSection

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

export type CresatResult = { ok: true; status: number } | { ok: false; error: string }
