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

it("shows the active overnight closing time, then the next opening time", () => {
  expect(getScreenRoomHours(hours, new Date("2026-10-01T22:30:00Z"))).toEqual([
    {
      title: "Grøndahls",
      slug: "grondahls",
      isOpen: true,
      label: "Åpent. Stenger 01",
    },
  ])
  expect(
    getScreenRoomHours(hours, new Date("2026-10-01T23:00:00Z"))[0],
  ).toMatchObject({
    isOpen: false,
    label: "Stengt. Åpner 12",
  })
})

it("switches from the closing time to the next opening after closure", () => {
  expect(
    getScreenRoomHours(hours, new Date("2026-10-01T10:00:00Z"))[0],
  ).toMatchObject({
    isOpen: true,
    label: "Åpent. Stenger 01",
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
    label: "Stengt. Åpner torsdag 12",
  })
})

it.each([
  { closedDates: [{ date: "2026-10-01" }], label: "Stengt. Åpner i morgen 12" },
  {
    vacationMode: { enabled: true, from: "2026-10-01", to: "2026-10-03" },
    label: "Stengt. Åpner torsdag 12",
  },
])("honors closure exceptions: %j", exceptions => {
  expect(
    getScreenRoomHours(
      { ...hours, ...exceptions },
      new Date("2026-10-01T12:00:00Z"),
    )[0],
  ).toMatchObject({ isOpen: false, label: exceptions.label })
})

it("shows only Stengt when no future opening is scheduled", () => {
  expect(
    getScreenRoomHours(
      { rooms: [{ ...hours.rooms[0], hours: null }] },
      new Date("2026-10-01T12:00:00Z"),
    )[0],
  ).toMatchObject({ isOpen: false, label: "Stengt" })
})

const stjernesalen: ScreenRoomHours = {
  rooms: [
    {
      title: "Stjernesalen",
      slug: "stjernesalen",
      hours: {
        rows: [
          {
            weekdays: [1, 2, 3, 4, 5],
            status: "open",
            duration: { start: "12:00", end: "18:00" },
          },
        ],
      },
    },
  ],
}

it.each([
  ["2026-10-02T08:00:00Z", "Stengt. Åpner 12"],
  ["2026-10-01T16:00:00Z", "Stengt. Åpner i morgen 12"],
  ["2026-10-02T16:00:00Z", "Stengt. Åpner mandag 12"],
  ["2026-10-04T16:00:00Z", "Stengt. Åpner i morgen 12"],
  ["2026-10-04T22:00:00Z", "Stengt. Åpner 12"],
  ["2026-10-24T16:00:00Z", "Stengt. Åpner mandag 12"],
])(
  "labels the next opening relative to the Oslo calendar: %s",
  (now, label) => {
    expect(getScreenRoomHours(stjernesalen, new Date(now))[0]).toMatchObject({
      isOpen: false,
      label,
    })
  },
)
