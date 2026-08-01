import type { BookerType } from "@/lib/integrations/crescat/room-booking"
import type { RoomBookingPayload } from "../actions/submit-room-booking"
import type {
  BookingFormState as BookingFormSchemaState,
  TicketType,
} from "./bookingFormSchema"

export type { BookerType }
export type BookingFormState = BookingFormSchemaState
export type { TicketType }

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
  ticketSalesMethod: "house",
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

const BOOKER_TYPE_LABELS: Record<BookerType, string> = {
  ekstern: "Privat",
  studentorg: "Studentorganisasjon",
  intern: "Intern",
}

export const bookerTypeLabel = (bookerType: BookerType): string =>
  BOOKER_TYPE_LABELS[bookerType]

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
  roomIds: number[],
): RoomBookingPayload {
  const isExternal = isExternalBooker(state.bookerType)
  return {
    bookerType: state.bookerType,
    eventName: state.eventName,
    roomIds,
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
    ticketSalesMethod:
      state.freeOrPaid === "Betalt" ? state.ticketSalesMethod : undefined,
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
