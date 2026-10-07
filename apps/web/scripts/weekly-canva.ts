import { runWeekly, weeklyClient } from "@/features/weekly-canva/runner"

async function main() {
  const args = process.argv.slice(2)
  let monday: string | undefined
  let dryRun = false
  let scheduled = false
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") dryRun = true
    else if (args[i] === "--scheduled") scheduled = true
    else if (args[i] === "--week" && args[i + 1]) monday = args[++i]
    else
      throw new Error(
        "Usage: events:weekly:canva [--dry-run] [--scheduled] [--week YYYY-MM-DD]",
      )
  }
  if (scheduled && monday)
    throw new Error("Scheduled runs cannot override the week")
  const report = await runWeekly(weeklyClient(!dryRun), {
    monday,
    dryRun,
    scheduled,
  })
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}
main().catch((error: unknown) => {
  const message =
    error instanceof Error &&
    /^(Public event is missing a title or valid start time|Luna HTTP \d+|Luna response incomplete|Luna copy did not cover all events exactly once|Invalid Luna copy|Configure Azure Luna credentials|Invalid week date|Week date must be a Monday|Canva is not connected; run canva:connect)$/.test(
      error.message,
    )
      ? error.message
      : "Check configuration, Canva connection and saved job receipts; rerun to resume."
  process.stderr.write(`Weekly Canva generation failed: ${message}\n`)
  process.exitCode = 1
})
