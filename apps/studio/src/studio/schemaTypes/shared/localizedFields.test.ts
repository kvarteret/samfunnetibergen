import { describe, expect, it } from "vitest"

import { validateLocalizedArray } from "./localizedFields"

describe("localized array validation", () => {
  it("requires both canonical locales for required fields", () => {
    expect(
      validateLocalizedArray([{ language: "nb", value: "Norsk" }], {
        required: true,
      }),
    ).toContain("engelsk")
    expect(
      validateLocalizedArray(
        [
          { language: "nb", value: "Norsk" },
          { language: "en", value: "English" },
        ],
        { required: true },
      ),
    ).toBe(true)
  })

  it("requires English when an optional Norwegian source exists", () => {
    expect(
      validateLocalizedArray([{ language: "nb", value: "Norsk" }]),
    ).toContain("engelsk")
    expect(validateLocalizedArray([{ language: "en", value: "English" }])).toBe(
      true,
    )
  })

  it("still rejects duplicate and blank entries", () => {
    expect(
      validateLocalizedArray([
        { language: "nb", value: "Norsk" },
        { language: "nb", value: "Norsk" },
      ]),
    ).toContain("én verdi")
    expect(
      validateLocalizedArray([{ language: "en", value: "   " }]),
    ).toContain("Tomme")
  })
})
