import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type JWK,
  SignJWT,
} from "jose"
import { describe, expect, it } from "vitest"
import { statisticsTokenAccepted } from "./mcp-auth"

async function ludvig() {
  const { privateKey, publicKey } = await generateKeyPair("EdDSA")
  const jwk: JWK = { ...(await exportJWK(publicKey)), kid: "k", alg: "EdDSA" }
  const sign = (claims: { iss?: string; aud?: string; exp?: string } = {}) =>
    new SignJWT({})
      .setProtectedHeader({ alg: "EdDSA", kid: "k" })
      .setIssuer(claims.iss ?? "ludvig")
      .setAudience(claims.aud ?? "samfunnetibergen-statistikk")
      .setIssuedAt()
      .setExpirationTime(claims.exp ?? "15m")
      .sign(privateKey)
  return { keys: createLocalJWKSet({ keys: [jwk] }), sign }
}

describe("statisticsTokenAccepted", () => {
  it("accepts a token signed by Ludvig's key", async () => {
    const { keys, sign } = await ludvig()
    expect(await statisticsTokenAccepted(`Bearer ${await sign()}`, keys)).toBe(
      true,
    )
  })

  it("rejects other keys, issuers, audiences and expired tokens", async () => {
    const { keys } = await ludvig()
    const other = await ludvig()
    for (const token of [
      await other.sign(),
      await (await ludvig()).sign({ iss: "someone" }),
    ])
      expect(await statisticsTokenAccepted(`Bearer ${token}`, keys)).toBe(false)

    const { keys: same, sign } = await ludvig()
    expect(
      await statisticsTokenAccepted(
        `Bearer ${await sign({ aud: "elsewhere" })}`,
        same,
      ),
    ).toBe(false)
    expect(
      await statisticsTokenAccepted(
        `Bearer ${await sign({ exp: "-1m" })}`,
        same,
      ),
    ).toBe(false)
  })

  it("rejects missing or non-bearer headers", async () => {
    const { keys } = await ludvig()
    expect(await statisticsTokenAccepted(null, keys)).toBe(false)
    expect(await statisticsTokenAccepted("Basic abc", keys)).toBe(false)
  })
})
