import { createHash } from "node:crypto"
import { load } from "cheerio"
import { z } from "zod"

export const SEARCH_URL = "https://ticketco.events/no/nb?pattern=kvarter"
const eventSchema = z
  .object({
    "@type": z.literal("Event"),
    name: z.string(),
    url: z.string(),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    image: z.string().optional(),
    location: z.object({ name: z.string().optional() }).optional(),
    organizer: z.object({ name: z.string().optional() }).optional(),
  })
  .passthrough()
export type TicketCoEvent = z.infer<typeof eventSchema>

export function canonicalTicketUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (
      url.protocol !== "https:" ||
      url.port ||
      url.username ||
      url.password ||
      !/^(?:[a-z0-9-]+\.)?ticketco\.events$/.test(url.hostname)
    )
      return null
    const match = /^\/no\/(?:nb|en)\/e\/([^/]+)\/?$/.exec(url.pathname)
    if (!match) return null
    return `https://${url.hostname}/no/nb/e/${match[1]}`
  } catch {
    return null
  }
}

export function ticketDocumentId(url: string): string {
  const canonical = canonicalTicketUrl(url)
  if (!canonical) throw new Error("Invalid TicketCo event URL")
  return `ticketco-${createHash("sha256").update(canonical).digest("hex")}`
}

export function parseListing(html: string): {
  events: TicketCoEvent[]
  next: string | null
} {
  const $ = load(html)
  const events = new Map<string, TicketCoEvent>()
  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (!value || typeof value !== "object") return
    const parsed = eventSchema.safeParse(value)
    if (parsed.success) {
      const url = canonicalTicketUrl(parsed.data.url)
      if (url) events.set(url, { ...parsed.data, url })
    }
    const graph = (value as Record<string, unknown>)["@graph"]
    if (graph) visit(graph)
  }
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      visit(JSON.parse($(el).text()))
    } catch {
      /* Ignore unrelated broken metadata. */
    }
  })
  const nextHref = $('a[rel="next"]').attr("href")
  let next: string | null = null
  if (nextHref) {
    const url = new URL(nextHref, SEARCH_URL)
    if (
      url.origin === "https://ticketco.events" &&
      url.pathname === "/no/nb" &&
      url.searchParams.get("pattern") === "kvarter"
    )
      next = url.href
  }
  return { events: [...events.values()], next }
}

export function pageText(html: string): string {
  const $ = load(html)
  $("script, style, nav, footer, header").remove()
  $("input, select, textarea, button").remove()
  return $("body")
    .text()
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim()
    .slice(0, 60000)
}

export function pageImage(html: string): string | undefined {
  return load(html)('meta[property="og:image"]').attr("content")
}

export function approvedImageUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      url.protocol === "https:" &&
      !url.port &&
      !url.username &&
      !url.password &&
      [
        "tuploads.s3.amazonaws.com",
        "tuploads.s3.eu-west-1.amazonaws.com",
      ].includes(url.hostname)
    )
  } catch {
    return false
  }
}

export async function fetchBounded(
  url: string,
  maxBytes = 2_000_000,
): Promise<Response> {
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(30000),
    headers: {
      "user-agent": "SamfunnetBot/1.0 (+https://samfunnetibergen.no)",
      accept: "text/html,application/json,image/*",
    },
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`Source HTTP ${response.status}`)
  const reader = response.body?.getReader()
  if (!reader) throw new Error("Empty source response")
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      throw new Error("Source exceeds size limit")
    }
    chunks.push(value)
  }
  return new Response(Buffer.concat(chunks), { headers: response.headers })
}

export async function discoverEvents(): Promise<TicketCoEvent[]> {
  const events = new Map<string, TicketCoEvent>()
  const visited = new Set<string>()
  let url: string | null = SEARCH_URL
  while (url) {
    if (visited.has(url)) throw new Error("TicketCo pagination loop")
    if (visited.size >= 25) throw new Error("TicketCo pagination limit reached")
    visited.add(url)
    const page = parseListing(await (await fetchBounded(url)).text())
    for (const event of page.events) events.set(event.url, event)
    url = page.next
  }
  if (!events.size)
    throw new Error("No TicketCo events found; source may have changed")
  return [...events.values()]
}
