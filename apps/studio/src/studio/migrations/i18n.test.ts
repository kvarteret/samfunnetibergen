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

  it("translates booking FAQ sections and their questions", async () => {
    const patch = await buildI18nPatch(
      {
        _id: "faq-page",
        _type: "page",
        localizedTitle: [{ language: "nb", value: "Spørsmål" }],
        faq: [
          {
            _key: "section-1",
            _type: "faqSection",
            localizedHeading: [{ language: "nb", value: "Betaling" }],
            items: [
              {
                _key: "item-1",
                _type: "faqItem",
                localizedQuestion: [{ language: "nb", value: "Hvordan?" }],
                localizedAnswer: [{ language: "nb", value: "Med faktura." }],
              },
            ],
          },
        ],
      },
      translate,
    )
    expect(patch.set['faq[_key == "section-1"].localizedHeading']).toEqual([
      { language: "nb", value: "Betaling" },
      { _key: "localizedHeading-en", language: "en", value: "EN: Betaling" },
    ])
    expect(
      patch.set[
        'faq[_key == "section-1"].items[_key == "item-1"].localizedAnswer'
      ],
    ).toEqual([
      { language: "nb", value: "Med faktura." },
      {
        _key: "localizedAnswer-en",
        language: "en",
        value: "EN: Med faktura.",
      },
    ])
  })

  it("reports missing booking FAQ headings and answers", () => {
    expect(
      missingCanonicalFields({
        _id: "faq-page",
        _type: "page",
        localizedTitle: [
          { language: "nb", value: "Spørsmål" },
          { language: "en", value: "Questions" },
        ],
        faq: [
          {
            _key: "section-1",
            _type: "faqSection",
            items: [
              {
                _key: "item-1",
                _type: "faqItem",
                localizedQuestion: [
                  { language: "nb", value: "Hvordan?" },
                  { language: "en", value: "How?" },
                ],
              },
            ],
          },
        ],
      }),
    ).toEqual([
      "faq[section-1].localizedHeading.nb",
      "faq[section-1].localizedHeading.en",
      "faq[section-1].items[item-1].localizedAnswer.nb",
      "faq[section-1].items[item-1].localizedAnswer.en",
    ])
  })
})
