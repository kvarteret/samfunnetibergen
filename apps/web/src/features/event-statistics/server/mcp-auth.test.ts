import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { statisticsTokenAccepted } from "./mcp-auth"

const hash = (value: string) => createHash("sha256").update(value).digest("hex")

describe("statisticsTokenAccepted", () => {
  it("accepts the token whose hash is committed", () => {
    expect(statisticsTokenAccepted("Bearer secret", hash("secret"))).toBe(true)
  })

  it("rejects other tokens, other schemes and missing headers", () => {
    expect(statisticsTokenAccepted("Bearer other", hash("secret"))).toBe(false)
    expect(statisticsTokenAccepted("Basic secret", hash("secret"))).toBe(false)
    expect(statisticsTokenAccepted(null, hash("secret"))).toBe(false)
  })

  it("rejects everything when the expected hash is malformed", () => {
    expect(statisticsTokenAccepted("Bearer secret", "not-hex")).toBe(false)
  })
})
