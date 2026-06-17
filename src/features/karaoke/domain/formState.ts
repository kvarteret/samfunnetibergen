import type { KaraokeBookingPayload, PriceType } from "../types"
import { addHours, minutesToTimeOfDay, resolveSlotDate } from "./time"

export const KARAOKE_DURATION_OPTIONS = [1, 2, 3, 4] as const

export const KARAOKE_PRICING: Record<
  PriceType,
  { perPerson: number; minPerHour: number }
> = {
  ordinær: { perPerson: 79, minPerHour: 395 },
  student: { perPerson: 59, minPerHour: 295 },
  frivillig: { perPerson: 0, minPerHour: 0 },
}

export type KaraokeFormState = {
  eventName: string
  startDate: string
  startSlotMin: number | null
  duration: number
  description: string
  contactName: string
  contactEmail: string
  contactPhone: string
  priceType: PriceType
  numberOfPeople: string
  acceptTerms: boolean
  studentProofAccepted: boolean
}

export type KaraokeDerivedState = {
  startTime: string
  bookingStartDate: string
  endTime: string
  people: number
  totalPrice: number
}

export const initialKaraokeState: KaraokeFormState = {
  eventName: "",
  startDate: "",
  startSlotMin: null,
  duration: 2,
  description: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  priceType: "student",
  numberOfPeople: "4",
  acceptTerms: false,
  studentProofAccepted: false,
}

export function deriveKaraokeState(
  state: KaraokeFormState,
): KaraokeDerivedState {
  const startTime =
    state.startSlotMin === null ? "" : minutesToTimeOfDay(state.startSlotMin)
  return {
    startTime,
    bookingStartDate:
      state.startDate && state.startSlotMin !== null
        ? resolveSlotDate(state.startDate, state.startSlotMin)
        : "",
    endTime: addHours(startTime, state.duration),
    people: Number.parseInt(state.numberOfPeople) || 0,
    totalPrice: calcKaraokePrice(
      state.priceType,
      Number.parseInt(state.numberOfPeople) || 0,
      state.duration,
    ),
  }
}

export function canSubmitKaraokeBooking(state: KaraokeFormState): boolean {
  return (
    state.eventName.trim() !== "" &&
    state.startDate !== "" &&
    state.startSlotMin !== null &&
    state.contactName.trim() !== "" &&
    state.contactEmail.trim() !== "" &&
    state.acceptTerms &&
    (state.priceType !== "student" || state.studentProofAccepted)
  )
}

export function buildKaraokePayload(
  state: KaraokeFormState,
  derived: KaraokeDerivedState,
): KaraokeBookingPayload {
  return {
    eventName: state.eventName,
    startDate: derived.bookingStartDate,
    startTime: derived.startTime,
    duration: state.duration,
    endTime: derived.endTime,
    description: state.description,
    contactName: state.contactName,
    contactEmail: state.contactEmail,
    contactPhone: state.contactPhone,
    priceType: state.priceType,
    numberOfPeople: derived.people,
    totalPrice: derived.totalPrice,
    studentProofAccepted: state.studentProofAccepted,
    acceptTerms: state.acceptTerms,
  }
}

export function formatKaraokeDate(dateStr: string): string {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("nb-NO", {
    weekday: "short",
    day: "numeric",
    month: "long",
  })
}

export function calcKaraokePrice(
  priceType: PriceType,
  people: number,
  durationHours: number,
): number {
  if (people <= 0 || priceType === "frivillig") return 0
  const price = KARAOKE_PRICING[priceType]
  return Math.max(price.perPerson * people, price.minPerHour) * durationHours
}


