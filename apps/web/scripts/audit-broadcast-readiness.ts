import {
  addDuplicateTicketUrlInfo,
  assessBroadcastReadiness,
  type BroadcastReadinessErrorCode,
} from "@/features/events/integrations/broadcast-readiness"
import { fetchPublicEventSet } from "@/features/events/server/public-events-core"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"

const USAGE = `events:audit:broadcast — check Broadcast source-data completeness

USAGE
  npm run events:audit:broadcast -- --report-only
  npm run events:audit:broadcast

The report-only mode always exits successfully while editors repair incomplete
records. Release-gate mode exits 1 when a ticketed occurrence is not ready.`

async function main(): Promise<void> {
  const reportOnly = process.argv.slice(2).includes("--report-only")
  const args = process.argv.slice(2).filter(arg => arg !== "--report-only")
  if (args.some(arg => arg === "--help" || arg === "-h")) {
    process.stdout.write(`${USAGE}\n`)
    return
  }
  if (args.length > 0) {
    process.stderr.write(`Unknown argument: ${args[0]}\n\n${USAGE}\n`)
    process.exitCode = 1
    return
  }

  const { occurrences } = await fetchPublicEventSet({
    locale: "nb",
    from: getOsloDateString(),
    to: null,
  })
  const ticketed = occurrences.filter(occurrence => !occurrence.event.isFree)
  const siteUrl =
    process.env.EVENTS_PUBLIC_SITE_URL ?? "https://www.samfunnetibergen.no"
  const results = addDuplicateTicketUrlInfo(
    ticketed,
    ticketed.map(occurrence =>
      assessBroadcastReadiness(occurrence, { siteUrl, locale: "nb" }),
    ),
  )
  const issueCounts = new Map<BroadcastReadinessErrorCode, number>()
  for (const result of results) {
    for (const issue of result.issues) {
      issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1)
    }
  }

  const readyCount = results.filter(result => result.ready).length
  process.stdout.write("Broadcast source-data completeness report\n")
  process.stdout.write(`Ticketed occurrences: ${results.length}\n`)
  process.stdout.write(`Ready: ${readyCount}\n`)
  process.stdout.write("Issues:\n")
  if (issueCounts.size === 0) {
    process.stdout.write("  none\n")
  } else {
    for (const [issue, count] of issueCounts) {
      process.stdout.write(`  ${issue}: ${count}\n`)
    }
  }

  const incomplete = results.filter(result => !result.ready)
  if (incomplete.length > 0) {
    process.stdout.write("Incomplete occurrences:\n")
    for (const result of incomplete) {
      process.stdout.write(
        `  ${result.occurrenceId}\t${result.websiteUrl}\t${result.issues.join(",")}\n`,
      )
    }
  }

  const informational = results.filter(result => result.info.length > 0)
  if (informational.length > 0) {
    process.stdout.write("Informational occurrences:\n")
    for (const result of informational) {
      process.stdout.write(
        `  ${result.occurrenceId}\t${result.websiteUrl}\t${result.info.join(",")}\n`,
      )
    }
  }

  if (!reportOnly && incomplete.length > 0) process.exitCode = 1
}

main().catch(error => {
  process.stderr.write(`${(error as Error).message}\n`)
  process.exitCode = 1
})
