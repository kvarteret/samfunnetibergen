import { describe, expect, it } from "vitest"

import { studentGroup } from "./studentGroup"

describe("student group identifier field", () => {
  const slugField = studentGroup.fields?.find(field => field.name === "slug")

  it("is available while creating a group without an identifier", () => {
    expect(
      typeof slugField?.hidden === "function" &&
        slugField.hidden({ document: { name: "Ny gruppe" } } as never),
    ).toBe(false)
    expect(
      typeof slugField?.readOnly === "function" &&
        slugField.readOnly({ document: { name: "Ny gruppe" } } as never),
    ).toBe(false)
  })

  it("is hidden and read-only after an identifier exists", () => {
    const context = {
      document: {
        name: "Debatt",
        slug: { _type: "slug", current: "debatt" },
      },
    } as never

    expect(
      typeof slugField?.hidden === "function" && slugField.hidden(context),
    ).toBe(true)
    expect(
      typeof slugField?.readOnly === "function" && slugField.readOnly(context),
    ).toBe(true)
  })
})
