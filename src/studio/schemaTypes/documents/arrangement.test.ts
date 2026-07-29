import { describe, expect, it } from "vitest"

import { arrangement } from "./arrangement"
import { eventTaxonomyGroup } from "./eventTaxonomyGroup"
import { eventType } from "./eventType"

function fieldNames(schema: { fields?: Array<{ name: string }> }) {
  return (schema.fields ?? []).map(field => field.name)
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
    const fields = arrangement.fields ?? []
    expect(fields.find(field => field.name === "eventKind")?.hidden).toBe(true)
    expect(fields.find(field => field.name === "parentEvent")?.hidden).toBe(
      true,
    )
    expect(fields.find(field => field.name === "rrule")?.hidden).toBe(true)
    expect(fields.find(field => field.name === "approvalStatus")?.hidden).toBe(
      true,
    )
    expect(fieldNames(arrangement)).not.toContain("adminNote")
  })

  it("keeps festival image inheritance explicit", () => {
    const field = arrangement.fields?.find(
      candidate => candidate.name === "useFestivalImage",
    )
    expect(field?.title).toBe("Bruk festivalbildet")
    expect(field?.initialValue).toBe(true)
  })

  it("shows the festival-day shortcut only on festival parents", () => {
    const field = arrangement.fields?.find(
      candidate => candidate.name === "festivalDayShortcut",
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
    const dates = arrangement.fields?.find(field => field.name === "dates")
    expect(dates?.description).toContain("seriens første dag")
    expect(dates?.description).toContain("Datoen forankrer mønsteret")
    expect(dates?.description).toContain(
      "Programperioden velges når dagene opprettes",
    )
  })

  it("removes retired category and event type fields", () => {
    expect(fieldNames(eventTaxonomyGroup)).toEqual(["name", "orderRank"])
    expect(fieldNames(eventType)).toEqual([
      "name",
      "taxonomyGroup",
      "isActive",
      "orderRank",
    ])
  })

  it("does not expose technical storage words in field copy", () => {
    const copy = (arrangement.fields ?? [])
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
