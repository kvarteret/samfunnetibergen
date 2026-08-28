import {
  type ClosedDate,
  combineOpeningRangesForDate,
  hasOpeningHoursRows,
  type OpeningHours,
  timeToMinutes,
  type VacationMode,
} from "@/lib/opening-hours"
import type { BookingRoom } from "../types"
import { durationHoursBetweenDates } from "./availability"
import type { BookingFormState } from "./formState"

const VAT_RATE = 0.25
const TECH_PRICE = 3500
const RIGGING_PRICE = 2000
const BAR_KVARTERET_PRICE = 2000

const TEGLVERKET_CRESCAT_ROOM_ID = 97
const STILLHET_CRESCAT_ROOM_ID = 118
const STØY_CRESCAT_ROOM_ID = 117

// Rooms eligible for free backstage when Teglverket is booked.
// One is free; if both are selected the cheaper one is free.
const BACKSTAGE_ROOM_IDS = new Set([
  STILLHET_CRESCAT_ROOM_ID,
  STØY_CRESCAT_ROOM_ID,
])

export interface PriceLine {
  label: string
  amount: number
}

export interface PriceSummary {
  lines: PriceLine[]
  subtotalExVat: number
  vat: number
  totalIncVat: number
}

export interface PriceSummaryLabels {
  room: string
  hours: string
  soundTechnician: string
  lightingTechnician: string
  riggingSetup: string
  riggingTeardown: string
  barHouse: string
}

const DEFAULT_PRICE_SUMMARY_LABELS: PriceSummaryLabels = {
  room: "Rom",
  hours: "t",
  soundTechnician: "Lydtekniker",
  lightingTechnician: "Lystekniker",
  riggingSetup: "Opprigg og oppsett av møblement",
  riggingTeardown: "Nedrigg og rydding",
  barHouse: "Kvarteret står i bar",
}

function billableHoursForRoom(
  room: BookingRoom,
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  baseHours: OpeningHours | null,
  closedDates: ClosedDate[],
  vacationMode?: VacationMode | null,
): number {
  const totalHours = durationHoursBetweenDates(
    startDate,
    startTime,
    endDate,
    endTime,
  )
  const hasRoomHours = hasOpeningHoursRows(room.openingHours ?? null)
  if (!hasRoomHours || (endDate && endDate !== startDate)) return totalHours

  const ranges = combineOpeningRangesForDate(
    startDate,
    baseHours,
    room.openingHours ?? null,
    closedDates,
    vacationMode,
  )
  if (ranges.length === 0) return totalHours

  const bookStart = timeToMinutes(startTime) ?? 0
  let bookEnd = timeToMinutes(endTime) ?? 0
  if (bookEnd <= bookStart) bookEnd += 24 * 60

  let billableMinutes = 0
  for (const range of ranges) {
    const overlapStart = Math.max(bookStart, range.startMin)
    const overlapEnd = Math.min(bookEnd, range.endMin)
    if (overlapStart < overlapEnd) {
      billableMinutes += overlapEnd - overlapStart
    }
  }

  return billableMinutes / 60
}

function formatHours(hours: number): string {
  return hours % 1 === 0 ? String(hours) : hours.toFixed(1)
}

// Backstage rooms (Stillhet, Støy) are free when bundled with Teglverket.
// The cheapest selected backstage room is skipped; if both are selected,
// only the cheaper one is free.
function roomRentLines(
  rooms: BookingRoom[],
  hoursPerRoom: Map<number, number>,
  labels: PriceSummaryLabels,
): PriceLine[] {
  const selectedIds = new Set(rooms.map(room => room.crescatRoomId))
  const bundledWithTeglverket = selectedIds.has(TEGLVERKET_CRESCAT_ROOM_ID)

  let freeBackstageRoomId: number | null = null
  if (bundledWithTeglverket) {
    const backstageRooms = rooms.filter(
      r =>
        BACKSTAGE_ROOM_IDS.has(r.crescatRoomId) &&
        selectedIds.has(r.crescatRoomId),
    )
    const cheapest = backstageRooms.toSorted(
      (a, b) => (a.pricePerHour ?? 0) - (b.pricePerHour ?? 0),
    )[0]
    if (cheapest) freeBackstageRoomId = cheapest.crescatRoomId
  }

  return rooms
    .filter(room => room.pricePerHour != null && room.pricePerHour > 0)
    .filter(room => room.crescatRoomId !== freeBackstageRoomId)
    .map(room => {
      const hours = hoursPerRoom.get(room.crescatRoomId) ?? 0
      return {
        label: `${room.title ?? labels.room} (${formatHours(hours)} ${labels.hours} × ${room.pricePerHour} kr)`,
        amount: hours > 0 ? (room.pricePerHour ?? 0) * hours : 0,
      }
    })
    .filter(line => line.amount > 0)
}

// Estimated price summary shown in the booking order summary. Room rent only
// applies to external bookers — internal bookers and student organizations
// don't pay room rent, but everyone pays for opt-in services (technicians,
// rigging, bar staffing).
export function computePriceSummary(
  state: BookingFormState,
  rooms: BookingRoom[],
  baseHours: OpeningHours | null = null,
  closedDates: ClosedDate[] = [],
  vacationMode?: VacationMode | null,
  labels: PriceSummaryLabels = DEFAULT_PRICE_SUMMARY_LABELS,
): PriceSummary {
  const hoursPerRoom = new Map<number, number>()
  if (state.startDate && state.startTime && state.endTime) {
    for (const room of rooms) {
      hoursPerRoom.set(
        room.crescatRoomId,
        billableHoursForRoom(
          room,
          state.startDate,
          state.endDate,
          state.startTime,
          state.endTime,
          baseHours,
          closedDates,
          vacationMode,
        ),
      )
    }
  }

  const lines: PriceLine[] = []

  if (state.bookerType === "ekstern") {
    lines.push(...roomRentLines(rooms, hoursPerRoom, labels))
  }

  if (state.soundTech) {
    lines.push({ label: labels.soundTechnician, amount: TECH_PRICE })
  }
  if (state.lightTech) {
    lines.push({ label: labels.lightingTechnician, amount: TECH_PRICE })
  }
  if (state.riggingSetup) {
    lines.push({ label: labels.riggingSetup, amount: RIGGING_PRICE })
  }
  if (state.riggingTeardown) {
    lines.push({ label: labels.riggingTeardown, amount: RIGGING_PRICE })
  }
  if (state.barKvarteret) {
    lines.push({ label: labels.barHouse, amount: BAR_KVARTERET_PRICE })
  }

  const subtotalExVat = lines.reduce((sum, line) => sum + line.amount, 0)
  const vat = Math.round(subtotalExVat * VAT_RATE)
  const totalIncVat = subtotalExVat + vat

  return { lines, subtotalExVat, vat, totalIncVat }
}
