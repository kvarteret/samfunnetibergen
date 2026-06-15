import type { BookerType } from "@/lib/integrations/crescat/room-booking"
import type { RoomBookingPayload } from "../actions/submit-room-booking"
import type { BookingRoom } from "../types"

export type { BookerType }

export interface BookingFormState {
  bookerType: BookerType
  studentOrgName: string
  selectedRoomId: number
  eventName: string
  startDate: string
  startTime: string
  endTime: string
  doorsTime: string
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
  cateringCustom: boolean
  cateringText: string
  bar: boolean
  freeOrPaid: "Gratis" | "Betalt"
  ticketTypes: string
  invoiceAddress: string
  orgNumber: string
  flexibleDates: boolean
  acceptTerms: boolean
  contactName: string
  contactEmail: string
  contactPhone: string
}

export const initialBookingState: BookingFormState = {
  bookerType: "ekstern",
  studentOrgName: "",
  selectedRoomId: 0,
  eventName: "",
  startDate: "",
  startTime: "19:00",
  endTime: "23:00",
  doorsTime: "",
  audienceCount: "",
  openOrClosed: "Åpent",
  description: "",
  furniture: "",
  micEnabled: false,
  micQuantity: 1,
  projector: false,
  music: false,
  soundTech: false,
  lightTech: false,
  cateringCustom: false,
  cateringText: "",
  bar: false,
  freeOrPaid: "Gratis",
  ticketTypes: "",
  invoiceAddress: "",
  orgNumber: "",
  flexibleDates: false,
  acceptTerms: false,
  contactName: "",
  contactEmail: "",
  contactPhone: "",
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
  return parts.length > 0 ? parts.join(", ") : "Ingen"
}

export function composeCatering(state: BookingFormState): string {
  const parts: string[] = []
  if (state.cateringCustom) {
    parts.push(state.cateringText.trim() || "Ønsker skreddersydd meny")
  }
  if (state.bar) {
    parts.push("Bar: ønsker at Kvarteret stiller i bar (2000 kr eks. mva)")
  }
  return parts.join("\n")
}

export function buildBookingPayload(
  state: BookingFormState,
  room: BookingRoom,
): RoomBookingPayload {
  const isExternal = isExternalBooker(state.bookerType)
  return {
    bookerType: state.bookerType,
    eventName: state.eventName,
    roomId: room.crescatRoomId,
    startDate: state.startDate,
    startTime: state.startTime,
    endTime: state.endTime,
    doorsTime: state.doorsTime || undefined,
    description: state.description,
    audienceCount: Number(state.audienceCount) || 0,
    openOrClosed: state.openOrClosed,
    furniture: state.furniture,
    techEquipment: composeTechEquipment(state),
    cateringWishes: composeCatering(state),
    freeOrPaid: state.freeOrPaid,
    ticketTypes: state.ticketTypes,
    contactName: state.contactName,
    contactEmail: state.contactEmail,
    contactPhone: state.contactPhone,
    acceptTerms: true,
    flexibleDates: isExternal ? state.flexibleDates : undefined,
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
  return (
    roomSelected &&
    !hasConflict &&
    state.eventName.trim() !== "" &&
    state.startDate !== "" &&
    state.audienceCount.trim() !== "" &&
    state.furniture.trim() !== "" &&
    state.contactName.trim() !== "" &&
    state.contactEmail.trim() !== "" &&
    (!isExternal || state.invoiceAddress.trim() !== "") &&
    (state.bookerType !== "studentorg" || state.studentOrgName.trim() !== "") &&
    state.acceptTerms
  )
}
