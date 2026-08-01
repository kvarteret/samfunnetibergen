import { describe, expect, it } from "vitest"

import { studentGroupSlugFromName } from "./groupSlugs"

describe("student group slugs", () => {
  it("uses one deterministic rule without legacy aliases", () => {
    expect(studentGroupSlugFromName("Debatt")).toBe("debatt")
    expect(studentGroupSlugFromName("Fest")).toBe("fest")
    expect(studentGroupSlugFromName("Grøndahls")).toBe("grondahls")
    expect(studentGroupSlugFromName("Søsterorganisasjon Åsane")).toBe(
      "sosterorganisasjon-asane",
    )
  })
})
