import { expect, test } from "vitest"
import { buildBookingEventDefaults } from "./event-prefill"

test("maps stored multi-day booking, taxonomy and prices without inventing translations", () => {
  const result = buildBookingEventDefaults(
    {
      event_name: "Konsert",
      description: "Beskrivelse",
      contact_name: "Kari",
      contact_email: "kari@example.com",
      room_ids: [97],
      student_org_name: "Studentgruppe",
      free_or_paid: "Betalt",
      schedule: [
        { date: "2026-10-15", doors_open: "20:00", doors_close: "02:00" },
        { date: "2026-10-16", doors_open: "21:00", doors_close: "01:00" },
      ],
      ticket_types: [
        { name: "Ordinær", price: "200" },
        { name: "Student", price: "150" },
        { name: "Medlem", price: "100" },
      ],
    },
    [{ _id: "room", title: "Tivoli", slug: "tivoli", crescatRoomId: 97 }],
    [{ _id: "group", name: "Studentgruppe" } as never],
  )
  expect(result).toMatchObject({
    title: "Konsert",
    description: "Beskrivelse",
    room: "room",
    organizerGroup: "group",
    submittedBy: "Kari",
    submittedByEmail: "kari@example.com",
    isFree: false,
    priceOrdinar: "200",
    priceStudent: "150",
    priceMedlem: "100",
    titleEnglish: "",
    descriptionEnglish: "",
  })
  expect(result.dates).toHaveLength(2)
  expect(result.dates[0]).toMatchObject({
    startDate: "2026-10-15",
    startTime: "20:00",
    endTime: "02:00",
  })
})
