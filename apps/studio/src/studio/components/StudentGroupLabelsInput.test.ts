import { describe, expect, it } from "vitest"
import { parseStudentGroupLabels } from "./StudentGroupLabelsInput"

describe("parseStudentGroupLabels", () => {
  it("normalizes the legacy newline-delimited value", () => {
    expect(parseStudentGroupLabels(" Kultur\n\nKunnskap\r\nKultur ")).toEqual([
      "Kultur",
      "Kunnskap",
    ])
  })

  it("handles an empty value", () => {
    expect(parseStudentGroupLabels(undefined)).toEqual([])
  })

  it("tolerates migrated values that are not strings", () => {
    expect(parseStudentGroupLabels({ language: "nb", value: "Drift" })).toEqual(
      ["Drift"],
    )
    expect(parseStudentGroupLabels(["Bar", 3])).toEqual(["Bar"])
    expect(parseStudentGroupLabels(42)).toEqual([])
  })
})
