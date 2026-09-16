import { describe, expect, it } from "vitest"

import { studentGroup } from "./studentGroup"

// Schema fields are a union of every field builder used in this studio, and not
// every member declares `hidden`/`readOnly`. These tests only inspect the
// assembled definition, so read it through a loose shape.
type InspectableField = {
  name?: string
  hidden?: (context: never) => unknown
  readOnly?: (context: never) => unknown
}

function inspectableFields(schema: {
  fields?: readonly unknown[]
}): InspectableField[] {
  return (schema.fields ?? []) as unknown as InspectableField[]
}

describe("student group identifier field", () => {
  const slugField = inspectableFields(studentGroup).find(
    field => field.name === "slug",
  )

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
