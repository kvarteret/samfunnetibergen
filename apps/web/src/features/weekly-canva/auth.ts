import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import type { SanityClient } from "@sanity/client"
import { z } from "zod"

export const TOKEN_ID = "weekly-canva-oauth"
const tokens = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().positive(),
})
export type SavedToken = {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

function encryptionKey(key = process.env.CANVA_TOKEN_ENCRYPTION_KEY): Buffer {
  if (!key || !/^[a-f0-9]{64}$/i.test(key))
    throw new Error("Configure CANVA_TOKEN_ENCRYPTION_KEY as 32 bytes in hex")
  return Buffer.from(key, "hex")
}

export function sealToken(token: SavedToken, key?: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(key), iv)
  cipher.setAAD(Buffer.from(TOKEN_ID))
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(token), "utf8"),
    cipher.final(),
  ])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64")
}

export function openToken(value: string, key?: string): SavedToken {
  const data = Buffer.from(value, "base64")
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(key),
    data.subarray(0, 12),
  )
  decipher.setAAD(Buffer.from(TOKEN_ID))
  decipher.setAuthTag(data.subarray(12, 28))
  const text = Buffer.concat([
    decipher.update(data.subarray(28)),
    decipher.final(),
  ]).toString("utf8")
  return z
    .object({
      accessToken: z.string().min(1),
      refreshToken: z.string().min(1),
      expiresAt: z.number(),
    })
    .parse(JSON.parse(text))
}

export async function exchangeToken(
  params: URLSearchParams,
): Promise<SavedToken> {
  const id = process.env.CANVA_CLIENT_ID
  const secret = process.env.CANVA_CLIENT_SECRET
  if (!id || !secret)
    throw new Error("Configure CANVA_CLIENT_ID and CANVA_CLIENT_SECRET")
  encryptionKey()
  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    signal: AbortSignal.timeout(30000),
    headers: {
      authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params,
  })
  if (!response.ok)
    throw new Error(
      `Canva OAuth HTTP ${response.status}; reconnect if the refresh token was consumed`,
    )
  const body = tokens.parse(await response.json())
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  }
}

// Caller must hold the global automation lease while consuming a single-use token.
export async function accessToken(client: SanityClient): Promise<string> {
  const saved = await client.getDocument<{
    _id: string
    _rev: string
    encryptedToken: string
    refreshStartedAt?: string
  }>(TOKEN_ID)
  if (!saved?.encryptedToken)
    throw new Error("Canva is not connected; run canva:connect")
  if (saved.refreshStartedAt)
    throw new Error("Canva token refresh was interrupted; reconnect Canva")
  const current = openToken(saved.encryptedToken)
  if (current.expiresAt > Date.now() + 120000) return current.accessToken
  const refreshing = await client
    .patch(TOKEN_ID)
    .ifRevisionId(saved._rev)
    .set({ refreshStartedAt: new Date().toISOString() })
    .commit()
  const next = await exchangeToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: current.refreshToken,
    }),
  )
  // Save the replacement before any design request. Never log these values.
  await client
    .patch(TOKEN_ID)
    .ifRevisionId(refreshing._rev)
    .set({ encryptedToken: sealToken(next) })
    .unset(["refreshStartedAt"])
    .commit()
  return next.accessToken
}
