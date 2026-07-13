import { describe, expect, it } from "vitest"
import { studioDocumentTypeNames } from "./documentTypes"
import { schemaTypes } from "./schemaTypes"

describe("Studio document registry", () => {
  it("represents every registered document schema exactly once", () => {
    const schemaDocumentTypeNames = schemaTypes
      .filter(schemaType => schemaType.type === "document")
      .map(schemaType => schemaType.name)
      .sort()

    expect([...studioDocumentTypeNames].sort()).toEqual(schemaDocumentTypeNames)
  })
})
