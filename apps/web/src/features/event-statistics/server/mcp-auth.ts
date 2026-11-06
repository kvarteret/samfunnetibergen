import { createHash, timingSafeEqual } from "node:crypto"

/*
 * SHA-256 of the bearer token Ludvig sends to /api/mcp/statistikk. The token
 * itself lives only in Infisical (Samfunnet Deployments /mime); the website
 * needs just enough to recognise it. The token is 64 random characters, so its
 * hash is safe to publish.
 *
 * To rotate: generate a new token, put it in /mime, commit its hash here
 * (`printf %s "$TOKEN" | shasum -a 256`), and deploy the website before Ludvig.
 * STATISTICS_MCP_TOKEN_SHA256 overrides the hash, e.g. for local testing.
 */
export const STATISTICS_MCP_TOKEN_SHA256 =
  "cf41012b091a8972bc9ddc924cd1f70982ce7049802bf70bf225e9b33e484d3e"

export function statisticsTokenAccepted(
  authorization: string | null,
  expectedSha256 = process.env.STATISTICS_MCP_TOKEN_SHA256?.trim() ||
    STATISTICS_MCP_TOKEN_SHA256,
) {
  const sent = authorization?.match(/^Bearer (.+)$/)?.[1]
  if (!sent) return false
  const actual = createHash("sha256").update(sent).digest()
  const expected = Buffer.from(expectedSha256.toLowerCase(), "hex")
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
