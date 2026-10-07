import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { createServer } from "node:http"
import {
  exchangeToken,
  sealToken,
  TOKEN_ID,
} from "@/features/weekly-canva/auth"
import { LOCK_ID, weeklyClient } from "@/features/weekly-canva/runner"

async function main() {
  if (process.argv.length > 2) throw new Error("Usage: canva:connect")
  const clientId = process.env.CANVA_CLIENT_ID
  if (
    !clientId ||
    !process.env.CANVA_CLIENT_SECRET ||
    !process.env.CANVA_TOKEN_ENCRYPTION_KEY
  )
    throw new Error("Configure Canva client id, secret and encryption key")
  const client = weeklyClient()
  const state = randomBytes(32).toString("base64url")
  const verifier = randomBytes(64).toString("base64url")
  const redirect = "http://127.0.0.1:8789/callback"
  const consent = new URL("https://www.canva.com/api/oauth/authorize")
  consent.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirect,
    scope:
      "design:content:read design:content:write design:meta:read asset:read asset:write folder:read folder:write",
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "s256",
  }).toString()
  await new Promise<void>((resolve, reject) => {
    let handling = false
    const server = createServer(async (req, res) => {
      const url = new URL(req.url || "/", redirect)
      if (url.pathname !== "/callback") {
        res.writeHead(404).end()
        return
      }
      const received = Buffer.from(url.searchParams.get("state") ?? "")
      const expected = Buffer.from(state)
      if (
        req.method !== "GET" ||
        received.length !== expected.length ||
        !timingSafeEqual(received, expected) ||
        !url.searchParams.get("code") ||
        handling
      ) {
        res.writeHead(400).end("Invalid authorization callback")
        return
      }
      handling = true
      let revision: string | undefined
      try {
        await client.createIfNotExists({
          _id: LOCK_ID,
          _type: "weeklyCanvaLock",
        })
        const lock = await client.getDocument<{
          _id: string
          _rev: string
          leaseUntil?: string
        }>(LOCK_ID)
        if (!lock || Date.parse(lock.leaseUntil ?? "") > Date.now())
          throw new Error("Weekly job is running; connect later")
        revision = (
          await client
            .patch(LOCK_ID)
            .ifRevisionId(lock._rev)
            .set({ leaseUntil: new Date(Date.now() + 60000).toISOString() })
            .commit()
        )._rev
        const token = await exchangeToken(
          new URLSearchParams({
            grant_type: "authorization_code",
            code: url.searchParams.get("code") as string,
            redirect_uri: redirect,
            code_verifier: verifier,
          }),
        )
        await client.createOrReplace({
          _id: TOKEN_ID,
          _type: "weeklyCanvaOAuth",
          encryptedToken: sealToken(token),
        })
        res
          .writeHead(200, { "content-type": "text/plain" })
          .end("Canva connected. You can close this tab.")
        process.stdout.write("Canva connected; tokens stored encrypted.\n")
        resolve()
      } catch {
        res.writeHead(500).end("Connection failed. Retry the setup command.")
        reject(new Error("Canva connection failed"))
      } finally {
        try {
          if (revision)
            await client
              .patch(LOCK_ID)
              .ifRevisionId(revision)
              .unset(["leaseUntil"])
              .commit()
        } catch {
          // The short lease expires if cleanup fails; tokens are already saved.
          process.stderr.write(
            "Connection lease cleanup failed; wait one minute before retrying.\n",
          )
        } finally {
          server.close()
          clearTimeout(timer)
        }
      }
    })
    const timer = setTimeout(() => {
      server.close()
      reject(new Error("Canva connection timed out"))
    }, 10 * 60000)
    server.on("error", error => {
      clearTimeout(timer)
      reject(error)
    })
    server.listen(8789, "127.0.0.1", () =>
      process.stdout.write(`Open this Canva consent URL:\n${consent}\n`),
    )
  })
}
main().catch(() => {
  process.stderr.write(
    "Canva connection failed. Check app credentials, redirect URL and Sanity access.\n",
  )
  process.exitCode = 1
})
