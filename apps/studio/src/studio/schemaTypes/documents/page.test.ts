import { describe, expect, it } from "vitest"

import { page } from "./page"

type PagePreviewInput = {
  title?: unknown
  legacyTitle?: unknown
  slug?: string
}

function preparePagePreview(input: PagePreviewInput) {
  const prepare = page.preview?.prepare as unknown as (
    value: PagePreviewInput,
  ) => { title?: string; subtitle?: string }
  return prepare(input)
}

describe("custom page preview", () => {
  it("falls back to the published legacy title for incomplete drafts", () => {
    expect(
      preparePagePreview({
        title: [{ language: "nb" }],
        legacyTitle: "Catering på Kvarteret",
        slug: "catering",
      }),
    ).toEqual({
      title: "Catering på Kvarteret",
      subtitle: "/catering",
    })
  })

  it("uses the slug instead of a generic label when no title exists", () => {
    expect(
      preparePagePreview({
        title: [{ language: "nb" }],
        slug: "silent-disco",
      }).title,
    ).toBe("Silent disco")
  })
})
