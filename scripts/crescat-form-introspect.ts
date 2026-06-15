/**
 * Crescat form/room introspection CLI.
 *
 * Crescat publishes no API spec. This tool reads the live, public Crescat
 * endpoints so a human or an LLM can reconstruct our integration when the venue
 * changes a form or its rooms.
 *
 * Currently implemented (ExecPlan milestone 5 — rooms):
 *
 *   npm run crescat:introspect -- --rooms <calendarSlug>
 *       Print a calendar's /resources (the bookable room id→name list) as JSON.
 *
 *   npm run crescat:introspect -- --rooms-coverage
 *       For every calendar in ROOM_CALENDAR_SLUGS, list each Crescat room and
 *       whether a Sanity room carries that crescatRoomId. Informational; exit 0.
 *
 * The form-template modes (--save / --diff) are ExecPlan milestone 1.
 */

const BASE = "https://app.crescat.io/venue-access"
const UA =
  "Mozilla/5.0 (compatible; SamfunnetBot/1.0; +https://samfunnetibergen.no)"

// Mirrors src/lib/integrations/crescat/calendar.ts ROOM_CALENDAR_SLUGS. Kept as
// a literal here so the script runs under tsx without the app's path aliases.
const ROOM_CALENDARS = {
  standard: "studentersamfunnet-i-bergen-bookingkalender",
  privat: "studentersamfunnet-i-bergen-bookingkalender-privat",
  karaoke: "studentersamfunnet-i-bergen-bookinkalender-karaoke",
} as const

interface CrescatResource {
  id: number
  room_title: string | null
  title: string
}

async function fetchResources(
  calendarSlug: string,
): Promise<CrescatResource[]> {
  const res = await fetch(`${BASE}/${calendarSlug}/resources`, {
    headers: { accept: "application/json", "user-agent": UA },
  })
  if (!res.ok) {
    throw new Error(`GET ${calendarSlug}/resources -> HTTP ${res.status}`)
  }
  return (await res.json()) as CrescatResource[]
}

async function fetchSanityRoomIds(): Promise<Map<number, string>> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "mkjoahvv"
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production"
  const query =
    '*[_type == "room" && defined(crescatRoomId)]{crescatRoomId, "title": title}'
  const url =
    `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}` +
    `?query=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { accept: "application/json" } })
  if (!res.ok) {
    throw new Error(`Sanity query -> HTTP ${res.status}`)
  }
  const body = (await res.json()) as {
    result: { crescatRoomId: number; title: string | null }[]
  }
  return new Map(
    body.result.map(room => [room.crescatRoomId, room.title ?? "(uten navn)"]),
  )
}

async function runRooms(calendarSlug: string): Promise<void> {
  const resources = await fetchResources(calendarSlug)
  process.stdout.write(`${JSON.stringify(resources, null, 2)}\n`)
}

async function runCoverage(): Promise<void> {
  const sanityRooms = await fetchSanityRoomIds()
  for (const [label, slug] of Object.entries(ROOM_CALENDARS)) {
    process.stdout.write(`\n# ${label}  (${slug})\n`)
    let resources: CrescatResource[]
    try {
      resources = await fetchResources(slug)
    } catch (error) {
      process.stdout.write(`  ! ${(error as Error).message}\n`)
      continue
    }
    for (const room of resources) {
      const sanityTitle = sanityRooms.get(room.id)
      const mark = sanityTitle ? `in Sanity (${sanityTitle})` : "Crescat-only"
      process.stdout.write(
        `  ${String(room.id).padStart(5)}  ${room.title.padEnd(28)} ${mark}\n`,
      )
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const mode = args[0]

  if (mode === "--rooms") {
    const slug = args[1]
    if (!slug) {
      process.stderr.write("Usage: --rooms <calendarSlug>\n")
      process.exit(1)
    }
    await runRooms(slug)
    return
  }

  if (mode === "--rooms-coverage") {
    await runCoverage()
    return
  }

  process.stderr.write(
    "Usage:\n" +
      "  --rooms <calendarSlug>     print a calendar's /resources as JSON\n" +
      "  --rooms-coverage           list Crescat rooms vs Sanity coverage\n",
  )
  process.exit(1)
}

main().catch(error => {
  process.stderr.write(`${(error as Error).message}\n`)
  process.exit(1)
})
