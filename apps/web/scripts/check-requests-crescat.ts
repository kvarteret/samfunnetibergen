import { importClient } from "@/features/events/integrations/ticketco/importer"
import { scanPendingRequests } from "@/features/events/server/crescat-check"

const dryRun = process.argv.includes("--dry-run")
const verbose = process.argv.includes("--verbose")

scanPendingRequests(importClient(), { dryRun })
  .then(({ results, ...report }) => {
    process.stdout.write(`${JSON.stringify({ dryRun, ...report })}\n`)
    if (verbose)
      for (const check of results ?? [])
        process.stdout.write(
          `${check.status.padEnd(8)} ${check.arrangementId} ${check.dates
            .map(date => `${date.date}: ${date.reason}`)
            .join(" | ")}\n`,
        )
    if (report.failed) process.exitCode = 1
  })
  .catch(() => {
    process.stderr.write(
      "Crescat request check failed. Check Sanity configuration and Crescat availability.\n",
    )
    process.exitCode = 1
  })
