import { describe, expect, it } from "vitest"

import { createSeoFields, createSharingFields } from "./metadataFields"

describe("metadata field factories", () => {
  it("preserves the flat SEO field contract", () => {
    const fields = createSeoFields({ group: "sharing" })

    expect(fields.map(field => field.name)).toEqual([
      "seoTitle",
      "seoDescription",
      "canonicalUrl",
      "noIndex",
      "noFollow",
    ])
    expect(fields.every(field => field.group === "sharing")).toBe(true)
  })

  it("preserves sharing fields and only adds an image description when set", () => {
    const fields = createSharingFields()
    const describedFields = createSharingFields({
      openGraphImageDescription: "Use the main image by default.",
    })

    expect(fields.map(field => field.name)).toEqual([
      "openGraphImage",
      "openGraphImageAlt",
      "openGraphTitle",
      "openGraphDescription",
    ])
    expect(fields[0]).not.toHaveProperty("description")
    expect(describedFields[0]).toHaveProperty(
      "description",
      "Use the main image by default.",
    )
  })
})
