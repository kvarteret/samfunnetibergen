import {
  publicApiConditionalJsonResponse,
  publicApiErrorResponse,
  publicApiHeadResponse,
  publicApiOptionsResponse,
} from "@/features/events/api/http"
import {
  publicEventTaxonomySchema,
  publicLocaleSchema,
} from "@/features/events/api/schemas"
import { fetchPublicEventTaxonomy } from "@/features/events/server/public-taxonomy"
import type { AppLocale } from "@/i18n/routing"

function parseLocale(request: Request): AppLocale {
  const params = new URL(request.url).searchParams
  for (const name of params.keys()) {
    if (name !== "locale") {
      throw new Error(`Unsupported query parameter: ${name}.`)
    }
  }
  const values = params.getAll("locale")
  if (values.length > 1)
    throw new Error("The locale parameter may only be supplied once.")
  const parsed = publicLocaleSchema.safeParse(values[0] ?? "nb")
  if (!parsed.success) throw new Error("locale must be nb or en.")
  return parsed.data
}

export async function GET(request: Request): Promise<Response> {
  let locale: AppLocale
  try {
    locale = parseLocale(request)
  } catch (error) {
    return publicApiErrorResponse(
      "invalid_request",
      error instanceof Error ? error.message : "Invalid request.",
      400,
    )
  }

  try {
    const body = publicEventTaxonomySchema.parse(
      await fetchPublicEventTaxonomy(locale),
    )
    return publicApiConditionalJsonResponse(request, body)
  } catch (error) {
    console.error("[public-events-api] Failed to fetch event taxonomy", error)
    return publicApiErrorResponse(
      "internal_error",
      "The public event taxonomy is temporarily unavailable.",
      500,
    )
  }
}

export async function HEAD(request: Request): Promise<Response> {
  return publicApiHeadResponse(await GET(request))
}

export function OPTIONS(): Response {
  return publicApiOptionsResponse()
}
