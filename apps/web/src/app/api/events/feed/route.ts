import { fetchPublicEventSet } from "@/features/events/server/public-events"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"
import { resolveSiteUrl } from "@/lib/site-url"
import { buildEventFeedData, serializeJsonLd } from "@/lib/structured-data"

export const revalidate = 60
export const dynamic = "force-dynamic"

export async function GET() {
  const today = getOsloDateString()
  const { occurrences } = await fetchPublicEventSet({
    locale: "nb",
    from: today,
    to: null,
  })
  const body = serializeJsonLd(
    buildEventFeedData(occurrences, {
      siteUrl: resolveSiteUrl(),
      locale: "nb",
    }),
  )

  return new Response(body, {
    headers: {
      "Content-Type": "application/ld+json; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    },
  })
}

export async function HEAD(): Promise<Response> {
  const response = await GET()
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

export function OPTIONS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Accept, Content-Type, Origin",
      "Access-Control-Max-Age": "86400",
      Allow: "GET, HEAD, OPTIONS",
    },
  })
}
