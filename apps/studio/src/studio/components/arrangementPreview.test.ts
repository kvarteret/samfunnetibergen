import { describe, expect, it } from "vitest"
import {
  buildArrangementPreview,
  EMPTY_PREVIEW_REFERENCES,
  type PreviewDocument,
  previewDateLabel,
} from "./arrangementPreview"

const localized = (nb: unknown, en: unknown) => [
  { language: "nb", value: nb },
  { language: "en", value: en },
]
const doc: PreviewDocument = {
  localizedTitle: localized("HLNA", "HLNA"),
  localizedDescription: localized(
    [{ children: [{ text: "Norsk beskrivelse" }] }],
    [{ children: [{ text: "English description" }] }],
  ),
  dates: [{ startDate: "2026-10-15", startTime: "20:00", endTime: "02:00" }],
  room: { _ref: "teglverket" },
  isSoldOut: true,
  slug: { current: "hlna" },
  image: { asset: { _ref: "image-test" } },
}
const refs = {
  ...EMPTY_PREVIEW_REFERENCES,
  room: {
    _id: "teglverket",
    localizedTitle: localized("Teglverket", "Teglverket"),
    floor: 1,
  },
}
describe("Studio event review", () => {
  it("requires a resolved room even when the reference exists", () => {
    const p = buildArrangementPreview(doc, EMPTY_PREVIEW_REFERENCES, "nb")
    expect(p.missingRequired.map(c => c.id)).toContain("room")
  })
  it("shows sold out without requiring invented prices", () => {
    const p = buildArrangementPreview(doc, refs, "nb")
    expect(p.pricing).toBe("Utsolgt")
    expect(p.checks.find(c => c.id === "price")?.done).toBe(true)
    expect(p.missingRequired).toEqual([])
  })
  it("flags missing closing time and invalid calendar date", () => {
    const p = buildArrangementPreview(
      { ...doc, dates: [{ startDate: "2026-02-30", startTime: "20:00" }] },
      refs,
      "nb",
    )
    expect(p.missingRequired.map(c => c.id)).toContain("dates")
    expect(p.dateLabels[0]).toContain("Dato mangler")
  })
  it("represents an overnight close and uses requested description locale", () => {
    expect(previewDateLabel((doc.dates ?? [])[0], "nb")).toContain(
      "20:00–02:00 (+1 dag)",
    )
    expect(buildArrangementPreview(doc, refs, "en").description).toBe(
      "English description",
    )
  })
  it("inherits child content and sold-out status but never parent room or dates", () => {
    const p = buildArrangementPreview(
      { eventKind: "festivalSession", slug: { current: "day" } },
      { ...EMPTY_PREVIEW_REFERENCES, parent: doc },
      "nb",
    )
    expect(p.title).toBe("HLNA")
    expect(p.pricing).toBe("Utsolgt")
    expect(p.room).toBe("")
    expect(p.dates).toEqual([])
    expect(p.missingRequired.map(c => c.id)).toEqual(["dates", "room"])
  })
  it("allows a child to explicitly override parent sold-out status", () => {
    const p = buildArrangementPreview(
      { eventKind: "festivalSession", isSoldOut: false, priceOrdinar: 0 },
      { ...EMPTY_PREVIEW_REFERENCES, parent: doc },
      "nb",
    )
    expect(p.pricing).toBe("Ordinær: 0 kr")
    expect(p.status).toBe(null)
  })
  it("checks festival child schedules without inventing a parent room", () => {
    const p = buildArrangementPreview(
      { ...doc, eventKind: "festivalParent" },
      { ...refs, childDates: doc.dates ?? [] },
      "nb",
    )
    expect(p.checks.some(c => c.id === "room")).toBe(false)
    expect(p.missingRequired).toEqual([])
  })
})
