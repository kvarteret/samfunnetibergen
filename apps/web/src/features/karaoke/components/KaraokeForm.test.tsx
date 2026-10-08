import { NextIntlClientProvider } from "next-intl"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, test, vi } from "vitest"
import en from "@/messages/en.json"
import nb from "@/messages/nb.json"
import { KaraokeForm } from "./KaraokeForm"

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  Link: (props: Record<string, unknown>) => createElement("a", props),
}))
vi.mock("../actions/karaoke-availability", () => ({
  fetchKaraokeAvailability: vi.fn(async () => []),
}))
vi.mock("../actions/submit-karaoke-booking", () => ({
  submitKaraokeBooking: vi.fn(),
}))

function render(locale: "en" | "nb") {
  return renderToStaticMarkup(
    <NextIntlClientProvider
      timeZone="Europe/Oslo"
      locale={locale}
      messages={locale === "en" ? en : nb}
    >
      <KaraokeForm
        room={{
          slug: "maos",
          title: "Maos Lille Røde",
          summary: null,
          capacityStanding: null,
          capacitySeated: null,
          images: [],
        }}
        initialNow="2026-10-08T12:00:00Z"
      />
    </NextIntlClientProvider>,
  )
}

describe("karaoke form language", () => {
  test("renders the whole booking form in English", () => {
    const html = render("en")
    for (const label of [
      "Details",
      "Event name",
      "Karaoke package",
      "Regular",
      "Volunteer",
      "Contact details",
      "Terms",
      "Booking summary",
      "Send booking request",
      "Norway",
    ])
      expect(html).toContain(label)
    expect(html).not.toContain("Opplysninger")
    expect(html).not.toContain("Norge")
  })
  test("keeps Norwegian labels on the Norwegian page", () => {
    const html = render("nb")
    expect(html).toContain("Kontaktinfo")
    expect(html).toContain("Norge")
  })
})
