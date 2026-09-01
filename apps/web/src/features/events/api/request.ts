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
  cursor: string | null
  paginated: boolean
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

export function parseLocaleParam(params: URLSearchParams): AppLocale {
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
  const cursor = oneQueryValue(params, "cursor")
  const includeInternal = oneQueryValue(params, "includeInternal") === "true"
  const paginated = fromParam !== null || toParam !== null
  const from = parseDate(fromParam ?? today, "from")
  const to = toParam === null ? null : parseDate(toParam, "to")

  if (to !== null && from > to) {
    throw new InvalidPublicEventsRequest(
      "from must not be later than to for an inclusive date range.",
    )
  }
  if (cursor !== null && !paginated) {
    throw new InvalidPublicEventsRequest(
      "cursor is only valid when from or to is supplied.",
    )
  }

  return {
    locale,
    from,
    to,
    includeInternal,
    cursor,
    paginated,
  }
}

export function publicEventsUrl(
  siteUrl: string,
  request: PublicEventsCollectionRequest,
  cursor: string | null = request.cursor,
): string {
  const url = new URL(`${siteUrl.replace(/\/+$/, "")}/api/v1/events`)
  url.searchParams.set("locale", request.locale)
  if (request.paginated) {
    url.searchParams.set("from", request.from)
    if (request.to !== null) url.searchParams.set("to", request.to)
  }
  if (request.includeInternal) url.searchParams.set("includeInternal", "true")
  if (cursor !== null) url.searchParams.set("cursor", cursor)
  return url.toString()
}

export function parsePublicEventDetailRequest(requestUrl: string): {
  locale: AppLocale
  includeInternal: boolean
} {
  const params = new URL(requestUrl).searchParams
  return {
    locale: parseLocaleParam(params),
    includeInternal: oneQueryValue(params, "includeInternal") === "true",
  }
}
