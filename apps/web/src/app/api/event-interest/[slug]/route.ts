import { type NextRequest, NextResponse } from "next/server"
import {
  RETENTION_SECONDS,
  validTaps,
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
  let taps: unknown
  let initialize = false
  try {
    const text = await request.text()
    if (text.length > 128) return error("Request too large", 413)
    const body = JSON.parse(text)
    initialize = body?.initialize === true
    taps = initialize ? 0 : body?.taps
  } catch {
    return error("Invalid JSON", 400)
  }
  if (!validTaps(taps)) return error("Invalid taps", 400)

  try {
    const event = await resolveEvent(request, context)
    if (event?.eventStatus !== "scheduled")
      return error("Event not available", 404)
    const name = sourceCookieName(event._id)
    let cookie = request.cookies.get(name)?.value
    let source = sourceHash(event._id, cookie)
    if (!source && taps === 0 && !initialize)
      return NextResponse.json(await readInterest(event._id, null), {
        headers: noStore,
      })
    const isNew = !source
    if (!source) {
      cookie = createSourceCookie(event._id)
      source = sourceHash(event._id, cookie)
    }
    if (!source || !cookie) throw new Error("Unable to initialize source")
    const result = initialize
      ? await readInterest(event._id, source)
      : await saveInterest(event._id, source, taps)
    const response = NextResponse.json(result, { headers: noStore })
    if (isNew || (taps === 0 && !initialize))
      response.cookies.set(name, taps === 0 && !initialize ? "" : cookie, {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "strict",
        path: "/api/event-interest",
        maxAge: taps === 0 && !initialize ? 0 : RETENTION_SECONDS,
      })
    return response
  } catch {
    console.error("[event-interest] Unable to save response")
    return error("Event responses are temporarily unavailable", 503)
  }
}
