import type { BookerType } from "@/lib/integrations/crescat/room-booking"
import type { RoomBookingPayload } from "../actions/submit-room-booking"
import type { BookingRoom } from "../types"

export type { BookerType }

export interface TicketType {
  name: string
  price: string
}

export interface BookingFormState {
  bookerType: BookerType
  studentOrgName: string
  selectedRoomIds: number[]
  eventName: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  // One entry per day spanned by the booking, indexed from the start date.
  // Each day's "doors open" time is mandatory for day 0, optional for others.
  doorsTimes: string[]
  // One entry per day. Estimated time the public event ends. Always optional.
  estimatedEndTimes: string[]
  audienceCount: string
  openOrClosed: "Åpent" | "Lukket"
  description: string
  furniture: string
  micEnabled: boolean
  micQuantity: number
  projector: boolean
  music: boolean
  soundTech: boolean
  lightTech: boolean
  riggingSetup: boolean
  riggingTeardown: boolean
  needsAmphi: boolean
  cateringCustom: boolean
  cateringText: string
  barSelf: boolean
  barKvarteret: boolean
  freeOrPaid: "Gratis" | "Betalt"
  ticketTypes: TicketType[]
  invoiceAddress: string
  orgNumber: string
  flexibleDates: boolean
  acceptTerms: boolean
  contactName: string
  contactEmail: string
  contactPhone: string
  // Website-only: whether to also publish the booking as a promoted event.
  // Never sent to Crescat.
  promote: "" | "ja" | "nei"
}

export const initialBookingState: BookingFormState = {
  bookerType: "ekstern",
  studentOrgName: "",
  selectedRoomIds: [],
  eventName: "",
  startDate: "",
  endDate: "",
  startTime: "19:00",
  endTime: "23:00",
  doorsTimes: [],
  estimatedEndTimes: [],
  audienceCount: "1",
  openOrClosed: "Åpent",
  description: "",
  furniture: "",
  micEnabled: false,
  micQuantity: 1,
  projector: false,
  music: false,
  soundTech: false,
  lightTech: false,
  riggingSetup: false,
  riggingTeardown: false,
  needsAmphi: false,
  cateringCustom: false,
  cateringText: "",
  barSelf: false,
  barKvarteret: false,
  freeOrPaid: "Gratis",
  ticketTypes: [{ name: "Ordinær", price: "200" }],
  invoiceAddress: "",
  orgNumber: "",
  flexibleDates: false,
  acceptTerms: false,
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  promote: "ja",
}

export const isExternalBooker = (bookerType: BookerType): boolean =>
  bookerType !== "intern"

// --- Crescat free-text composition (shared by the order summary and payload) ---

export function composeTechEquipment(state: BookingFormState): string {
  const parts: string[] = []
  if (state.micEnabled) parts.push(`Mikrofon ${state.micQuantity}x`)
  if (state.projector) parts.push("Projektor + lerret")
  if (state.music) parts.push("Musikkavspilling")
  if (state.soundTech) parts.push("Dedikert lydtekniker")
  if (state.lightTech) parts.push("Dedikert lystekniker")
  if (state.riggingSetup) parts.push("Opprigg og oppsett av møblement")
  if (state.riggingTeardown) parts.push("Nedrigg og rydding")
  return parts.length > 0 ? parts.join(", ") : "Ingen"
}

export function composeCatering(state: BookingFormState): string {
  const parts: string[] = []
  if (state.cateringCustom) {
    parts.push(state.cateringText.trim() || "Ønsker skreddersydd meny")
  }
  return parts.join("\n")
}

export function buildBookingPayload(
  state: BookingFormState,
  rooms: BookingRoom[],
): RoomBookingPayload {
  const isExternal = isExternalBooker(state.bookerType)
  return {
    bookerType: state.bookerType,
    eventName: state.eventName,
    roomIds: rooms.map(r => r.crescatRoomId),
    startDate: state.startDate,
    endDate: state.endDate || undefined,
    startTime: state.startTime,
    endTime: state.endTime,
    doorsTimes: state.doorsTimes.some(Boolean) ? state.doorsTimes : undefined,
    estimatedEndTimes: state.estimatedEndTimes.some(Boolean)
      ? state.estimatedEndTimes
      : undefined,
    description: state.description,
    audienceCount: Number(state.audienceCount) || 0,
    openOrClosed: state.openOrClosed,
    furniture: state.furniture,
    techEquipment: composeTechEquipment(state),
    cateringWishes: composeCatering(state),
    freeOrPaid: state.freeOrPaid,
    ticketTypes: state.ticketTypes
      .filter(t => t.name.trim())
      .map(t => `${t.name} ${t.price} kr`)
      .join(", "),
    contactName: state.contactName,
    contactEmail: state.contactEmail,
    contactPhone: state.contactPhone,
    acceptTerms: true,
    flexibleDates: isExternal ? state.flexibleDates : undefined,
    needsAmphi: state.needsAmphi,
    barSelf: state.barSelf,
    barKvarteret: state.barKvarteret,
    studentOrgName:
      state.bookerType === "studentorg" ? state.studentOrgName : undefined,
    invoiceAddress: isExternal ? state.invoiceAddress : undefined,
    orgNumber:
      isExternal && state.orgNumber.trim()
        ? Number(state.orgNumber)
        : undefined,
  }
}

export function canSubmitBooking(
  state: BookingFormState,
  roomSelected: boolean,
  hasConflict: boolean,
): boolean {
  const isExternal = isExternalBooker(state.bookerType)
  const hasRooms = state.selectedRoomIds.length > 0
  return (
    hasRooms &&
    !hasConflict &&
    state.eventName.trim() !== "" &&
    state.startDate !== "" &&
    state.doorsTimes.length > 0 &&
    state.doorsTimes.every(Boolean) &&
    state.audienceCount.trim() !== "" &&
    state.furniture.trim() !== "" &&
    state.contactName.trim() !== "" &&
    state.contactEmail.trim() !== "" &&
    (!isExternal || state.invoiceAddress.trim() !== "") &&
    (state.bookerType !== "studentorg" || state.studentOrgName.trim() !== "") &&
    state.acceptTerms
  )
}
