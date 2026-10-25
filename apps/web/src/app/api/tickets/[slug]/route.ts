import { after, type NextRequest, NextResponse } from "next/server"
import { fetchPublicEventBySlug } from "@/features/events/server/public-events"
import { getPostHogClient } from "@/lib/posthog-server"

export const runtime = "nodejs"

type Context = { params: Promise<{ slug: string }> }

const noStore = { "Cache-Control": "private, no-store" }
const trackedParams = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const

function httpUrl(value: string | null | undefined): URL | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url : null
  } catch {
    return null
  }
}

/**
 * Ticket redirect used by the public events API. External sites such as
 * Broadcast link here instead of to the ticket shop, so the click (with its
 * UTM parameters) is recorded before the visitor is sent on.
 */
export async function GET(request: NextRequest, context: Context) {
  const { slug } = await context.params
  const { searchParams } = request.nextUrl
  const locale = searchParams.get("locale") === "en" ? "en" : "nb"

  const result = /^[\p{L}\p{N}_-]{1,200}$/u.test(slug)
    ? await fetchPublicEventBySlug(slug, locale).catch(() => null)
    : null
  const event = result?.event
  // Merged events keep one ticket page per performance; `date` selects it.
  const dateKey = searchParams.get("date")
  const dateTicketUrl = dateKey
    ? event?.dates.find(date => date._key === dateKey)?.ticketUrl
    : null
  const ticketUrl = dateTicketUrl ?? event?.ticketUrl
  const target = httpUrl(ticketUrl)

  if (!event || !target) {
    return NextResponse.redirect(
      new URL(
        `/${locale}/arrangementer/${event ? encodeURIComponent(slug) : ""}`,
        request.nextUrl.origin,
      ),
      { status: 302, headers: noStore },
    )
  }

  const utm: Record<string, string> = {}
  for (const name of trackedParams) {
    const value = searchParams.get(name)?.slice(0, 200)
    if (!value) continue
    utm[name] = value
    // Keep attribution on the ticket shop's own analytics too, but never
    // overwrite parameters the stored ticket URL already carries.
    if (!target.searchParams.has(name)) target.searchParams.set(name, value)
  }

  after(() => {
    const client = getPostHogClient()
    client.capture({
      distinctId: `ticket-proxy:${event._id}`,
      event: "ticket_link_clicked",
      properties: {
        $process_person_profile: false,
        event_id: event._id,
        event_title: event.title,
        event_slug: slug,
        ticket_url: ticketUrl,
        date_key: dateKey,
        source: "ticket_proxy",
        referrer: request.headers.get("referer"),
        ...utm,
      },
    })
    return client.flush()
  })

  return NextResponse.redirect(target, { status: 302, headers: noStore })
}
