import type { BookingRoom } from "../types"
import { durationHoursBetween } from "./availability"
import type { BookingFormState } from "./formState"

const VAT_RATE = 0.25
const TECH_PRICE = 3500
const RIGGING_PRICE = 2000
const BAR_KVARTERET_PRICE = 2000

const TEGLVERKET_CRESCAT_ROOM_ID = 97
const STILLHET_CRESCAT_ROOM_ID = 118

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

function formatHours(hours: number): string {
  return hours % 1 === 0 ? String(hours) : hours.toFixed(1)
}

// Stillhet is bundled free with Teglverket, so its hourly rate is skipped
// whenever both are selected together.
function roomRentLines(rooms: BookingRoom[], hours: number): PriceLine[] {
  if (hours <= 0) return []
  const selectedIds = new Set(rooms.map(room => room.crescatRoomId))
  const bundledWithTeglverket = selectedIds.has(TEGLVERKET_CRESCAT_ROOM_ID)

  return rooms
    .filter(room => room.pricePerHour != null && room.pricePerHour > 0)
    .filter(
      room =>
        !(
          bundledWithTeglverket &&
          room.crescatRoomId === STILLHET_CRESCAT_ROOM_ID
        ),
    )
    .map(room => ({
      label: `${room.title ?? "Rom"} (${formatHours(hours)} t × ${room.pricePerHour} kr)`,
      amount: (room.pricePerHour ?? 0) * hours,
    }))
}

// Estimated price summary shown in the booking order summary. Room rent only
// applies to external bookers — internal bookers and student organizations
// don't pay room rent, but everyone pays for opt-in services (technicians,
// rigging, bar staffing).
export function computePriceSummary(
  state: BookingFormState,
  rooms: BookingRoom[],
): PriceSummary {
  const hours =
    state.startDate && state.startTime && state.endTime
      ? durationHoursBetween(state.startTime, state.endTime)
      : 0

  const lines: PriceLine[] = []

  if (state.bookerType === "ekstern") {
    lines.push(...roomRentLines(rooms, hours))
  }

  if (state.soundTech) lines.push({ label: "Lydtekniker", amount: TECH_PRICE })
  if (state.lightTech) lines.push({ label: "Lystekniker", amount: TECH_PRICE })
  if (state.riggingSetup) {
    lines.push({
      label: "Opprigg og oppsett av møblement",
      amount: RIGGING_PRICE,
    })
  }
  if (state.riggingTeardown) {
    lines.push({ label: "Nedrigg og rydding", amount: RIGGING_PRICE })
  }
  if (state.barKvarteret) {
    lines.push({
      label: "Kvarteret står i bar",
      amount: BAR_KVARTERET_PRICE,
    })
  }

  const subtotalExVat = lines.reduce((sum, line) => sum + line.amount, 0)
  const vat = Math.round(subtotalExVat * VAT_RATE)
  const totalIncVat = subtotalExVat + vat

  return { lines, subtotalExVat, vat, totalIncVat }
}
