import { describe, expect, it } from "vitest"

import { buildStudentGroupSlugPatch } from "./studentGroupSlugs"

describe("student group slug cutover", () => {
  it("rewrites legacy aliases to the canonical name-derived slug", () => {
    expect(
      buildStudentGroupSlugPatch({
        _id: "debatt",
        _type: "studentGroup",
        name: "Debatt",
        slug: { current: "debattkomiteen" },
      }),
    ).toEqual({
      slug: { _type: "slug", current: "debatt" },
    })
  })

  it("is idempotent for canonical slugs", () => {
    expect(
      buildStudentGroupSlugPatch({
        _id: "debatt",
        _type: "studentGroup",
        name: "Debatt",
        slug: { current: "debatt" },
      }),
    ).toEqual({})
  })
})
