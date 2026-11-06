import { createMCPClient } from "@ai-sdk/mcp"
import { calculateJwkThumbprint, importJWK, type JWK, SignJWT } from "jose"

/**
 * Event statistics from the website's MCP endpoint (/api/mcp/statistikk):
 * the same PostHog numbers and cache as /arrangementer/statistikk. Only the
 * tools below are offered; anything the server adds later stays hidden until
 * it is listed here.
 */
export const STATS_TOOLS = new Set(["event_stats", "event_stats_detail"])

/**
 * Ludvig proves who it is with short-lived tokens signed by
 * STATISTICS_SIGNING_KEY (a private Ed25519 JWK, Infisical /mime only). The
 * website verifies them against the public key Ludvig serves at
 * /.well-known/jwks.json, so rotating the key is a change in /mime alone.
 * Issuer and audience must match apps/web statistics mcp-auth.ts.
 */
export const STATS_TOKEN_ISSUER = "ludvig"
export const STATS_TOKEN_AUDIENCE = "samfunnetibergen-statistikk"
const TOKEN_LIFETIME = "15m"

type StatsEnv = {
  SITE_URL?: string
  STATISTICS_MCP_URL?: string
  STATISTICS_SIGNING_KEY?: string
}

function signingJwk(env: StatsEnv): JWK | undefined {
  const raw = env.STATISTICS_SIGNING_KEY?.trim()
  if (!raw) return undefined
  try {
    const jwk = JSON.parse(raw) as JWK
    return jwk.kty === "OKP" && jwk.crv === "Ed25519" && jwk.d ? jwk : undefined
  } catch {
    return undefined
  }
}

/**
 * Connection options, or undefined when statistics are not configured
 * (Ludvig then answers without them).
 */
export function statsOptions(
  env: StatsEnv,
): { url: string; key: JWK } | undefined {
  const key = signingJwk(env)
  const url =
    env.STATISTICS_MCP_URL?.trim() ||
    (env.SITE_URL
      ? `${env.SITE_URL.replace(/\/+$/, "")}/api/mcp/statistikk`
      : undefined)
  if (!url || !key) return undefined
  return { url, key }
}

/** The public half of STATISTICS_SIGNING_KEY, for /.well-known/jwks.json. */
export async function statsJwks(env: StatsEnv) {
  const key = signingJwk(env)
  if (!key) return { keys: [] }
  const { kty, crv, x } = key
  const publicKey = { kty, crv, x }
  return {
    keys: [
      {
        ...publicKey,
        alg: "EdDSA",
        use: "sig",
        kid: await calculateJwkThumbprint(publicKey),
      },
    ],
  }
}

export async function signStatsToken(key: JWK) {
  const { kty, crv, x } = key
  return new SignJWT({})
    .setProtectedHeader({
      alg: "EdDSA",
      kid: await calculateJwkThumbprint({ kty, crv, x }),
    })
    .setIssuer(STATS_TOKEN_ISSUER)
    .setAudience(STATS_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(TOKEN_LIFETIME)
    .sign(await importJWK(key, "EdDSA"))
}

export async function connectStats(options: { url: string; key: JWK }) {
  const client = await createMCPClient({
    protocolVersionDiscovery: false,
    transport: {
      type: "http",
      url: options.url,
      // workerd rejects fetch's redirect: "error", this transport's default.
      redirect: "follow",
      // One token per turn; it outlives any single answer.
      headers: { Authorization: `Bearer ${await signStatsToken(options.key)}` },
    },
  })
  try {
    const listed = await client.listTools()
    const definitions = {
      ...listed,
      tools: listed.tools.filter(tool => STATS_TOOLS.has(tool.name)),
    }
    return {
      tools: client.toolsFromDefinitions(definitions),
      close: () => client.close(),
    }
  } catch (error) {
    await client.close()
    throw error
  }
}
