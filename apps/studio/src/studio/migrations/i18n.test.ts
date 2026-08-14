import { describe, expect, it } from "vitest"
import {
  buildI18nPatch,
  findI18nIssues,
  missingCanonicalFields,
  normalizeLocalized,
  translatePortableText,
} from "./i18n"

const translate = async (value: string) => `EN: ${value}`

describe("field-level i18n migration", () => {
  it("seeds nb and en exactly once and is idempotent", async () => {
    const document = {
      _id: "homePage",
      _type: "homePage",
      title: "Velkommen",
      localizedTitle: [
        { _key: "nb-title", language: "nb", value: "Velkommen" },
      ],
    }
    const patch = await buildI18nPatch(document, translate)
    expect(patch.set.localizedTitle).toEqual([
      { _key: "nb-title", language: "nb", value: "Velkommen" },
      { _key: "localizedTitle-en", language: "en", value: "EN: Velkommen" },
    ])
    const second = await buildI18nPatch(
      { ...document, localizedTitle: patch.set.localizedTitle },
      translate,
    )
    expect(second.set.localizedTitle).toBeUndefined()
  })

  it("preserves Portable Text structure while translating spans", async () => {
    const blocks = [
      {
        _key: "block-1",
        _type: "block",
        children: [{ _key: "span-1", _type: "span", text: "Hei", marks: [] }],
        markDefs: [],
      },
    ]
    await expect(translatePortableText(blocks, translate)).resolves.toEqual([
      {
        ...blocks[0],
        children: [{ ...blocks[0].children[0], text: "EN: Hei" }],
      },
    ])
  })

  it("translates inline image alt and caption in Portable Text", async () => {
    const blocks = [
      {
        _key: "image-1",
        _type: "image",
        alt: "Norsk bilde",
        caption: "En norsk bildetekst",
        asset: { _ref: "image-1", _type: "reference" },
      },
    ]
    await expect(translatePortableText(blocks, translate)).resolves.toEqual([
      {
        ...blocks[0],
        alt: "EN: Norsk bilde",
        caption: "EN: En norsk bildetekst",
      },
    ])
  })

  it("reports duplicate and conflicting languages", () => {
    const value = normalizeLocalized(
      [
        { language: "nb", value: "A" },
        { language: "nb", value: "A" },
        { language: "nb", value: "B" },
      ],
      "localizedTitle",
    )
    expect(value.items).toHaveLength(1)
    expect(value.conflicts).toEqual(["localizedTitle.nb"])
    expect(
      findI18nIssues({ _id: "homePage", localizedTitle: value.items }),
    ).toEqual([])
    expect(
      findI18nIssues({
        _id: "homePage",
        title: "Legacy",
        localizedTitle: [
          { language: "nb", value: "A" },
          { language: "nb", value: "B" },
        ],
      }).map(issue => issue.kind),
    ).toEqual(["legacy", "conflict", "duplicate"])
  })

  it("reports missing canonical values by document type", () => {
    expect(
      missingCanonicalFields({
        _id: "roomsPage",
        _type: "roomsPage",
        title: "Rom",
        description: "Velg rom",
      }),
    ).toEqual([
      "localizedTitle.nb",
      "localizedTitle.en",
      "localizedDescription.nb",
      "localizedDescription.en",
    ])
  })
})
