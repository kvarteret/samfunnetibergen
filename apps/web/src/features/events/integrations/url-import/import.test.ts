import type { SanityClient } from "@sanity/client"
import { describe, expect, test, vi } from "vitest"
import type { Extraction } from "../ticketco/luna"
import { importEventFromUrl } from "./import"
import { assertPublicUrl } from "./public-fetch"

const url = "https://www.example.org/events/quiz"
const extraction: Extraction = {
  title: "Quiz",
  titleEnglish: "Quiz",
  description: "Allmennquiz.",
  descriptionEnglish: "General quiz.",
  startDate: "2099-10-16",
  startTime: "19:00",
  endTime: "23:00",
  room: "",
  roomText: "",
  roomTextEnglish: "",
  organizerGroup: "asf",
  organizerText: "",
  organizerTextEnglish: "",
  submittedByOrganization: "",
  eventTypeId: "quiz",
  isFree: true,
  isSoldOut: false,
  priceOrdinar: "",
  priceStudent: "",
  priceMedlem: "",
  facebookUrl: "",
  evidence: "",
}
const deps = () => ({
  fetchPage: vi.fn(
    async () => '<head><meta property="og:image" content="/q.png"></head>',
  ),
  extract: vi.fn(async () => ({ ...extraction })),
  calendar: vi.fn(async () => [
    {
      id: 1,
      resourceId: 97,
      event_id: 1,
      start: "2099-10-16 18:00:00",
      end: "2099-10-16 23:30:00",
      color: "",
      title: "",
      part_of_event: true,
    },
  ]),
  taxonomy: vi.fn(async () => ({
    rooms: [{ _id: "tegl", name: "Teglverket", crescatRoomId: 97 }],
    groups: [{ _id: "asf", name: "ASF" }],
    eventTypes: [{ _id: "quiz", name: "Quiz" }],
  })),
  image: vi.fn(async (): Promise<string | undefined> => "image-a-1x1-png"),
})
const client = {} as SanityClient

describe("importEventFromUrl", () => {
  test("fills fields from the page and the only room booked in Crescat", async () => {
    const d = deps()
    const result = await importEventFromUrl(client, url, d)
    expect(result.missing).toEqual([])
    expect(result.fields).toMatchObject({
      room: { _ref: "tegl" },
      organizerGroup: { _ref: "asf" },
      eventType: { _ref: "quiz" },
      isFree: true,
      image: { asset: { _ref: "image-a-1x1-png" } },
      dates: [{ startDate: "2099-10-16", startTime: "19:00" }],
    })
    expect(d.image).toHaveBeenCalledWith(
      client,
      "https://www.example.org/q.png",
    )
    expect(JSON.stringify(result)).not.toContain("part_of_event")
  })

  test("returns partial fields and lists what is missing", async () => {
    const d = deps()
    d.extract.mockResolvedValue({
      ...extraction,
      endTime: "",
      eventTypeId: "invented",
      isFree: false,
    })
    d.image.mockRejectedValue(new Error("unreachable"))
    const result = await importEventFromUrl(client, url, d)
    expect(result.fields).not.toHaveProperty("dates")
    expect(result.fields).not.toHaveProperty("eventType")
    expect(result.fields.ticketUrl).toBe(url)
    expect(result.missing).toEqual(
      expect.arrayContaining([
        "Velg arrangementstype.",
        "Last opp et bilde.",
        "Oppgi minst én pris, eller merk arrangementet som gratis.",
      ]),
    )
  })
})

describe("assertPublicUrl", () => {
  const publicHost = async () => [{ address: "93.184.215.14", family: 4 }]
  test.each([
    "ftp://example.org/x",
    "https://127.0.0.1/",
    "https://localhost/",
    "https://example.org:8080/",
  ])("rejects %s", async value => {
    await expect(assertPublicUrl(value, publicHost)).rejects.toThrow()
  })
  test.each([
    ["10.0.0.5", 4],
    ["169.254.169.254", 4],
    ["fd00::1", 6],
    ["::ffff:127.0.0.1", 6],
  ])("rejects hosts resolving to %s", async (address, family) => {
    await expect(
      assertPublicUrl("https://evil.example.org/", async () => [
        { address, family },
      ]),
    ).rejects.toThrow()
  })
  test("accepts public hosts", async () => {
    await expect(assertPublicUrl(url, publicHost)).resolves.toBeInstanceOf(URL)
  })
})
