import { describe, expect, it } from "vitest"

import { arrangement } from "./arrangement"
import { eventTaxonomyGroup } from "./eventTaxonomyGroup"
import { eventType } from "./eventType"

function fieldNames(schema: { fields?: Array<{ name: string }> }) {
  return (schema.fields ?? []).map(field => field.name)
}

// Schema fields are a union of every field builder used in this studio, and not
// every member declares `hidden`/`readOnly`/`initialValue`. These tests only
// inspect the assembled definitions, so read them through a loose shape.
type InspectableField = {
  name?: string
  title?: unknown
  description?: unknown
  hidden?: (context: never) => unknown
  readOnly?: (context: never) => unknown
  initialValue?: unknown
}

function inspectableFields(schema: {
  fields?: readonly unknown[]
}): InspectableField[] {
  return (schema.fields ?? []) as unknown as InspectableField[]
}

describe("editorial arrangement schema", () => {
  it("opens with every field visible in the Alle group", () => {
    expect(arrangement.groups?.[0]).toMatchObject({
      name: "all-fields",
      title: "Alle",
      default: true,
    })
  })

  it("hides storage-only fields and removes retired fields", () => {
    const fields = inspectableFields(arrangement)
    expect(fields.find(field => field.name === "eventKind")?.hidden).toBe(true)
    expect(fields.find(field => field.name === "parentEvent")?.hidden).toBe(
      true,
    )
    expect(fields.find(field => field.name === "rrule")?.hidden).toBe(true)
    expect(fields.find(field => field.name === "approvalStatus")?.hidden).toBe(
      true,
    )
    expect(fields.find(field => field.name === "eventStatus")?.hidden).toBe(
      true,
    )
    expect(fieldNames(arrangement)).not.toContain("adminNote")
  })

  it("keeps festival image inheritance explicit", () => {
    const field = inspectableFields(arrangement).find(
      field => field.name === "useFestivalImage",
    )
    expect(field?.title).toBe("Bruk festivalbildet")
    expect(field?.initialValue).toBe(true)
  })

  it("shows the festival-day shortcut only on festival parents", () => {
    const field = inspectableFields(arrangement).find(
      field => field.name === "festivalDayShortcut",
    )
    expect(field?.title).toBe("Festivaldager")
    expect(
      typeof field?.hidden === "function" &&
        field.hidden({ document: { eventKind: "festivalParent" } } as never),
    ).toBe(false)
    expect(
      typeof field?.hidden === "function" &&
        field.hidden({ document: { eventKind: "single" } } as never),
    ).toBe(true)
  })

  it("stores the editorial homepage order in the standard rank field", () => {
    expect(fieldNames(arrangement)).toContain("orderRank")
    expect(arrangement.orderings?.[0]?.name).toBe("ordered")
  })

  it("explains the seed date and program-period generation", () => {
    const dates = inspectableFields(arrangement).find(
      field => field.name === "dates",
    )
    expect(dates?.description).toContain("seriens første dag")
    expect(dates?.description).toContain("Datoen forankrer mønsteret")
    expect(dates?.description).toContain(
      "Programperioden velges når dagene opprettes",
    )
  })

  it("keeps only canonical localized taxonomy names", () => {
    expect(fieldNames(eventTaxonomyGroup)).toEqual([
      "localizedName",
      "orderRank",
    ])
    expect(fieldNames(eventType)).toEqual([
      "localizedName",
      "taxonomyGroup",
      "isActive",
      "orderRank",
    ])
  })

  it("does not expose technical storage words in field copy", () => {
    const copy = inspectableFields(arrangement)
      .flatMap(field => [
        typeof field.title === "string" ? field.title : "",
        typeof field.description === "string" ? field.description : "",
      ])
      .join(" ")
      .toLocaleLowerCase("nb")
    for (const word of [
      "instans",
      "forelder",
      "slug",
      "rrule",
      "materialisert",
    ]) {
      expect(copy).not.toContain(word)
    }
  })
})
