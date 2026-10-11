import type { SanityClient } from "@sanity/client"
import { importClient } from "../ticketco/importer"
import { importEventFromUrl } from "./import"
import { UnsafeUrlError } from "./public-fetch"

const REQUEST_TTL_MS = 5 * 60 * 1000
const REQUEST_ID = /^[a-f0-9-]{36}$/
const CORS = {
  // The capability is the request document, not the origin or a cookie.
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
}

type ImportRequest = {
  _id: string
  _rev: string
  _type: string
  _createdAt: string
  url?: unknown
  claimedAt?: string
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS })
}

export function eventImportOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

/**
 * Studio "Fyll ut fra lenke". Only signed-in Studio users can create the
 * private `eventImportRequest.<uuid>` document naming the URL, so a fresh,
 * unclaimed request proves an editor asked. It is single use and deleted.
 */
export async function handleEventImport(
  request: Request,
  dependencies: {
    client?: () => SanityClient
    importUrl?: typeof importEventFromUrl
  } = {},
) {
  let requestId: unknown
  try {
    requestId = ((await request.json()) as { requestId?: unknown }).requestId
  } catch {
    return json({ error: "Ugyldig forespørsel" }, 400)
  }
  if (typeof requestId !== "string" || !REQUEST_ID.test(requestId))
    return json({ error: "Ugyldig forespørsel" }, 400)
  let client: SanityClient
  try {
    client = (dependencies.client ?? importClient)()
  } catch {
    return json({ error: "Import er ikke konfigurert" }, 503)
  }
  const id = `eventImportRequest.${requestId}`
  const pending = await client.getDocument<ImportRequest>(id)
  if (
    !pending ||
    pending._type !== "eventImportRequest" ||
    typeof pending.url !== "string" ||
    pending.claimedAt ||
    Date.now() - Date.parse(pending._createdAt) > REQUEST_TTL_MS
  )
    return json({ error: "Forespørselen er ugyldig eller utløpt" }, 403)
  try {
    await client
      .patch(id)
      .ifRevisionId(pending._rev)
      .set({ claimedAt: new Date().toISOString() })
      .commit()
  } catch {
    return json({ error: "Forespørselen er allerede i bruk" }, 409)
  }
  try {
    return json(
      await (dependencies.importUrl ?? importEventFromUrl)(client, pending.url),
    )
  } catch (error) {
    if (error instanceof UnsafeUrlError)
      return json({ error: "Lenken må være en offentlig nettside." }, 400)
    const message = error instanceof Error ? error.message : ""
    return json(
      {
        error: /^Source HTTP|^Too many redirects|size limit/.test(message)
          ? "Kunne ikke hente siden. Sjekk lenken."
          : /^Luna|AZURE/.test(message)
            ? "KI-tjenesten svarte ikke. Prøv igjen om litt."
            : "Importen feilet. Prøv igjen eller fyll ut manuelt.",
      },
      502,
    )
  } finally {
    await client.delete(id).catch(() => undefined)
  }
}
