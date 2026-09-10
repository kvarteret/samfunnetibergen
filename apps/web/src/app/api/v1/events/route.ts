import {
  publicApiConditionalJsonResponse,
  publicApiErrorResponse,
  publicApiHeadResponse,
  publicApiOptionsResponse,
} from "@/features/events/api/http"
import {
  InvalidPublicEventsRequest,
  parsePublicEventsCollectionRequest,
} from "@/features/events/api/request"
import { publicCollectionResponseSchema } from "@/features/events/api/schemas"
import { serializePublicOccurrence } from "@/features/events/api/serializers"
import { fetchPublicEventSet } from "@/features/events/server/public-events"
import { emitOperationalEvent } from "@/lib/observability"
import { resolveSiteUrl } from "@/lib/site-url"

function invalidRequest(message: string): Response {
  return publicApiErrorResponse("invalid_request", message, 400)
}

function errorResponse(error: unknown): Response {
  if (error instanceof InvalidPublicEventsRequest) {
    return invalidRequest(error.message)
  }

  emitOperationalEvent("public.events.fetch.failed", {
    outcome: "failure",
    failure_stage: "fetch_or_serialize",
    error_category: error instanceof Error ? error.name : "unknown",
  })
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

  try {
    const result = await fetchPublicEventSet({
      locale: parsed.locale,
      from: parsed.from,
      to: parsed.to,
      includeInternal: parsed.includeInternal,
    })
    const occurrences = result.occurrences
    const siteUrl = resolveSiteUrl()
    const body = publicCollectionResponseSchema.parse({
      data: occurrences.map(occurrence =>
        serializePublicOccurrence(occurrence, {
          siteUrl,
          locale: parsed.locale,
        }),
      ),
      meta: {
        locale: parsed.locale,
        from: parsed.from,
        to: parsed.to,
      },
    })

    return publicApiConditionalJsonResponse(request, body)
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
