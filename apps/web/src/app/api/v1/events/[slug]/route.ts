import {
  publicApiErrorResponse,
  publicApiConditionalJsonResponse,
  publicApiHeadResponse,
  publicApiOptionsResponse,
} from "@/features/events/api/http"
import {
  InvalidPublicEventsRequest,
  parsePublicEventDetailRequest,
} from "@/features/events/api/request"
import { publicDetailResponseSchema } from "@/features/events/api/schemas"
import { serializePublicEventDetail } from "@/features/events/api/serializers"
import { fetchPublicEventBySlug } from "@/features/events/server/public-events"
import { resolveSiteUrl } from "@/lib/site-url"

type EventDetailRouteContext = {
  params: Promise<{ slug: string }>
}

function errorResponse(error: unknown): Response {
  if (error instanceof InvalidPublicEventsRequest) {
    return publicApiErrorResponse("invalid_request", error.message, 400)
  }

  console.error("[public-events-api] Failed to fetch event detail", error)
  return publicApiErrorResponse(
    "internal_error",
    "The public event is temporarily unavailable.",
    500,
  )
}

export async function GET(
  request: Request,
  context: EventDetailRouteContext,
): Promise<Response> {
  let parsed
  try {
    parsed = parsePublicEventDetailRequest(request.url)
  } catch (error) {
    return errorResponse(error)
  }

  try {
    const { slug } = await context.params
    const result = await fetchPublicEventBySlug(
      slug,
      parsed.locale,
      parsed.includeInternal,
    )
    if (!result) {
      return publicApiErrorResponse(
        "not_found",
        "The requested public event was not found.",
        404,
      )
    }

    const siteUrl = resolveSiteUrl()
    const detail = serializePublicEventDetail(result.event, result.children, {
      siteUrl,
      locale: parsed.locale,
    })
    const body = publicDetailResponseSchema.parse({
      data: detail,
      meta: { locale: parsed.locale },
    })

    return publicApiConditionalJsonResponse(request, body)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function HEAD(
  request: Request,
  context: EventDetailRouteContext,
): Promise<Response> {
  return publicApiHeadResponse(await GET(request, context))
}

export function OPTIONS(): Response {
  return publicApiOptionsResponse()
}
