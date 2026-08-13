import { describe, expect, it } from "vitest"
import {
  buildGroupLocalePatch,
  findMissingEnglishGroupFields,
  mergeGroupLocalePatches,
} from "./groupLocales"
import { buildInitialEnglishGroupPatch } from "./initialEnglishGroupContent"

describe("group locale migration", () => {
  it("seeds Norwegian fields without replacing existing translations", () => {
    expect(
      buildGroupLocalePatch({
        _id: "group-1",
        _type: "studentGroup",
        name: "Kraft",
        summary: "Norsk sammendrag",
        body: [],
        localizedName: [{ _key: "en", language: "en", value: "Kraft" }],
      }),
    ).toEqual({
      localizedName: [
        { _key: "en", language: "en", value: "Kraft" },
        { _key: "nb-localizedName", language: "nb", value: "Kraft" },
      ],
      localizedSummary: [
        {
          _key: "nb-localizedSummary",
          language: "nb",
          value: "Norsk sammendrag",
        },
      ],
      localizedBody: [{ _key: "nb-localizedBody", language: "nb", value: [] }],
    })
  })

  it("reports missing published English fields", () => {
    expect(
      findMissingEnglishGroupFields({ _id: "group-1", _type: "studentGroup" }),
    ).toEqual(["localizedName.en", "localizedSummary.en", "localizedBody.en"])
  })

  it("adds the authored English content without replacing Norwegian values", () => {
    const patch = buildInitialEnglishGroupPatch({
      _id: "studentGroup-kraftetaten",
      _type: "studentGroup",
      localizedName: [{ _key: "nb", language: "nb", value: "Kraftetaten" }],
      localizedSummary: [
        { _key: "nb", language: "nb", value: "Norsk sammendrag" },
      ],
    })

    expect(patch.localizedName).toEqual([
      { _key: "nb", language: "nb", value: "Kraftetaten" },
      {
        _key: "en-localizedName",
        language: "en",
        value: "Technical Production",
      },
    ])
    expect(patch.localizedSummary).toEqual([
      { _key: "nb", language: "nb", value: "Norsk sammendrag" },
      {
        _key: "en-localizedSummary",
        language: "en",
        value: expect.stringContaining("Technical Production"),
      },
    ])
  })

  it("merges Norwegian and English localized array patches", () => {
    expect(
      mergeGroupLocalePatches(
        {
          localizedName: [{ _key: "nb", language: "nb", value: "Kraftetaten" }],
        },
        {
          localizedName: [
            { _key: "en", language: "en", value: "Technical Production" },
          ],
        },
      ),
    ).toEqual({
      localizedName: [
        { _key: "nb", language: "nb", value: "Kraftetaten" },
        { _key: "en", language: "en", value: "Technical Production" },
      ],
    })
  })
})
