import { describe, expect, it } from "vitest"
import {
  parseVolunteerRejection,
  volunteerRejectionDiagnostics,
} from "./volunteer-rejection"

describe("volunteer rejection feedback", () => {
  it("preserves indexed friend errors across proxy and browser parsing", () => {
    const upstream = parseVolunteerRejection(
      {
        message: "Sjekk venneadressene.",
        fieldErrors: {
          friendEmails: { 1: "E-postadressene må være ulike." },
          unknown: "private",
          "friendEmails[99]": "private",
        },
      },
      "fallback",
    )
    const browser = parseVolunteerRejection(upstream.detail, "fallback")
    expect(browser.issues).toEqual([
      { path: "friendEmails[1]", message: "E-postadressene må være ulike." },
    ])
    expect(JSON.stringify(upstream.detail)).not.toContain("private")
  })
  it("exports only safe field paths and approved codes, never error messages", () => {
    const rejection = parseVolunteerRejection(
      {
        message: "sentinel@example.com",
        fieldErrors: { email: "sentinel@example.com" },
      },
      "fallback",
    )
    const diagnostics = volunteerRejectionDiagnostics(
      rejection,
      "Bearer secret",
    )
    expect(diagnostics).toEqual({
      issue_count: 1,
      field_paths: "email",
      issue_codes: "upstream_field_validation",
    })
    expect(JSON.stringify(diagnostics)).not.toContain("sentinel")
    expect(
      volunteerRejectionDiagnostics(rejection, "group_not_found").issue_codes,
    ).toBe("group_not_found")
  })
  it("falls back safely for malformed structured responses", () => {
    expect(
      parseVolunteerRejection(
        { detail: "private", fieldErrors: ["private"] },
        "fallback",
      ).detail,
    ).toBe("fallback")
  })
})
