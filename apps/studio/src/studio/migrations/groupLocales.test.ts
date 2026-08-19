import { describe, expect, it } from "vitest"
import {
  buildGroupLocalePatch,
  findMissingEnglishGroupFields,
  mergeGroupLocalePatches,
} from "./groupLocales"

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

  it("repairs a locale entry that exists without a value", () => {
    expect(
      buildGroupLocalePatch({
        _id: "group-1",
        _type: "studentGroup",
        name: "Kraftetaten",
        localizedName: [
          { _key: "nb-existing", language: "nb", value: null as never },
        ],
      }),
    ).toEqual({
      localizedName: [
        { _key: "nb-existing", language: "nb", value: "Kraftetaten" },
      ],
    })
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
