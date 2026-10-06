import {
  type FormState,
  initialState,
} from "@/features/events/domain/formState"
import type { BookingEventPrefill } from "@/lib/integrations/kvarteret-personal/booking-requests"
import type { EventGroup, EventRoom } from "@/lib/sanity/fetch"

export function buildBookingEventDefaults(
  booking: BookingEventPrefill,
  rooms: EventRoom[],
  groups: EventGroup[],
): FormState {
  const organization = booking.student_org_name.trim()
  const group = groups.find(
    group =>
      organization &&
      group.name?.trim().toLocaleLowerCase("nb") ===
        organization.toLocaleLowerCase("nb"),
  )
  const selectedRooms = rooms.filter(
    room =>
      room.crescatRoomId != null &&
      booking.room_ids.includes(room.crescatRoomId),
  )
  const prices = { priceOrdinar: "", priceStudent: "", priceMedlem: "" }
  if (booking.free_or_paid === "Betalt") {
    for (const ticket of booking.ticket_types) {
      const name = ticket.name.trim().toLowerCase()
      if (!/^\d+(?:[.,]\d+)?$/.test(ticket.price.trim())) continue
      const value = ticket.price.trim().replace(",", ".")
      if (/student/.test(name)) prices.priceStudent = value
      else if (/medlem|member/.test(name)) prices.priceMedlem = value
      else if (/ordinær|ordinar|ordinary|regular/.test(name))
        prices.priceOrdinar = value
    }
  }
  return {
    ...initialState,
    title: booking.event_name,
    description: booking.description,
    dates: booking.schedule.length
      ? booking.schedule.map((day, index) => ({
          id: `booking-date-${index}`,
          startDate: day.date,
          startTime: day.doors_open,
          endTime: day.doors_close,
        }))
      : initialState.dates.map(day => ({ ...day })),
    room: selectedRooms.length === 1 ? selectedRooms[0]._id : "",
    roomText:
      selectedRooms.length > 1
        ? selectedRooms.map(room => room.title).join(", ")
        : "",
    organizerGroup: group?._id ?? "",
    organizerText: group ? "" : organization,
    submittedByOrganization: organization,
    submittedBy: booking.contact_name,
    submittedByEmail: booking.contact_email,
    isFree: booking.free_or_paid === "Gratis",
    ...prices,
  }
}
