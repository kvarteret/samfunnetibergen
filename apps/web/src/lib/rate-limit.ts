import { headers } from "next/headers"

// Best-effort, dependency-free IP rate limiting for public, unauthenticated
// server actions. The store is a process-local Map, so on serverless/Fluid
// Compute it only limits within a single instance — this is cost/abuse
// hardening (paired with a honeypot), not a hard security boundary. Swap the
// store for a shared one (e.g. a marketplace KV) if stronger guarantees are
// needed.

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwardedFor = h.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }
  return h.get("x-real-ip")?.trim() || "unknown"
}

export type RateLimitOptions = {
  // Logical name of the action being limited; keeps separate buckets per action.
  name: string
  ip: string
  limit: number
  windowMs: number
}

// Returns true when the call is allowed, false when the limit is exceeded.
export function checkRateLimit({
  name,
  ip,
  limit,
  windowMs,
}: RateLimitOptions): boolean {
  const now = Date.now()
  pruneExpired(now)

  const key = `${name}:${ip}`
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= limit) return false

  buckets.set(key, { count: bucket.count + 1, resetAt: bucket.resetAt })
  return true
}

// Keeps the Map from growing unbounded with one-off IPs. Cheap because expired
// buckets are removed lazily on the next call after their window closes.
function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key)
  }
}
