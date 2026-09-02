const API_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=300"
const API_ERROR_CACHE_CONTROL = "private, no-store"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Content-Type, Origin",
}

export function publicApiErrorResponse(
  code: "invalid_request" | "not_found" | "internal_error",
  message: string,
  status: number,
): Response {
  return publicApiJsonResponse({ error: { code, message } }, status, {
    "Cache-Control": API_ERROR_CACHE_CONTROL,
  })
}

export function publicApiJsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": API_CACHE_CONTROL,
      ...CORS_HEADERS,
      ...headers,
    },
  })
}

export function publicApiOptionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      Allow: "GET, HEAD, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  })
}

export function publicApiHeadResponse(response: Response): Response {
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}
