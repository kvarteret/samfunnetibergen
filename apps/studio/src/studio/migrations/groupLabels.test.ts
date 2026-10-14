import { describe, expect, it } from "vitest"
import { buildGroupLabelsPatch, GROUP_LABEL_ITEM_TYPE } from "./groupLabels"

describe("group label repair", () => {
  it("restores empty translation items from legacy labels and is repeatable", () => {
    const document = {
      labels: ["Bar"],
      localizedLabels: [
        { _key: "original-nb", language: "nb" },
        { _key: "original-en", language: "en" },
      ],
    }
    const patch = buildGroupLabelsPatch(document)
    expect(patch.localizedLabels).toEqual([
      {
        _key: "original-nb",
        language: "nb",
        _type: GROUP_LABEL_ITEM_TYPE,
        value: "Bar",
      },
      {
        _key: "original-en",
        language: "en",
        _type: GROUP_LABEL_ITEM_TYPE,
        value: "Bar",
      },
    ])
    expect(buildGroupLabelsPatch({ ...document, ...patch })).toEqual({})
  })

  it.each(["e-tjenesten", "foto", "grafisk", "some"])(
    "fills missing operating tags for %s in both languages",
    slug => {
      const patch = buildGroupLabelsPatch({ slug: { current: slug } })
      expect(patch.localizedLabels?.map(item => item.value)).toEqual([
        "Drift",
        "Operation",
      ])
    },
  )

  it("normalizes migrated list values while retaining existing translations and keys", () => {
    const patch = buildGroupLabelsPatch({
      localizedLabels: [
        { _key: "nb", language: "nb", value: ["Kultur", "Kunnskap"] },
        { _key: "en", language: "en", value: "Arts\nKnowledge" },
      ],
    })
    expect(patch.localizedLabels?.map(item => [item._key, item.value])).toEqual(
      [
        ["nb", "Kultur\nKunnskap"],
        ["en", "Arts\nKnowledge"],
      ],
    )
  })

  it("refuses to invent tags for an unknown group or discard duplicate translations", () => {
    expect(() =>
      buildGroupLabelsPatch({ slug: { current: "unknown" } }),
    ).toThrow("Cannot infer")
    expect(() =>
      buildGroupLabelsPatch({
        localizedLabels: [
          { language: "nb", value: "Bar" },
          { language: "nb", value: "Kultur" },
        ],
      }),
    ).toThrow("Duplicate")
  })
})
