import { importClient } from "@/features/events/integrations/ticketco/importer"
import { syncPendingRequests } from "@/features/events/server/pending-slack"

syncPendingRequests(importClient())
  .then(report => {
    process.stdout.write(`${JSON.stringify(report)}\n`)
    if (report.failed) process.exitCode = 1
  })
  .catch(() => {
    process.stderr.write(
      "Pending Slack sync failed. Check Sanity and #nettside webhook configuration.\n",
    )
    process.exitCode = 1
  })
