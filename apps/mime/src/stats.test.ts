import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type JWK,
  jwtVerify,
} from "jose"
import { describe, expect, test } from "vitest"
import {
  STATS_TOKEN_AUDIENCE,
  STATS_TOKEN_ISSUER,
  signStatsToken,
  statsJwks,
  statsOptions,
} from "./stats"

async function signingKey() {
  const { privateKey } = await generateKeyPair("EdDSA", { extractable: true })
  return exportJWK(privateKey)
}

describe("statsOptions", () => {
  test("is off without a signing key", () => {
    expect(statsOptions({ SITE_URL: "https://www.example.no" })).toBeUndefined()
  })

  test("is off with a malformed key", () => {
    expect(
      statsOptions({
        SITE_URL: "https://www.example.no",
        STATISTICS_SIGNING_KEY: "not json",
      }),
    ).toBeUndefined()
  })

  test("defaults to the website's endpoint", async () => {
    const key = await signingKey()
    expect(
      statsOptions({
        SITE_URL: "https://www.example.no/",
        STATISTICS_SIGNING_KEY: ` ${JSON.stringify(key)} `,
      }),
    ).toEqual({ url: "https://www.example.no/api/mcp/statistikk", key })
  })

  test("an explicit URL wins", async () => {
    expect(
      statsOptions({
        SITE_URL: "https://www.example.no",
        STATISTICS_MCP_URL: "http://localhost:3000/api/mcp/statistikk",
        STATISTICS_SIGNING_KEY: JSON.stringify(await signingKey()),
      })?.url,
    ).toBe("http://localhost:3000/api/mcp/statistikk")
  })
})

describe("signed statistics tokens", () => {
  test("verify against the published public key", async () => {
    const key = await signingKey()
    const jwks = await statsJwks({
      STATISTICS_SIGNING_KEY: JSON.stringify(key),
    })
    expect(jwks.keys[0]).not.toHaveProperty("d")

    const { payload } = await jwtVerify(
      await signStatsToken(key),
      createLocalJWKSet(jwks as { keys: JWK[] }),
      {
        issuer: STATS_TOKEN_ISSUER,
        audience: STATS_TOKEN_AUDIENCE,
        algorithms: ["EdDSA"],
      },
    )
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000)
  })

  test("publish nothing without a key", async () => {
    expect(await statsJwks({})).toEqual({ keys: [] })
  })
})
