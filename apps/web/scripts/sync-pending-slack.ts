import { importClient } from "@/features/events/integrations/ticketco/importer"
import {
  previewPendingRequests,
  syncPendingRequests,
} from "@/features/events/server/pending-slack"

const dryRun = process.argv.includes("--dry-run")

;(dryRun
  ? previewPendingRequests(importClient()).then(report => ({
      dryRun: true,
      ...report,
    }))
  : syncPendingRequests(importClient())
)
  .then(report => {
    process.stdout.write(`${JSON.stringify(report)}\n`)
    if ("failed" in report && report.failed) process.exitCode = 1
  })
  .catch(() => {
    process.stderr.write(
      "Pending Slack sync failed. Check Sanity and #nettside webhook configuration.\n",
    )
    process.exitCode = 1
  })
