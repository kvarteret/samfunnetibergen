import type { EventGroup, EventRoom, EventType } from "@/lib/sanity/fetch"
import type { EventSummary } from "../components/EventCard"
import type { EventFormDate, EventFormState } from "./eventFormSchema"

export type DateEntry = EventFormDate
export type FormState = EventFormState

export type SelectOption = {
  value: string
  label: string
}

let dateCounter = 0

export const newDate = (): DateEntry => ({
  id: `date-${++dateCounter}`,
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
  isInternalEvent: false,
  isFree: false,
  priceOrdinar: "",
  priceStudent: "",
  priceMedlem: "",
  ticketUrl: "",
  facebookUrl: "",
  submittedBy: "",
  submittedByEmail: "",
}

export function buildPreviewEvent(
  state: FormState,
  imagePreviewUrl: string | null,
  rooms: EventRoom[],
  groups: EventGroup[],
  eventTypes: EventType[],
): EventSummary {
  const selectedRoom = rooms.find(room => room._id === state.room)
  const selectedGroup = groups.find(group => group._id === state.organizerGroup)
  const selectedEventType = eventTypes.find(
    eventType => eventType._id === state.eventTypeId,
  )

  return {
    _id: "preview",
    title: state.title.trim() || "midlertidig tittel",
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
    room: selectedRoom
      ? { _id: selectedRoom._id, title: selectedRoom.title, slug: "" }
      : null,
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
