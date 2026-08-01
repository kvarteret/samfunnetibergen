import { describe, expect, test } from "vitest"
import { getFormValidationIssues } from "./form-validation-errors"

describe("getFormValidationIssues", () => {
  test("merges error-map slots and removes duplicate messages", () => {
    expect(
      getFormValidationIssues(
        {
          title: [
            { message: "Skriv inn tittel." },
            { message: "Skriv inn tittel." },
            { message: 42 },
          ],
          dates: [{ message: "Fyll ut minst én dato." }],
        },
        {
          title: [{ message: "Skriv inn tittel." }],
          submittedBy: [{ message: "Skriv inn navn på kontaktperson." }],
        },
      ),
    ).toEqual([
      { path: "title", message: "Skriv inn tittel." },
      { path: "dates", message: "Fyll ut minst én dato." },
      {
        path: "submittedBy",
        message: "Skriv inn navn på kontaktperson.",
      },
    ])
  })

  test("ignores malformed error-map values", () => {
    expect(
      getFormValidationIssues(null, "not-an-error-map", {
        title: "not-an-array",
        description: [null, { message: "Beskrivelse er ugyldig." }],
      }),
    ).toEqual([{ path: "description", message: "Beskrivelse er ugyldig." }])
  })
})
