/** @vitest-environment jsdom */
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import type { ScreenRoomHours } from "../domain/opening-hours"
import {
  PAGE_DURATION_MS,
  REFRESH_INTERVAL_MS,
  type ScreenEvent,
} from "../domain/schedule"
import { InfoScreen } from "./InfoScreen"

const { refresh, router } = vi.hoisted(() => {
  const refresh = vi.fn()
  return { refresh, router: { refresh } }
})
vi.mock("next/navigation", () => ({ useRouter: () => router }))
vi.mock("@/components/navbar/BrandLogo", () => ({
  BrandLogo: () => <span>Kvarteret</span>,
}))

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-10-01T12:00:00Z"))
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  refresh.mockClear()
  container = document.createElement("div")
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function event(id: string): ScreenEvent {
  return {
    id,
    title: `Arrangement ${id}`,
    startTime: "19:00",
    endTime: "21:00",
    startsAt: "2026-10-01T17:00:00Z",
    endsAt: "2026-10-01T19:00:00Z",
    room: "Teglverket",
    floor: 2,
    organizer: null,
    category: "Debatt",
    imageUrl: null,
    cancelled: false,
    isFree: true,
  }
}

async function render(
  events: ScreenEvent[],
  initialNow = new Date().toISOString(),
) {
  await act(async () => {
    root.render(
      <InfoScreen date="2026-10-01" events={events} initialNow={initialNow} />,
    )
  })
}

it("rotates every event onto the display and wraps back to the first page", async () => {
  await render([event("1"), event("2"), event("3"), event("4"), event("5")])
  expect(container.querySelectorAll("li")).toHaveLength(4)
  expect(container.textContent).toContain("2. etasje")
  expect(container.textContent).not.toContain("Arrangement 5")

  await act(async () => vi.advanceTimersByTime(PAGE_DURATION_MS))
  expect(container.querySelectorAll("li")).toHaveLength(1)
  expect(container.textContent).toContain("Arrangement 5")
  expect(container.textContent).toContain("Side 2 av 2")

  await act(async () => vi.advanceTimersByTime(PAGE_DURATION_MS))
  expect(container.textContent).toContain("Arrangement 1")
  expect(container.textContent).toContain("Side 1 av 2")
})

it("adapts sparse daily pages and omits empty pagination", async () => {
  await render([event("1"), event("2")])
  expect(container.querySelector("ol")?.getAttribute("data-count")).toBe("2")
  expect(container.textContent).not.toContain("Side")
  expect(container.querySelector("ol")?.style.gridTemplateRows).toBe(
    "repeat(2, minmax(0, 1fr))",
  )
})

it("links the volunteer QR code to blifrivillig.no with second-floor campaign tracking", async () => {
  await render([])
  const link = container.querySelector(
    'a[aria-label="Bli frivillig – se gruppene"]',
  )
  const url = new URL(link?.getAttribute("href") ?? "")
  expect(url.origin + url.pathname).toBe("https://blifrivillig.no/")
  expect(url.searchParams.get("utm_source")).toBe("infoskjerm")
  expect(url.searchParams.get("utm_medium")).toBe("qr")
  expect(url.searchParams.get("utm_campaign")).toBe("second-floor-infoskjerm")
  expect(link?.querySelector("img")?.getAttribute("src")).toBe(
    "/infoskjerm/volunteer-qr.png",
  )
  expect(container.querySelector("footer")?.textContent).toContain(
    "Bli frivillig!",
  )
})

it("reserves promoted previews and rotates daily pages of three without losing events", async () => {
  await act(async () =>
    root.render(
      <InfoScreen
        date="2026-10-01"
        initialNow={new Date().toISOString()}
        events={[event("1"), event("2"), event("3"), event("4")]}
        message="Spørsmål? Spør driftsleder!"
        promotions={[
          {
            id: "promotion",
            title: "Neste ukes konsert",
            date: "2026-10-08",
            dateLabel: "Torsdag, 20:00",
            room: "Teglverket",
            imageUrl: null,
          },
          {
            id: "promotion-2",
            title: "BIFF",
            date: "2026-10-14",
            dateLabel: "14. oktober 2026",
            room: "Tivoli",
            imageUrl: null,
          },
          {
            id: "promotion-3",
            title: "Taake",
            date: "2026-10-30",
            dateLabel: "30. oktober 2026",
            room: "Tivoli",
            imageUrl: null,
          },
        ]}
      />,
    ),
  )
  expect(container.querySelectorAll("li")).toHaveLength(3)
  expect(
    container.querySelector('section[aria-label="Snart"]')?.textContent,
  ).toContain("Neste ukes konsert")
  expect(
    container.querySelectorAll('section[aria-label="Snart"] article'),
  ).toHaveLength(3)
  expect(
    container.querySelector('section[aria-label="Snart"]')?.textContent,
  ).toContain("Taake")
  expect(container.querySelector("footer")?.textContent).toContain(
    "Spørsmål? Spør driftsleder!",
  )
  await act(async () => vi.advanceTimersByTime(PAGE_DURATION_MS))
  expect(container.querySelectorAll("li")).toHaveLength(1)
  expect(container.textContent).toContain("Arrangement 4")
  expect(container.textContent).toContain("Neste ukes konsert")
})

it("shows MET weather beside the clock and keeps the footer free of the arrow", async () => {
  await act(async () => {
    root.render(
      <InfoScreen
        date="2026-10-01"
        events={[]}
        initialNow={new Date().toISOString()}
        weather={{
          temperature: 15,
          symbol: "rain",
          time: "2026-10-01T12:00:00Z",
        }}
      />,
    )
  })
  expect(container.textContent).toContain("15°")
  expect(container.textContent).toContain("Regn")
  expect(container.querySelector('a[href="https://api.met.no/"]')).toBeNull()
  expect(container.querySelector("header")?.textContent).not.toContain("Bergen")
  expect(container.querySelector("footer svg")).toBeNull()
})

const roomHours: ScreenRoomHours = {
  rooms: [
    {
      title: "Grøndahls",
      slug: "grondahls",
      hours: {
        rows: [
          {
            weekdays: [4],
            status: "open",
            duration: { start: "12:00", end: "01:00" },
          },
        ],
      },
    },
    {
      title: "Stjernesalen",
      slug: "stjernesalen",
      hours: {
        rows: [
          {
            weekdays: [4],
            status: "open",
            duration: { start: "14:00", end: "02:00" },
          },
        ],
      },
    },
  ],
  closedDates: [],
  vacationMode: null,
}

it("shows distinct room hours without a duplicate house status", async () => {
  vi.setSystemTime(new Date("2026-10-01T11:59:59Z"))
  await act(async () =>
    root.render(
      <InfoScreen
        date="2026-10-01"
        events={[]}
        initialNow={new Date().toISOString()}
        roomHours={roomHours}
      />,
    ),
  )
  const hours = container.querySelector('dl[aria-label="Åpningstider i dag"]')
  expect(hours?.textContent).toContain("GrøndahlsStenger 01")
  expect(hours?.textContent).toContain("StjernesalenStengt")
  expect(hours?.querySelectorAll('[data-open="true"]')).toHaveLength(1)
  expect(hours?.querySelectorAll('[aria-label="Åpent"]')).toHaveLength(1)
  expect(hours?.querySelectorAll('[aria-label="Stengt"]')).toHaveLength(1)
  expect(container.textContent).not.toContain("Huset i dag")
  await act(async () => vi.advanceTimersByTime(1_000))
  expect(hours?.textContent).toContain("StjernesalenStenger 02")
  expect(hours?.textContent).not.toContain("Åpner")
  expect(hours?.querySelectorAll('[data-open="true"]')).toHaveLength(2)
  expect(hours?.querySelectorAll('[aria-label="Åpent"]')).toHaveLength(2)
  expect(hours?.querySelectorAll('[aria-label="Stengt"]')).toHaveLength(0)
})

it.each([
  { closedDates: [{ date: "2026-10-01" }], vacationMode: null },
  {
    closedDates: [],
    vacationMode: { enabled: true, from: "2026-10-01", to: "2026-10-03" },
  },
])("respects room closure exceptions: %j", async exceptions => {
  await act(async () =>
    root.render(
      <InfoScreen
        date="2026-10-01"
        events={[]}
        initialNow={new Date().toISOString()}
        roomHours={{ ...roomHours, ...exceptions }}
      />,
    ),
  )
  const hours = container.querySelector('dl[aria-label="Åpningstider i dag"]')
  expect(hours?.textContent).toContain("GrøndahlsStengt")
  expect(hours?.textContent).toContain("StjernesalenStengt")
})

it("refreshes every minute and immediately after Oslo midnight", async () => {
  vi.setSystemTime(new Date("2026-10-01T21:58:59Z"))
  await render([])
  await act(async () => vi.advanceTimersByTime(REFRESH_INTERVAL_MS))
  expect(refresh).toHaveBeenCalledTimes(1)
  await act(async () => vi.advanceTimersByTime(1_000))
  expect(refresh).toHaveBeenCalledTimes(2)
})

it("shows an empty day and clearly marks cancelled events with missing times", async () => {
  await render([])
  expect(container.textContent).toContain(
    "Ingen arrangementer i programmet i dag.",
  )
  await render([
    { ...event("1"), startTime: null, endTime: null, cancelled: true },
  ])
  expect(container.textContent).toContain("Tid kommer")
  expect(container.textContent).toContain("Avlyst")
})

it("cleans up the refresh and rotation timers when the screen closes", async () => {
  await render([event("1"), event("2"), event("3"), event("4"), event("5")])
  await act(async () => root.render(null))
  await act(async () => vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2))
  expect(refresh).not.toHaveBeenCalled()
})

it("greys out an event when its end time passes without removing it", async () => {
  vi.setSystemTime(new Date("2026-10-01T18:59:59Z"))
  await render([event("1")])
  expect(container.querySelector("li")?.getAttribute("data-expired")).toBe(
    "false",
  )
  await act(async () => vi.advanceTimersByTime(1_000))
  expect(container.querySelector("li")?.getAttribute("data-expired")).toBe(
    "true",
  )
  expect(container.textContent).toContain("Avsluttet")
  expect(container.textContent).toContain("Arrangement 1")
})
