import { type AppLocale } from "@/i18n/routing"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"

import { publicDateSchema, publicLocaleSchema } from "./schemas"

export class InvalidPublicEventsRequest extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidPublicEventsRequest"
  }
}

export type PublicEventsCollectionRequest = {
  locale: AppLocale
  from: string
  to: string | null
  includeInternal: boolean
}

function oneQueryValue(params: URLSearchParams, name: string): string | null {
  const values = params.getAll(name)
  if (values.length > 1) {
    throw new InvalidPublicEventsRequest(
      `The ${name} parameter may only be supplied once.`,
    )
  }
  return values[0] ?? null
}

function parseDate(value: string, name: string): string {
  const parsed = publicDateSchema.safeParse(value)
  if (!parsed.success) {
    throw new InvalidPublicEventsRequest(
      `${name} must be a real calendar date in YYYY-MM-DD format.`,
    )
  }
  return parsed.data
}

function parseLocaleParam(params: URLSearchParams): AppLocale {
  const value = oneQueryValue(params, "locale") ?? "nb"
  const parsed = publicLocaleSchema.safeParse(value)
  if (!parsed.success) {
    throw new InvalidPublicEventsRequest("locale must be nb or en.")
  }
  return parsed.data
}

export function parsePublicEventsCollectionRequest(
  requestUrl: string,
  today = getOsloDateString(),
): PublicEventsCollectionRequest {
  const params = new URL(requestUrl).searchParams
  const locale = parseLocaleParam(params)
  const fromParam = oneQueryValue(params, "from")
  const toParam = oneQueryValue(params, "to")

  for (const name of new Set(params.keys())) {
    if (
      ![
        "locale",
        "from",
        "to",
        // Internal-only opt-in for controlled server-side callers; it is
        // intentionally omitted from OpenAPI and public documentation.
        "includeInternal",
      ].includes(name)
    ) {
      throw new InvalidPublicEventsRequest(
        `Unsupported query parameter: ${name}.`,
      )
    }
  }

  const includeInternal = oneQueryValue(params, "includeInternal") === "true"
  const from = parseDate(fromParam ?? today, "from")
  const to = toParam === null ? null : parseDate(toParam, "to")

  if (to !== null && from > to) {
    throw new InvalidPublicEventsRequest(
      "from must not be later than to for an inclusive date range.",
    )
  }
  return {
    locale,
    from,
    to,
    includeInternal,
  }
}
