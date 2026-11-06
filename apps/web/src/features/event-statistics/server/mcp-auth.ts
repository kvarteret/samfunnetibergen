import { createRemoteJWKSet, type JWTVerifyGetKey, jwtVerify } from "jose"

/*
 * Ludvig (apps/mime) calls /api/mcp/statistikk with short-lived tokens signed
 * by its private key, which lives only in Infisical /mime. The website trusts
 * the public key Ludvig serves, fetched over HTTPS and cached, so nothing is
 * configured here and rotating the key needs no website change.
 * STATISTICS_JWKS_URL points at another Ludvig, e.g. `wrangler dev` locally.
 * Issuer and audience must match apps/mime/src/stats.ts.
 */
const LUDVIG_JWKS_URL =
  "https://mime.samfunnetibergen.workers.dev/.well-known/jwks.json"
const ISSUER = "ludvig"
const AUDIENCE = "samfunnetibergen-statistikk"

let remoteKeys: JWTVerifyGetKey | undefined

function ludvigKeys() {
  remoteKeys ??= createRemoteJWKSet(
    new URL(process.env.STATISTICS_JWKS_URL?.trim() || LUDVIG_JWKS_URL),
  )
  return remoteKeys
}

export async function statisticsTokenAccepted(
  authorization: string | null,
  keys: JWTVerifyGetKey = ludvigKeys(),
) {
  const token = authorization?.match(/^Bearer (.+)$/)?.[1]
  if (!token) return false
  try {
    await jwtVerify(token, keys, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["EdDSA"],
      maxTokenAge: "20m",
    })
    return true
  } catch {
    return false
  }
}
