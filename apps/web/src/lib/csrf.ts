/**
 * Same-origin gate for state-changing JSON/form endpoints. Next.js applies an
 * equivalent origin check to server actions automatically; plain route
 * handlers do not, so the form submit routes use this explicitly. See ADR 010.
 *
 * Browsers attach an Origin header to every POST. A cross-origin attacker
 * cannot forge it to our host (Origin is a forbidden header), so a mismatching
 * Origin is conclusive. Requests without an Origin (curl, server-to-server
 * callers, some non-browser clients) are not subject to browser CSRF and pass.
 * A cross-origin JSON POST is also stopped earlier by the CORS preflight
 * because the submit routes send no CORS allow headers.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }

  // Prefer the Host header (present in production and local dev). Fall back to
  // the request URL's host, which covers synthetic Request objects in tests.
  const requestHost = request.headers.get("host") ?? safeRequestUrlHost(request)
  return requestHost !== null && originHost === requestHost
}

function safeRequestUrlHost(request: Request): string | null {
  try {
    return new URL(request.url).host
  } catch {
    return null
  }
}
