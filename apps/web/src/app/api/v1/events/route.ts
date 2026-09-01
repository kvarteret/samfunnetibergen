import {
  decodePublicEventsCursor,
  encodePublicEventsCursor,
} from "@/features/events/api/cursor"
import {
  publicApiErrorResponse,
  publicApiHeadResponse,
  publicApiJsonResponse,
  publicApiOptionsResponse,
} from "@/features/events/api/http"
import {
  InvalidPublicEventsRequest,
  parsePublicEventsCollectionRequest,
  publicEventsUrl,
} from "@/features/events/api/request"
import { publicCollectionResponseSchema } from "@/features/events/api/schemas"
import { serializePublicOccurrence } from "@/features/events/api/serializers"
import {
  comparePublicOccurrenceToKey,
  type PublicOccurrence,
} from "@/features/events/domain/public-events"
import { fetchPublicEventSet } from "@/features/events/server/public-events"
import { resolveSiteUrl } from "@/lib/site-url"

const PAGE_SIZE = 100

function invalidRequest(message: string): Response {
  return publicApiErrorResponse("invalid_request", message, 400)
}

function errorResponse(error: unknown): Response {
  if (error instanceof InvalidPublicEventsRequest) {
    return invalidRequest(error.message)
  }

  console.error("[public-events-api] Failed to fetch event collection", error)
  return publicApiErrorResponse(
    "internal_error",
    "The public event collection is temporarily unavailable.",
    500,
  )
}

export async function GET(request: Request): Promise<Response> {
  let parsed
  try {
    parsed = parsePublicEventsCollectionRequest(request.url)
  } catch (error) {
    return errorResponse(error)
  }

  const cursor = parsed.cursor
    ? decodePublicEventsCursor(parsed.cursor, {
        locale: parsed.locale,
        from: parsed.from,
        to: parsed.to,
        includeInternal: parsed.includeInternal,
      })
    : null
  if (parsed.cursor && !cursor) {
    return invalidRequest(
      "cursor is malformed, expired, or does not match the request parameters.",
    )
  }

  try {
    const result = await fetchPublicEventSet({
      locale: parsed.locale,
      from: parsed.from,
      to: parsed.to,
      includeInternal: parsed.includeInternal,
    })
    const occurrences = result.occurrences
    let pageStart = 0

    if (cursor) {
      pageStart = occurrences.findIndex(
        occurrence => comparePublicOccurrenceToKey(occurrence, cursor.last) > 0,
      )
      if (pageStart === -1) pageStart = occurrences.length
    }

    const pageOccurrences: PublicOccurrence[] = parsed.paginated
      ? occurrences.slice(pageStart, pageStart + PAGE_SIZE)
      : occurrences
    const nextOccurrence = parsed.paginated
      ? occurrences[pageStart + PAGE_SIZE]
      : undefined
    const nextCursor = nextOccurrence
      ? encodePublicEventsCursor(pageOccurrences[pageOccurrences.length - 1]!, {
          locale: parsed.locale,
          from: parsed.from,
          to: parsed.to,
          includeInternal: parsed.includeInternal,
        })
      : null
    const siteUrl = resolveSiteUrl()
    const body = publicCollectionResponseSchema.parse({
      data: pageOccurrences.map(occurrence =>
        serializePublicOccurrence(occurrence, {
          siteUrl,
          locale: parsed.locale,
        }),
      ),
      meta: {
        locale: parsed.locale,
        from: parsed.from,
        to: parsed.to,
        count: pageOccurrences.length,
        total: occurrences.length,
        paginated: parsed.paginated,
      },
      links: {
        self: publicEventsUrl(siteUrl, parsed),
        next: nextCursor ? publicEventsUrl(siteUrl, parsed, nextCursor) : null,
      },
    })

    return publicApiJsonResponse(body)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function HEAD(request: Request): Promise<Response> {
  return publicApiHeadResponse(await GET(request))
}

export function OPTIONS(): Response {
  return publicApiOptionsResponse()
}
