import { type NextRequest, NextResponse } from "next/server"
import {
  RETENTION_SECONDS,
  validBatchId,
  validClicks,
} from "@/features/event-interest/domain/interest"
import {
  createSourceCookie,
  sourceCookieName,
  sourceHash,
} from "@/features/event-interest/server/source"
import {
  readInterest,
  saveInterest,
} from "@/features/event-interest/server/store"
import { fetchPublicEventBySlug } from "@/features/events/server/public-events"

export const runtime = "nodejs"
const noStore = { "Cache-Control": "private, no-store" }
type Context = { params: Promise<{ slug: string }> }

function error(detail: string, status: number) {
  return NextResponse.json({ detail }, { status, headers: noStore })
}

async function resolveEvent(request: NextRequest, context: Context) {
  const { slug } = await context.params
  const locale = request.nextUrl.searchParams.get("locale") ?? "nb"
  if (
    !/^[\p{L}\p{N}_-]{1,200}$/u.test(slug) ||
    (locale !== "nb" && locale !== "en")
  )
    return null
  const result = await fetchPublicEventBySlug(slug, locale)
  return result?.event ?? null
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const event = await resolveEvent(request, context)
    if (!event) return error("Event not found", 404)
    const source = sourceHash(
      event._id,
      request.cookies.get(sourceCookieName(event._id))?.value,
    )
    return NextResponse.json(await readInterest(event._id, source), {
      headers: noStore,
    })
  } catch {
    // Avoid logging connection strings or cookie identifiers.
    console.error("[event-interest] Unable to read response")
    return error("Event responses are temporarily unavailable", 503)
  }
}

export async function POST(request: NextRequest, context: Context) {
  if (
    request.headers.get("origin") !== request.nextUrl.origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return error("Invalid origin", 403)
  }
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return error("Expected JSON", 415)
  let clicks: unknown
  let batchId: unknown
  let initialize = false
  try {
    const text = await request.text()
    if (text.length > 256) return error("Request too large", 413)
    const body = JSON.parse(text)
    initialize = body?.initialize === true
    clicks = body?.clicks
    batchId = body?.batch_id
  } catch {
    return error("Invalid JSON", 400)
  }
  if (!initialize && (!validClicks(clicks) || !validBatchId(batchId)))
    return error("Invalid click batch", 400)

  try {
    const event = await resolveEvent(request, context)
    if (event?.eventStatus !== "scheduled")
      return error("Event not available", 404)
    const name = sourceCookieName(event._id)
    let cookie = request.cookies.get(name)?.value
    let source = sourceHash(event._id, cookie)
    const isNew = !source
    if (!source) {
      cookie = createSourceCookie(event._id)
      source = sourceHash(event._id, cookie)
    }
    if (!source || !cookie) throw new Error("Unable to initialize source")
    const result = initialize
      ? await readInterest(event._id, source)
      : await saveInterest(event._id, source, {
          clicks: clicks as number,
          batch_id: batchId as string,
        })
    const response = NextResponse.json(result, { headers: noStore })
    if (isNew)
      response.cookies.set(name, cookie, {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "strict",
        path: "/api/event-interest",
        maxAge: RETENTION_SECONDS,
      })
    return response
  } catch {
    console.error("[event-interest] Unable to save response")
    return error("Event responses are temporarily unavailable", 503)
  }
}
