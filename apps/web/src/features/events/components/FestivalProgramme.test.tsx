import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { resolvePublicEvent } from "../domain/events"
import {
  festivalDate,
  groupFestivalProgramme,
} from "../domain/festival-programme"
import {
  FestivalHero,
  type FestivalLabels,
  FestivalProgramme,
} from "./FestivalProgramme"

vi.mock("next/image", () => ({
  default: ({
    fill: _fill,
    preload: _preload,
    unoptimized: _direct,
    ...props
  }: Record<string, unknown>) => createElement("img", props),
}))
vi.mock("@/i18n/navigation", () => ({
  Link: (props: Record<string, unknown>) => createElement("a", props),
}))
vi.mock("@/app/[locale]/arrangementer/[event]/EventTrackedLinks", () => ({
  EventTicketButton: ({
    ticketUrl,
    label,
  }: {
    ticketUrl: string
    label: string
  }) => createElement("a", { href: ticketUrl }, label),
}))

const labels: FestivalLabels = {
  programme: "Programme",
  browseDays: "Choose a day",
  events: "events",
  days: "days",
  about: "About",
  details: "Read more",
  tickets: "Buy tickets",
  soldOut: "Sold out",
  cancelled: "Cancelled",
  timeUnknown: "Time to be announced",
  empty: "Coming soon",
}
const event = (
  id: string,
  dates: { startDate: string; startTime?: string }[],
  status: "scheduled" | "cancelled" = "scheduled",
) =>
  resolvePublicEvent({
    _id: id,
    title: id,
    slug: id,
    eventKind: "festivalSession",
    eventStatus: status,
    ticketUrl: `https://tickets.test/${id}`,
    imageUrl: "https://cdn.sanity.io/images/project/production/film.jpg",
    roomText: "Tivoli",
    dates: dates.map((d, i) => ({ ...d, _key: String(i) })),
  })

describe("festival programme", () => {
  it("orders days and times, retaining repeat screenings and cancellations", () => {
    const days = groupFestivalProgramme([
      event("repeat", [
        { startDate: "2026-10-16", startTime: "20:00" },
        { startDate: "2026-10-15", startTime: "18:00" },
      ]),
      event(
        "earlier",
        [{ startDate: "2026-10-15", startTime: "12:30" }],
        "cancelled",
      ),
      event("unknown", [{ startDate: "2026-10-15" }]),
    ])
    expect(days.map(day => day.date)).toEqual(["2026-10-15", "2026-10-16"])
    expect(days[0].occurrences.map(o => o.event._id)).toEqual([
      "earlier",
      "repeat",
      "unknown",
    ])
    const html = renderToStaticMarkup(
      <FestivalProgramme days={days} locale="en" labels={labels} />,
    )
    expect(html).toContain('href="#festival-day-2026-10-15"')
    expect(html.match(/href="\/arrangementer\/repeat"/g)).toHaveLength(2)
    expect(html).not.toContain('href="https://tickets.test/earlier"')
    expect(html).toContain("Thursday 15 October")
    expect(html).toContain("Friday 16 October")
    expect(html).toContain("Cancelled")
    expect(html).toContain("Time to be announced")
  })

  it("preserves festival artwork and shows the actual programme range", () => {
    const children = [
      event("first", [{ startDate: "2026-10-15", startTime: "12:30" }]),
      event("last", [{ startDate: "2026-10-22", startTime: "21:00" }]),
    ]
    const parent = {
      ...children[0],
      title: "BIFF",
      eventKind: "festivalParent" as const,
    }
    const html = renderToStaticMarkup(
      <FestivalHero
        event={parent}
        days={groupFestivalProgramme(children)}
        locale="en"
        labels={labels}
      />,
    )
    expect(html).toContain("object-contain")
    expect(html).toContain("15 Oct – 22 Oct")
    expect(html).toContain("2 events · 2 days")
    expect(html).toContain("Tivoli")
    expect(html).toContain('href="#festival-programme"')
  })

  it("shows sold-out state without a purchase button and handles an empty programme", () => {
    const soldOut = {
      ...event("sold-out", [{ startDate: "2026-10-15", startTime: "20:00" }]),
      isSoldOut: true,
    }
    const html = renderToStaticMarkup(
      <FestivalProgramme
        days={groupFestivalProgramme([soldOut])}
        locale="nb"
        labels={labels}
      />,
    )
    expect(html).toContain("Sold out")
    expect(html).not.toContain("Buy tickets")
    expect(
      renderToStaticMarkup(
        <FestivalProgramme days={[]} locale="nb" labels={labels} />,
      ),
    ).toContain("Coming soon")
    expect(festivalDate("2026-10-15", "nb", true)).toBe("torsdag 15. oktober")
  })
})
