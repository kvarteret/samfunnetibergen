import { describe, expect, it } from "vitest"
import { buildGroupRecruitmentPatch } from "./groupRecruitment"

describe("group recruitment preset", () => {
  it.each([undefined, null, "external", "full"])(
    "opens recruitment when the saved status is %s",
    applicationStatus => {
      expect(
        buildGroupRecruitmentPatch({
          slug: { current: "vaktetaten" },
          applicationStatus,
        }),
      ).toEqual({ applicationStatus: "open" })
    },
  )

  it("keeps Immaturus on external recruitment", () => {
    expect(
      buildGroupRecruitmentPatch({
        slug: { current: "immaturus" },
        applicationStatus: "external",
      }),
    ).toEqual({})
    expect(
      buildGroupRecruitmentPatch({
        slug: { current: "immaturus" },
        applicationStatus: "open",
      }),
    ).toEqual({ applicationStatus: "external" })
  })

  it("does not change groups already recruiting actively", () => {
    expect(
      buildGroupRecruitmentPatch({
        slug: { current: "foto" },
        applicationStatus: "open",
      }),
    ).toEqual({})
  })

  it("requires a stable identifier before choosing a status", () => {
    expect(() => buildGroupRecruitmentPatch({})).toThrow("without a slug")
  })
})
