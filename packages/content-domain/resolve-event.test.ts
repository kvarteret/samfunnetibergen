import { describe, expect, test } from "vitest"

import {
  INHERITED_FIELDS,
  resolveEffectiveStatus,
  resolveEventContent,
  schemaOrgEventStatus,
} from "./resolve-event"

describe("resolveEventContent", () => {
  const parent = {
    title: "Quiz-kvelden",
    description: [{ _type: "block" }],
    imageUrl: "https://cdn.sanity.io/parent.jpg",
    isFree: true,
    priceStudent: 50,
    ticketUrl: "https://tix.example/parent",
    isInternalEvent: false,
  }

  test("missing child fields fall back to the parent", () => {
    const child = { slug: "quiz-kvelden-2026-08-03", eventStatus: "scheduled" }

    const resolved = resolveEventContent(child, parent)

    expect(resolved.title).toBe("Quiz-kvelden")
    expect(resolved.imageUrl).toBe("https://cdn.sanity.io/parent.jpg")
    expect(resolved.isFree).toBe(true)
    expect(resolved.priceStudent).toBe(50)
    expect(resolved).not.toHaveProperty("seoTitle")
  })

  test("child overrides win over parent values", () => {
    const child = {
      title: "Quiz-kvelden: sesongfinale",
      imageUrl: "https://cdn.sanity.io/finale.jpg",
    }

    const resolved = resolveEventContent(child, parent)

    expect(resolved.title).toBe("Quiz-kvelden: sesongfinale")
    expect(resolved.imageUrl).toBe("https://cdn.sanity.io/finale.jpg")
  })

  test("falsy but defined child values are overrides, null/undefined inherit", () => {
    const child = { isFree: false, priceStudent: null, title: undefined }

    const resolved = resolveEventContent(child, parent)

    expect(resolved.isFree).toBe(false)
    expect(resolved.priceStudent).toBe(50)
    expect(resolved.title).toBe("Quiz-kvelden")
  })

  test("non-inherited fields never leak from the parent", () => {
    const promotedParent = {
      ...parent,
      isPromoted: true,
      eventStatus: "cancelled",
      slug: "quiz-kvelden",
      dates: [{ startDate: "2026-01-01" }],
      room: { title: "Storsalen" },
    }
    const child = { slug: "quiz-kvelden-2026-08-03" }

    const resolved = resolveEventContent(child, promotedParent)

    expect(resolved).not.toHaveProperty("isPromoted")
    expect(resolved).not.toHaveProperty("eventStatus")
    expect(resolved).not.toHaveProperty("dates")
    expect(resolved).not.toHaveProperty("room")
    expect(resolved.slug).toBe("quiz-kvelden-2026-08-03")
  })

  test("child fields outside the inherited set pass through untouched", () => {
    const child = {
      slug: "s",
      eventStatus: "cancelled",
      isPromoted: false,
      room: { title: "Teglverket" },
    }

    const resolved = resolveEventContent(child, parent)

    expect(resolved.eventStatus).toBe("cancelled")
    expect(resolved.isPromoted).toBe(false)
    expect(resolved.room).toEqual({ title: "Teglverket" })
  })

  test("no parent means the child is returned as-is", () => {
    const child = { title: "Enkeltarrangement" }
    expect(resolveEventContent(child, null)).toEqual(child)
    expect(resolveEventContent(child, undefined)).toEqual(child)
  })

  test("every inherited field falls back individually", () => {
    const fullParent = Object.fromEntries(
      INHERITED_FIELDS.map(field => [field, `parent-${field}`]),
    )

    const resolved = resolveEventContent({}, fullParent)

    for (const field of INHERITED_FIELDS) {
      expect(resolved[field]).toBe(`parent-${field}`)
    }
  })
})

describe("resolveEffectiveStatus", () => {
  test("child non-scheduled status always wins", () => {
    expect(resolveEffectiveStatus("cancelled", "scheduled")).toBe("cancelled")
    expect(resolveEffectiveStatus("postponed", "cancelled")).toBe("postponed")
  })

  test("parent non-scheduled status applies to a scheduled child", () => {
    expect(resolveEffectiveStatus("scheduled", "cancelled")).toBe("cancelled")
    expect(resolveEffectiveStatus(null, "postponed")).toBe("postponed")
  })

  test("both scheduled or missing yields scheduled", () => {
    expect(resolveEffectiveStatus("scheduled", "scheduled")).toBe("scheduled")
    expect(resolveEffectiveStatus(null, null)).toBe("scheduled")
    expect(resolveEffectiveStatus(undefined)).toBe("scheduled")
  })
})

describe("schemaOrgEventStatus", () => {
  test("maps every status to its Schema.org URL", () => {
    expect(schemaOrgEventStatus("scheduled")).toBe(
      "https://schema.org/EventScheduled",
    )
    expect(schemaOrgEventStatus("cancelled")).toBe(
      "https://schema.org/EventCancelled",
    )
    expect(schemaOrgEventStatus("postponed")).toBe(
      "https://schema.org/EventPostponed",
    )
  })
})
