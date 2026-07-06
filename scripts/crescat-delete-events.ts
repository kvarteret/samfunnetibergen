/**
 * Delete Crescat event requests (e.g., [SLETT MEG] test entries).
 *
 * Requires a logged-in Crescat session. Set these env vars (grab from
 * browser DevTools → Application → Cookies on app.crescat.io):
 *
 *   CRESCAT_TOKEN       crescat_token cookie value (URL-encoded)
 *   CRESCAT_SESSION     crescat_session cookie value (URL-encoded)
 *   CRESCAT_XSRF        XSRF-TOKEN cookie value (URL-encoded)
 *
 * Usage:
 *   npm run crescat:cleanup             List [SLETT MEG] entries
 *   npm run crescat:cleanup -- <ids>    Delete specific IDs
 *   npm run crescat:cleanup -- --all    Delete ALL [SLETT MEG] entries
 */

const BASE_URL = "https://app.crescat.io"
const GROUP_ID = "77" // studentersamfunnet-i-bergen
const UA =
  "Mozilla/5.0 (compatible; SamfunnetBot/1.0; +https://samfunnetibergen.no)"

interface EventRequest {
  id: number
  name: string
  start: string
  end: string
  request_by_name: string
  request_by_email: string
  created_at: string
  status: string
  reportable_status: string
}

// ── Auth ────────────────────────────────────────────────────────────────────

function getSession(): { cookie: string; token: string } {
  const crescatToken = process.env.CRESCAT_TOKEN
  const crescatSession = process.env.CRESCAT_SESSION
  const xsrfRaw = process.env.CRESCAT_XSRF

  if (!crescatToken || !crescatSession || !xsrfRaw) {
    throw new Error(
      "Missing env vars: CRESCAT_TOKEN, CRESCAT_SESSION, CRESCAT_XSRF\n" +
        "Get them from browser DevTools → Application → Cookies on app.crescat.io",
    )
  }

  return {
    token: decodeURIComponent(xsrfRaw),
    cookie: `crescat_token=${crescatToken}; XSRF-TOKEN=${xsrfRaw}; crescat_session=${crescatSession}`,
  }
}

// ── API calls ───────────────────────────────────────────────────────────────

async function listPendingRequests(session: {
  cookie: string
  token: string
}): Promise<EventRequest[]> {
  const params = new URLSearchParams({
    model_type: "App\\Group",
    model_id: GROUP_ID,
    type: "pending",
  })

  const res = await fetch(
    `${BASE_URL}/api/event-requests?${params.toString()}`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "x-requested-with": "XMLHttpRequest",
        "x-xsrf-token": session.token,
        cookie: session.cookie,
        referer: `${BASE_URL}/groups/studentersamfunnet-i-bergen`,
      },
    },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`List failed: HTTP ${res.status} ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as { data?: EventRequest[] }
  return json.data ?? []
}

async function deleteEventRequest(
  session: { cookie: string; token: string },
  id: number,
): Promise<boolean> {
  const url = `${BASE_URL}/api/event-requests/${id}?send_email=false&delete_event=true`
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      accept: "application/json, text/plain, */*",
      "x-requested-with": "XMLHttpRequest",
      "x-xsrf-token": session.token,
      cookie: session.cookie,
      referer: `${BASE_URL}/groups/studentersamfunnet-i-bergen`,
    },
  })

  if (res.ok) return true
  const text = await res.text().catch(() => "")
  process.stderr.write(
    `  ✗ Failed ${id}: HTTP ${res.status} ${text.slice(0, 200)}\n`,
  )
  return false
}

function findSlettMeg(entries: EventRequest[]): EventRequest[] {
  return entries.filter(e => e.name.startsWith("[SLETT MEG]"))
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`USAGE
  npm run crescat:cleanup                 List [SLETT MEG] pending entries
  npm run crescat:cleanup -- <ids...>     Delete specific IDs
  npm run crescat:cleanup -- --all        Delete ALL [SLETT MEG] pending entries

Requires CRESCAT_TOKEN + CRESCAT_SESSION + CRESCAT_XSRF env vars.\n`)
    return
  }

  const session = getSession()

  // ── Delete ALL ──────────────────────────────────────────────────────
  if (args.includes("--all")) {
    process.stdout.write("Fetching pending requests...\n")
    const all = await listPendingRequests(session)
    const entries = findSlettMeg(all)

    if (entries.length === 0) {
      process.stdout.write("No [SLETT MEG] entries found.\n")
      return
    }

    process.stdout.write(`Found ${entries.length} entries:\n`)
    for (const e of entries) {
      process.stdout.write(`  #${e.id}  ${e.name}  (${e.start})\n`)
    }

    process.stdout.write(`\nDeleting ${entries.length} entries...\n`)
    let deleted = 0
    for (const e of entries) {
      if (await deleteEventRequest(session, e.id)) {
        process.stdout.write(`  ✓ ${e.id}\n`)
        deleted++
      }
    }
    process.stdout.write(`Done. Deleted ${deleted}/${entries.length}.\n`)
    return
  }

  // ── Delete specific IDs ─────────────────────────────────────────────
  if (args.length > 0) {
    const ids = args.map(Number).filter(n => !Number.isNaN(n))
    if (ids.length === 0) {
      process.stderr.write("No valid numeric IDs provided.\n")
      process.exit(1)
    }
    process.stdout.write(`Deleting ${ids.length} entries: ${ids.join(", ")}\n`)
    let deleted = 0
    for (const id of ids) {
      if (await deleteEventRequest(session, id)) {
        process.stdout.write(`  ✓ ${id}\n`)
        deleted++
      }
    }
    process.stdout.write(`Done. Deleted ${deleted}/${ids.length}.\n`)
    return
  }

  // ── List ────────────────────────────────────────────────────────────
  process.stdout.write("Fetching pending requests...\n")
  const all = await listPendingRequests(session)
  const entries = findSlettMeg(all)

  if (entries.length === 0) {
    process.stdout.write("No [SLETT MEG] entries found.\n")
    return
  }

  process.stdout.write(`Found ${entries.length}:\n`)
  for (const e of entries) {
    process.stdout.write(
      `  #${String(e.id).padStart(5)}  ${e.name.padEnd(55)} ${e.start.slice(0, 10)}\n`,
    )
  }
  process.stdout.write(
    `\nRun 'npm run crescat:cleanup -- --all' to delete them all.\n`,
  )
}

main().catch(error => {
  process.stderr.write(`${(error as Error).message}\n`)
  process.exit(1)
})
