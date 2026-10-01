import { expect, it } from "vitest"
import { getScreenRoomHours, type ScreenRoomHours } from "./opening-hours"

const hours: ScreenRoomHours = {
  rooms: [
    {
      title: "Grøndahls",
      slug: "grondahls",
      hours: {
        rows: [
          {
            weekdays: [4, 5],
            status: "open",
            duration: { start: "12:00", end: "01:00" },
          },
        ],
      },
    },
  ],
}

it("keeps the active overnight closing time alongside today's future opening", () => {
  expect(getScreenRoomHours(hours, new Date("2026-10-01T22:30:00Z"))).toEqual([
    {
      title: "Grøndahls",
      slug: "grondahls",
      isOpen: true,
      label: "Stenger 01, Åpner 12 · Stenger 01",
    },
  ])
  expect(
    getScreenRoomHours(hours, new Date("2026-10-01T23:00:00Z"))[0],
  ).toMatchObject({
    isOpen: false,
    label: "Åpner 12 · Stenger 01",
  })
})

it("omits an opening time once reached and retains closing time after closure", () => {
  expect(
    getScreenRoomHours(hours, new Date("2026-10-01T10:00:00Z"))[0],
  ).toMatchObject({
    isOpen: true,
    label: "Stenger 01",
  })
  const daytime: ScreenRoomHours = {
    rooms: [
      {
        ...hours.rooms[0],
        hours: {
          rows: [
            {
              weekdays: [4],
              status: "open",
              duration: { start: "12:00", end: "18:00" },
            },
          ],
        },
      },
    ],
  }
  expect(
    getScreenRoomHours(daytime, new Date("2026-10-01T16:00:00Z"))[0],
  ).toMatchObject({
    isOpen: false,
    label: "Stenger 18",
  })
})

it.each([
  { closedDates: [{ date: "2026-10-01" }] },
  { vacationMode: { enabled: true, from: "2026-10-01", to: "2026-10-03" } },
])("honors closure exceptions: %j", exceptions => {
  expect(
    getScreenRoomHours(
      { ...hours, ...exceptions },
      new Date("2026-10-01T12:00:00Z"),
    )[0],
  ).toMatchObject({ isOpen: false, label: "Stengt" })
})
