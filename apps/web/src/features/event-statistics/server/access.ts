import "server-only"

import { cookies } from "next/headers"
import { z } from "zod"

import { injectActiveTraceContext } from "@/lib/observability"

/**
 * Access to /arrangementer/statistikk is decided by Kvarteret Personal.
 *
 * Personal sets its `kvarteret_session` cookie on `.samfunnetibergen.no`
 * (`SESSION_COOKIE_DOMAIN`), so the browser sends it here too. The website
 * forwards only that cookie to Personal's `/api/v1/me/statistikk-tilgang`,
 * which answers with the viewer's role and Gruppeadmin groups. `groups: null`
 * means every arrangement (Admin).
 *
 * `next dev` cannot share a cookie with Personal, so local development grants
 * Admin access by default. Set `STATISTICS_DEV_GROUPS=slug,slug` to preview
 * the Gruppeadmin view instead.
 */

const PERSONAL_SESSION_COOKIE =
  process.env.PERSONAL_SESSION_COOKIE_NAME?.trim() || "kvarteret_session"

const viewerSchema = z.object({
  name: z.string(),
  role: z.enum(["Admin", "Gruppeadmin"]),
  groups: z
    .array(z.object({ slug: z.string().min(1), name: z.string() }))
    .nullable(),
})

export type StatisticsViewer = z.infer<typeof viewerSchema>

export type StatisticsAccess =
  | { status: "granted"; viewer: StatisticsViewer; local: boolean }
  | { status: "login-required" }
  | { status: "forbidden" }
  | { status: "unavailable" }

export function personalBaseUrl(): string {
  return (
    process.env.PERSONAL_APP_BASE_URL?.trim() ||
    "https://personal.samfunnetibergen.no"
  ).replace(/\/+$/, "")
}

/** Personal logs the viewer in, then sends them back via its /statistikk. */
export function personalLoginUrl(): string {
  return `${personalBaseUrl()}/login?next=/statistikk`
}

function localDevelopmentViewer(): StatisticsViewer | null {
  if (process.env.NODE_ENV !== "development") return null
  const groups = process.env.STATISTICS_DEV_GROUPS?.split(",")
    .map(slug => slug.trim())
    .filter(Boolean)
  return groups?.length
    ? {
        name: "Lokal utvikler",
        role: "Gruppeadmin",
        groups: groups.map(slug => ({ slug, name: slug })),
      }
    : { name: "Lokal utvikler", role: "Admin", groups: null }
}

export async function resolveStatisticsAccess(): Promise<StatisticsAccess> {
  const local = localDevelopmentViewer()
  if (local) return { status: "granted", viewer: local, local: true }

  const session = (await cookies()).get(PERSONAL_SESSION_COOKIE)?.value
  if (!session) return { status: "login-required" }

  const headers: Record<string, string> = {
    Accept: "application/json",
    Cookie: `${PERSONAL_SESSION_COOKIE}=${session}`,
  }
  injectActiveTraceContext(headers)
  try {
    const response = await fetch(
      `${personalBaseUrl()}/api/v1/me/statistikk-tilgang`,
      { headers, cache: "no-store", signal: AbortSignal.timeout(5000) },
    )
    if (response.status === 401) return { status: "login-required" }
    if (response.status === 403) return { status: "forbidden" }
    if (!response.ok) return { status: "unavailable" }
    const parsed = viewerSchema.safeParse(await response.json())
    return parsed.success
      ? { status: "granted", viewer: parsed.data, local: false }
      : { status: "unavailable" }
  } catch {
    return { status: "unavailable" }
  }
}
