import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import {
  addDaysDateOnly,
  crescatLocalDateTimeMs,
  toDateTime,
} from "@/lib/integrations/crescat/datetime"

export type ImportOption = {
  _id: string
  name: string
  crescatRoomId?: number | null
}
export type RoomCandidate = {
  roomId: string
  roomName: string
  title: string
  resourceId?: number
  start: string
  end: string
  eventId: number
}

export function overlappingRooms(
  date: string,
  startTime: string,
  endTime: string,
  bookings: CresatBooking[],
  rooms: ImportOption[],
): RoomCandidate[] {
  const start = crescatLocalDateTimeMs(toDateTime(date, startTime))
  const end = crescatLocalDateTimeMs(
    toDateTime(endTime <= startTime ? addDaysDateOnly(date, 1) : date, endTime),
  )
  return bookings.flatMap(booking => {
    const room = rooms.find(room => room.crescatRoomId === booking.resourceId)
    if (!room) return []
    try {
      if (
        crescatLocalDateTimeMs(booking.start) >= end ||
        crescatLocalDateTimeMs(booking.end) <= start
      )
        return []
    } catch {
      return []
    }
    return [
      {
        roomId: room._id,
        roomName: room.name,
        resourceId: booking.resourceId,
        title: booking.title,
        start: booking.start,
        end: booking.end,
        eventId: booking.event_id,
      },
    ]
  })
}

function tokens(text: string): Set<string> {
  if (typeof text !== "string") return new Set()
  return new Set(
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .split(/[^a-z0-9æøå]+/)
      .filter(
        word =>
          word.length > 2 &&
          ![
            "kvarteret",
            "kvarter",
            "asf",
            "konsert",
            "bergen",
            "med",
            "the",
            "support",
          ].includes(word),
      ),
  )
}

export function matchBookingRoom(
  title: string,
  candidates: RoomCandidate[],
): string | null {
  const wanted = tokens(title)
  const ranked = candidates
    .map(candidate => ({
      candidate,
      score: [...tokens(candidate.title)].filter(token => wanted.has(token))
        .length,
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
  if (!ranked.length) return null
  const best = ranked[0]
  const tied = ranked
    .filter(item => item.score === best.score)
    .map(item => item.candidate)
  // Crescat's booking form bundles Støy/Stillhet with Teglverket (see
  // booking/domain/pricing.ts). They are support spaces for this same event,
  // not competing performance venues. Do not collapse different event IDs.
  const teglverket = tied.find(candidate => candidate.resourceId === 97)
  if (
    teglverket &&
    tied.every(
      candidate =>
        candidate.eventId === teglverket.eventId &&
        [97, 117, 118].includes(candidate.resourceId ?? -1),
    )
  )
    return teglverket.roomId
  const tiedRooms = new Set(
    ranked
      .filter(item => item.score === best.score)
      .map(item => item.candidate.roomId),
  )
  return tiedRooms.size === 1 ? best.candidate.roomId : null
}
