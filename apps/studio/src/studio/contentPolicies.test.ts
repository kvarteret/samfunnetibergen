import { describe, expect, it } from "vitest"

import {
  getPublishedDocumentId,
  isReservedPageSlug,
  wouldCreateGroupCycle,
} from "./contentPolicies"

describe("Studio content policies", () => {
  it("reserves slugs owned by code routes", () => {
    expect(isReservedPageSlug("karaoke")).toBe(true)
    expect(isReservedPageSlug("arrangementer")).toBe(true)
    expect(isReservedPageSlug("bli-frivillig")).toBe(true)
    expect(isReservedPageSlug("new-information-page")).toBe(false)
  })

  it("normalizes draft references to published document IDs", () => {
    expect(getPublishedDocumentId("drafts.page-1")).toBe("page-1")
    expect(getPublishedDocumentId("page-1")).toBe("page-1")
  })

  it("detects self references and ancestor cycles", async () => {
    const parents = new Map([
      ["group-b", "group-c"],
      ["group-c", "group-a"],
    ])
    const loadParentId = async (id: string) => parents.get(id) ?? null

    await expect(
      wouldCreateGroupCycle("group-a", "group-a", loadParentId),
    ).resolves.toBe(true)
    await expect(
      wouldCreateGroupCycle("group-a", "group-b", loadParentId),
    ).resolves.toBe(true)
    await expect(
      wouldCreateGroupCycle("group-z", "group-b", loadParentId),
    ).resolves.toBe(false)
  })
})
