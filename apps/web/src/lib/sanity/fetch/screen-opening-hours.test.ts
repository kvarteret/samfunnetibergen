import { expect, it, vi } from "vitest"
import { getScreenRoomHours } from "@/features/infoskjerm/domain/opening-hours"
import { sanityFetch } from "../fetcher"
import { footerQuery } from "../queries"
import { fetchFooter } from "./pages"
import { encodeStegaForTest as encoded } from "./test-stega"

vi.mock("../fetcher", () => ({ sanityFetch: vi.fn() }))
vi.mock("../client", () => ({ sanityClient: {} }))

it("uses fetched room schedules and house exceptions for screen status and next opening", async () => {
  const hours = (weekdays: number[], start: string, end: string) => ({
    rows: [
      {
        weekdays,
        status: encoded("open"),
        duration: { start: encoded(start), end: encoded(end) },
      },
    ],
  })
  const data = {
    socialLinks: [],
    visitAddress: null,
    generalContact: null,
    // The house is open all weekend; Stjernesalen has its own weekday schedule.
    openingHours: hours([1, 2, 3, 4, 5, 6, 7], "10:00", "23:00"),
    roomHours: [
      {
        title: "Grøndahls",
        slug: "grondahls",
        hours: hours([5, 6], "18:00", "01:00"),
      },
      {
        title: "Stjernesalen",
        slug: "stjernesalen",
        hours: hours([1, 2, 3, 4, 5], "12:00", "18:00"),
      },
    ],
    houseClosedDates: [{ date: "2026-10-05" }],
    vacationMode: { enabled: false, from: null, to: null },
  }
  vi.mocked(sanityFetch).mockResolvedValue({ data } as never)
  const footer = await fetchFooter("nb")
  expect(sanityFetch).toHaveBeenCalledWith({
    query: footerQuery,
    params: { locale: "nb" },
  })
  if (!footer) throw new Error("Missing footer data")
  const screenHours = {
    rooms: footer.roomHours,
    closedDates: footer.houseClosedDates,
    vacationMode: footer.vacationMode,
  }
  expect(
    getScreenRoomHours(screenHours, new Date("2026-10-02T18:00:00Z")),
  ).toMatchObject([
    { slug: "grondahls", isOpen: true, label: "Åpent. Stenger 01" },
    { slug: "stjernesalen", isOpen: false, label: "Stengt. Åpner tirsdag 12" },
  ])
  expect(
    getScreenRoomHours(
      { ...screenHours, closedDates: [] },
      new Date("2026-10-02T18:00:00Z"),
    )[1],
  ).toMatchObject({
    isOpen: false,
    label: "Stengt. Åpner mandag 12",
  })
  expect(
    getScreenRoomHours(
      {
        ...screenHours,
        vacationMode: { enabled: true, from: "2026-10-02", to: "2026-10-07" },
      },
      new Date("2026-10-02T18:00:00Z"),
    ),
  ).toMatchObject([
    { isOpen: false, label: "Stengt. Åpner fredag 18" },
    { isOpen: false, label: "Stengt. Åpner onsdag 12" },
  ])
})
