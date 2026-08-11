"use server"

import { injectActiveTraceContext } from "@/lib/observability"
import { err, ok } from "@/lib/result"
import type { CresatResult, EventRequestBody } from "./types"

const BASE_URL = "https://app.crescat.io"

// These are the only public Crescat forms this server is allowed to contact.
// Return complete constant URLs so request input can never influence the
// outbound origin or path.
function eventRequestUrl(slug: string): string | null {
  switch (slug) {
    case "studentersamfunnet-i-bergen-bookingskjema-standard":
      return "https://app.crescat.io/event-requests/studentersamfunnet-i-bergen-bookingskjema-standard"
    case "studentersamfunnet-i-bergen-bookingskjema-dorger-borger-og-interne":
      return "https://app.crescat.io/event-requests/studentersamfunnet-i-bergen-bookingskjema-dorger-borger-og-interne"
    case "studentersamfunnet-i-bergen-booking-av-karoke":
      return "https://app.crescat.io/event-requests/studentersamfunnet-i-bergen-booking-av-karoke"
    default:
      return null
  }
}

// Fetch a fresh XSRF-TOKEN cookie from the public form page.
// Crescat uses Laravel's CSRF pattern: the cookie value (URL-decoded) is
// sent back as the x-xsrf-token header.
async function fetchXsrfSession(
  url: string,
): Promise<{ cookie: string; token: string } | null> {
  const headers: Record<string, string> = {
    "user-agent":
      "Mozilla/5.0 (compatible; SamfunnetBot/1.0; +https://samfunnetibergen.no)",
  }
  injectActiveTraceContext(headers)
  const res = await fetch(url, {
    headers,
  })

  if (!res.ok) return null

  const setCookie = res.headers.getSetCookie?.() ?? []
  const rawHeader = res.headers.get("set-cookie") ?? ""

  // Collect all Set-Cookie entries (Node fetch may return them combined)
  const cookieParts: string[] =
    setCookie.length > 0 ? setCookie : rawHeader.split(/,(?=[^ ])/g)

  let xsrfRaw: string | undefined
  let sessionRaw: string | undefined

  for (const part of cookieParts) {
    const [nameValue] = part.split(";")
    const eq = nameValue.indexOf("=")
    const name = nameValue.slice(0, eq).trim()
    const value = nameValue.slice(eq + 1).trim()
    if (name === "XSRF-TOKEN") xsrfRaw = value
    if (name === "crescat_session") sessionRaw = value
  }

  if (!xsrfRaw || !sessionRaw) return null

  const token = decodeURIComponent(xsrfRaw)
  const cookie = `XSRF-TOKEN=${xsrfRaw}; crescat_session=${sessionRaw}`

  return { cookie, token }
}

export async function postEventRequest(
  slug: string,
  body: EventRequestBody,
): Promise<CresatResult> {
  const url = eventRequestUrl(slug)
  if (!url) {
    return err("Ugyldig bookingskjema.")
  }

  const session = await fetchXsrfSession(url)
  if (!session) {
    return err("Klarte ikke å opprette sesjon mot bookingsystemet.")
  }

  const headers: Record<string, string> = {
    accept: "application/json, text/plain, */*",
    "content-type": "application/json",
    "x-requested-with": "XMLHttpRequest",
    "x-xsrf-token": session.token,
    cookie: session.cookie,
    origin: BASE_URL,
    referer: url,
  }
  injectActiveTraceContext(headers)
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (res.status === 201 || res.status === 200) {
    return ok(res.status)
  }

  // Crescat may echo submitted contact or booking values in its response.
  // Keep failures status-only so downstream exception capture cannot send
  // those direct identifiers to PostHog.
  return err(`Bookingsystemet svarte med status ${res.status}.`)
}
