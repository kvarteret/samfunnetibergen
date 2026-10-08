import { NextIntlClientProvider } from "next-intl"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, test, vi } from "vitest"
import en from "@/messages/en.json"
import nb from "@/messages/nb.json"
import { EventCard, type EventSummary } from "./EventCard"

vi.mock("@/i18n/navigation", () => ({
  Link: (props: Record<string, unknown>) => createElement("a", props),
}))

const event: EventSummary = {
  _id: "one",
  title: "Concert",
  slug: "concert",
  dates: [],
  room: { _id: "room", title: "Tivoli", slug: "tivoli", floor: 1 },
}

function render(locale: "en" | "nb", overrides: Partial<EventSummary>) {
  return renderToStaticMarkup(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "en" ? en : nb}
    >
      <EventCard event={{ ...event, ...overrides }} />
    </NextIntlClientProvider>,
  )
}

describe("event card translations", () => {
  test("translates the floor and sold-out status", () => {
    const html = render("en", { isSoldOut: true })
    expect(html).toContain("Floor 1")
    expect(html).toContain("Sold out")
    expect(html).not.toContain("Cancelled")
    expect(render("nb", { isSoldOut: true })).toContain("1. etasje")
  })
  test("shows cancellation before the sold-out status", () => {
    const html = render("en", { eventStatus: "cancelled", isSoldOut: true })
    expect(html).toContain("Cancelled")
    expect(html).not.toContain("Sold out")
    expect(render("nb", { eventStatus: "cancelled" })).toContain("Kansellert")
  })
})
