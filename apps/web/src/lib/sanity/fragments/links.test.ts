import { describe, expect, it } from "vitest"

import { sourceLinkProjection } from "./links"

describe("source link route projection", () => {
  it("resolves listing documents to the canonical volunteer route", () => {
    expect(sourceLinkProjection).toContain(
      'internalPage->_type == "groupsPage" => "/bli-frivillig"',
    )
    expect(sourceLinkProjection).toContain(
      'internalPage._ref == "blifrivilligPage" => "/bli-frivillig"',
    )
  })

  it("keeps student group documents on their detail route", () => {
    expect(sourceLinkProjection).toContain(
      'internalPage->_type == "studentGroup" && defined(internalPage->slug.current) => "/grupper/" + internalPage->slug.current',
    )
  })
})
