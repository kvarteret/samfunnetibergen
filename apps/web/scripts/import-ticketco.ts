import {
  importClient,
  runTicketCoImport,
} from "@/features/events/integrations/ticketco/importer"

async function main() {
  const args = process.argv.slice(2)
  if (args.some(arg => !["--dry-run", "--force"].includes(arg)))
    throw new Error("Usage: events:import:ticketco [--dry-run] [--force]")
  if (
    !(process.env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_BASE_URL) ||
    !process.env.AZURE_OPENAI_API_KEY
  )
    throw new Error("Configure AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY")
  const report = await runTicketCoImport(importClient(), {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
  })
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  if (report.failed.length) process.exitCode = 1
}
main().catch(() => {
  process.stderr.write(
    "TicketCo import failed. Check runtime credentials and source availability.\n",
  )
  process.exitCode = 1
})
