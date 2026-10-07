import { createHash } from "node:crypto"

import { createClient } from "next-sanity"

import { PLACEMENT_TRACKING_START } from "@/features/event-statistics/domain/statistics"
import { apiVersion, dataset, projectId } from "@/lib/sanity/env"

const USAGE = `events:backfill:placements — estimate fremhevet placements before tracking

USAGE
  npm run events:backfill:placements -- --slug <slug>          dry run
  npm run events:backfill:placements -- --slug <slug> --send   capture to PostHog

Placement impressions were first recorded on ${PLACEMENT_TRACKING_START}. For an
event's promotion periods that ended before then, this assumes:
  - every front-page session in the period saw the event fremhevet, and
  - every view of the event's page in the period came from that placement.

It captures one event_placement_viewed per such session and one
event_placement_clicked per such page view, under the original visitor and
session, marked backfilled=true. Event uuids derive from the source events, and
the script refuses to run twice for the same event.

Requires SANITY_API_READ_TOKEN, POSTHOG_QUERY_API_KEY, POSTHOG_QUERY_PROJECT_ID
(or POSTHOG_CLI_PROJECT_ID) and, with --send, NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN.`

const BACKFILL_VERSION = "assume-all-2026-10"
const UUID_NAMESPACE = "9b5c7a52-6d0e-4f0b-9a55-2f4f3c6b1d7e"
const HOME_PATH = "^/(nb|en)?/?$"
const OWN_HOST = "(^|[.])samfunnetibergen[.]no$"

type Period = { from: string; until: string }
type Row = Record<string, unknown>

const sanity = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
  token: process.env.SANITY_API_READ_TOKEN,
})

function required(name: string, ...fallbacks: string[]) {
  for (const key of [name, ...fallbacks]) {
    const value = process.env[key]?.trim()
    if (value) return value
  }
  throw new Error(`${name} is required`)
}

const hogqlString = (value: string) =>
  `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`
const hogqlTime = (iso: string) =>
  `toDateTime(${hogqlString(new Date(iso).toISOString().slice(0, 19).replace("T", " "))}, 'UTC')`

async function hogql<T extends Row>(query: string): Promise<T[]> {
  const host = (
    process.env.POSTHOG_QUERY_HOST?.trim() || "https://eu.posthog.com"
  ).replace(/\/+$/, "")
  const project = required("POSTHOG_QUERY_PROJECT_ID", "POSTHOG_CLI_PROJECT_ID")
  const response = await fetch(`${host}/api/projects/${project}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${required("POSTHOG_QUERY_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "backfill-promotion-placements",
      query: { kind: "HogQLQuery", query },
    }),
  })
  if (!response.ok) {
    throw new Error(
      `PostHog query ${response.status}: ${await response.text()}`,
    )
  }
  const payload = (await response.json()) as {
    results?: unknown[][]
    columns?: string[]
  }
  const columns = payload.columns ?? []
  return (payload.results ?? []).map(
    row => Object.fromEntries(columns.map((c, i) => [c, row[i]])) as T,
  )
}

/** Promotion periods from the document's published revisions. */
async function promotionPeriods(documentId: string): Promise<Period[]> {
  const token = required("SANITY_API_READ_TOKEN")
  const base = `https://${projectId}.api.sanity.io/v2021-06-07/data/history/${dataset}`
  const get = async (path: string) => {
    const response = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error(`Sanity history ${response.status}`)
    return response.text()
  }
  const transactions = (
    await get(
      `/transactions/${encodeURIComponent(documentId)}?excludeContent=true&limit=1000`,
    )
  )
    .split("\n")
    .filter(Boolean)
    .map(line => JSON.parse(line) as { id: string; timestamp: string })

  const periods: Array<{ from: string; until: string | null }> = []
  let promoted = false
  for (const transaction of transactions) {
    const body = await get(
      `/documents/${encodeURIComponent(documentId)}?revision=${encodeURIComponent(transaction.id)}`,
    )
    const [document] =
      (JSON.parse(body) as { documents?: { isPromoted?: unknown }[] })
        .documents ?? []
    const state = document?.isPromoted === true
    if (state === promoted) continue
    promoted = state
    if (state) periods.push({ from: transaction.timestamp, until: null })
    else if (periods.length)
      periods[periods.length - 1].until = transaction.timestamp
  }
  return periods.filter((period): period is Period => period.until !== null)
}

/** RFC 4122 version 5 uuid, so a source event always maps to the same copy. */
function uuidV5(name: string) {
  const namespace = Buffer.from(UUID_NAMESPACE.replace(/-/g, ""), "hex")
  const hash = createHash("sha1")
    .update(Buffer.concat([namespace, Buffer.from(name)]))
    .digest()
  hash[6] = (hash[6] & 0x0f) | 0x50
  hash[8] = (hash[8] & 0x3f) | 0x80
  const hex = hash.subarray(0, 16).toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const localeOf = (path: unknown) =>
  String(path ?? "").startsWith("/en") ? "en" : "nb"

async function main() {
  const args = process.argv.slice(2)
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${USAGE}\n`)
    return
  }
  const slug = args[args.indexOf("--slug") + 1]
  const send = args.includes("--send")
  if (!args.includes("--slug") || !slug || slug.startsWith("--")) {
    process.stderr.write(`--slug is required\n\n${USAGE}\n`)
    process.exitCode = 1
    return
  }

  const doc = await sanity.fetch<{
    _id: string
    title: string | null
    slug: string | null
    initialSlug: string | null
  } | null>(
    `*[_type == "arrangement" && (slug.current == $slug || initialSlug == $slug)][0]{
      _id,
      "title": localizedTitle[language == "nb" && defined(value) && value != ""][0].value,
      "slug": slug.current,
      initialSlug
    }`,
    { slug },
  )
  if (!doc) throw new Error(`No arrangement with slug ${slug}`)
  const eventId = doc.initialSlug ?? doc.slug ?? slug
  const title = doc.title ?? eventId

  const existing = await hogql<{ count: number }>(
    `SELECT count() AS count FROM events
       WHERE event IN ('event_placement_viewed', 'event_placement_clicked')
         AND timestamp >= toDateTime('2026-01-01 00:00:00', 'UTC')
         AND properties.backfilled = true
         AND properties.event_document_id = ${hogqlString(doc._id)}`,
  )
  if (Number(existing[0]?.count) > 0) {
    throw new Error(
      `${title} already has ${existing[0].count} backfilled placement events`,
    )
  }

  const trackingStart = new Date(`${PLACEMENT_TRACKING_START}T00:00:00+02:00`)
  const periods = (await promotionPeriods(doc._id)).filter(
    period => new Date(period.until) <= trackingStart,
  )
  if (periods.length === 0) {
    process.stdout.write(`${title}: no promotion ended before tracking began\n`)
    return
  }
  const within = periods
    .map(
      p =>
        `(timestamp >= ${hogqlTime(p.from)} AND timestamp < ${hogqlTime(p.until)})`,
    )
    .join(" OR ")

  const sessions = await hogql<{
    source_uuid: string
    source_distinct_id: string
    session: string | null
    ts: string
    url: string | null
    host: string | null
    path: string | null
  }>(
    `SELECT toString(argMin(uuid, timestamp)) AS source_uuid,
         argMin(distinct_id, timestamp) AS source_distinct_id,
         any(properties.$session_id) AS session,
         toString(min(timestamp)) AS ts,
         argMin(properties.$current_url, timestamp) AS url,
         argMin(properties.$host, timestamp) AS host,
         argMin(properties.$pathname, timestamp) AS path
       FROM events
       WHERE event = '$pageview' AND (${within})
         AND match(ifNull(properties.$pathname, ''), '${HOME_PATH}')
         AND match(ifNull(properties.$host, ''), '${OWN_HOST}')
       GROUP BY ifNull(properties.$session_id, toString(uuid))
       LIMIT 50000`,
  )
  const views = await hogql<{
    source_uuid: string
    source_distinct_id: string
    session: string | null
    ts: string
    url: string | null
    host: string | null
    path: string | null
  }>(
    `SELECT toString(uuid) AS source_uuid, distinct_id AS source_distinct_id,
         properties.$session_id AS session, toString(timestamp) AS ts,
         properties.$current_url AS url, properties.$host AS host,
         properties.$pathname AS path
       FROM events
       WHERE event = 'content_page_viewed' AND (${within})
         AND properties.content_type = 'arrangement'
         AND properties.content_id = ${hogqlString(doc._id)}
       LIMIT 50000`,
  )

  const placement = (method: string, source: (typeof views)[number]) => ({
    $session_id: source.session ?? undefined,
    $current_url: source.url ?? undefined,
    $host: source.host ?? undefined,
    $pathname: source.path ?? undefined,
    $lib: "backfill",
    $process_person_profile: false,
    event_id: eventId,
    event_document_id: doc._id,
    event_slug: doc.slug ?? eventId,
    event_title: title,
    surface: "home-promoted",
    placement_name: "Frontpage — promoted",
    summary: `${title} · Frontpage — promoted`,
    position: null,
    locale: localeOf(source.path),
    is_promoted: true,
    promotion_placement: "legacy",
    promotion_order: null,
    occurrence_date: null,
    placement_id: null,
    tracking_version: 2,
    backfilled: true,
    backfill_version: BACKFILL_VERSION,
    backfill_method: method,
    backfill_source_uuid: source.source_uuid,
  })
  const toIso = (ts: string, offsetMs = 0) =>
    new Date(
      new Date(`${ts.replace(" ", "T")}Z`).getTime() + offsetMs,
    ).toISOString()

  const batch = [
    ...sessions.map(source => ({
      event: "event_placement_viewed",
      uuid: uuidV5(`viewed:${source.source_uuid}`),
      distinct_id: source.source_distinct_id,
      timestamp: toIso(source.ts),
      properties: placement("every front-page session saw it", source),
    })),
    // A click comes just before the page view it led to.
    ...views.map(source => ({
      event: "event_placement_clicked",
      uuid: uuidV5(`clicked:${source.source_uuid}`),
      distinct_id: source.source_distinct_id,
      timestamp: toIso(source.ts, -1000),
      properties: placement("every event page view came from it", source),
    })),
  ]

  process.stdout.write(
    [
      `${title} (${doc._id})`,
      ...periods.map(p => `  promoted ${p.from} → ${p.until}`),
      `  ${sessions.length} front-page sessions → event_placement_viewed`,
      `  ${views.length} event page views → event_placement_clicked`,
      send ? "Sending…" : "Dry run; pass --send to capture.",
      "",
    ].join("\n"),
  )
  if (!send) return

  const captureHost = (
    process.env.NEXT_PUBLIC_POSTHOG_CAPTURE_HOST?.trim() ||
    "https://eu.i.posthog.com"
  ).replace(/\/+$/, "")
  const token = required("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN")
  for (let index = 0; index < batch.length; index += 500) {
    const response = await fetch(`${captureHost}/batch/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: token,
        historical_migration: true,
        batch: batch.slice(index, index + 500),
      }),
    })
    if (!response.ok) {
      throw new Error(
        `PostHog capture ${response.status}: ${await response.text()}`,
      )
    }
  }
  process.stdout.write(`Captured ${batch.length} events.\n`)
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`)
  process.exitCode = 1
})
