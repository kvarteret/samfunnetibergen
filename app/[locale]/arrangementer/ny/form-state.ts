import type { ArrangementEventType, ArrangementGroup, ArrangementRoom } from "@/lib/sanity/queries"
import type { ArrangementSummary } from "../ArrangementCard"

export type DateEntry = {
    id: string
    startDate: string
    startTime: string
    endTime: string
}

export type FormState = {
    title: string
    description: string
    dates: DateEntry[]
    isRecurring: boolean
    rrule: string
    room: string
    roomText: string
    organizerGroup: string
    organizerText: string
    submittedByOrganization: string
    eventTypeId: string
    isFree: boolean
    priceOrdinar: string
    priceStudent: string
    priceMedlem: string
    ticketUrl: string
    facebookUrl: string
    submittedBy: string
    submittedByEmail: string
}

type Action =
    | { type: "SET"; key: keyof FormState; value: string | boolean }
    | { type: "ADD_DATE" }
    | { type: "REMOVE_DATE"; id: string }
    | { type: "UPDATE_DATE"; id: string; key: keyof DateEntry; value: string }

export type SubmitStatus = "idle" | "success" | "error"

export type SelectOption = {
    value: string
    label: string
}

type ScalarFormFieldKey = {
    [Key in keyof FormState]: FormState[Key] extends string | boolean ? Key : never
}[keyof FormState]

export type SetFormField = <Key extends ScalarFormFieldKey>(
    key: Key,
) => (value: FormState[Key]) => void

export type UpdateDateField = (id: string, key: keyof DateEntry, value: string) => void

const newDate = (): DateEntry => ({
    id: Math.random().toString(36).slice(2),
    startDate: "",
    startTime: "",
    endTime: "",
})

export const initialState: FormState = {
    title: "",
    description: "",
    dates: [newDate()],
    isRecurring: false,
    rrule: "",
    room: "",
    roomText: "",
    organizerGroup: "",
    organizerText: "",
    submittedByOrganization: "",
    eventTypeId: "",
    isFree: false,
    priceOrdinar: "",
    priceStudent: "",
    priceMedlem: "",
    ticketUrl: "",
    facebookUrl: "",
    submittedBy: "",
    submittedByEmail: "",
}

export function reducer(state: FormState, action: Action): FormState {
    switch (action.type) {
        case "SET":
            return { ...state, [action.key]: action.value }
        case "ADD_DATE":
            return { ...state, dates: [...state.dates, newDate()] }
        case "REMOVE_DATE":
            return { ...state, dates: state.dates.filter(date => date.id !== action.id) }
        case "UPDATE_DATE":
            return {
                ...state,
                dates: state.dates.map(date =>
                    date.id === action.id ? { ...date, [action.key]: action.value } : date,
                ),
            }
    }
}

export function buildPreviewArrangement(
    state: FormState,
    imagePreviewUrl: string | null,
    rooms: ArrangementRoom[],
    groups: ArrangementGroup[],
    eventTypes: ArrangementEventType[],
): ArrangementSummary {
    const selectedRoom = rooms.find(room => room._id === state.room)
    const selectedGroup = groups.find(group => group._id === state.organizerGroup)
    const selectedEventType = eventTypes.find(eventType => eventType._id === state.eventTypeId)

    return {
        _id: "preview",
        title: state.title.trim() || "Arrangementstittelen",
        slug: "preview",
        isRecurring: state.isRecurring,
        dates: state.dates
            .filter(date => date.startDate)
            .map(date => ({
                _key: date.id,
                startDate: date.startDate,
                startTime: date.startTime || null,
                endTime: date.endTime || null,
            })),
        isFree: state.isFree,
        priceOrdinar: state.priceOrdinar ? Number(state.priceOrdinar) : null,
        priceStudent: state.priceStudent ? Number(state.priceStudent) : null,
        priceMedlem: state.priceMedlem ? Number(state.priceMedlem) : null,
        ticketUrl: state.ticketUrl || null,
        facebookUrl: state.facebookUrl || null,
        imageUrl: imagePreviewUrl,
        imageCaption: null,
        room: selectedRoom ? { _id: selectedRoom._id, title: selectedRoom.title, slug: "" } : null,
        roomText: state.roomText || null,
        organizerGroup: selectedGroup
            ? { _id: selectedGroup._id, name: selectedGroup.name, slug: "" }
            : null,
        organizerText: state.organizerText || null,
        eventType: selectedEventType
            ? {
                  _id: selectedEventType._id,
                  name: selectedEventType.name,
                  taxonomyGroup: selectedEventType.taxonomyGroup
                      ? {
                            _id: selectedEventType.taxonomyGroup._id,
                            name: selectedEventType.taxonomyGroup.name,
                        }
                      : null,
              }
            : null,
    }
}
