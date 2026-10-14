import { getCliClient } from "sanity/cli"
import {
  buildGroupRecruitmentPatch,
  type GroupRecruitmentDocument,
} from "../src/studio/migrations/groupRecruitment"

// This is an explicit intake reset, not an ongoing synchronization job.
// Dry run by default; pass --apply to change published groups and their drafts.
const client = getCliClient({ apiVersion: "2025-02-19" }).withConfig({
  perspective: "raw",
})

async function main() {
  const documents = await client.fetch<
    Array<GroupRecruitmentDocument & { _id: string; _rev: string }>
  >(`*[_type == "studentGroup"]{_id, _rev, slug, applicationStatus}`)
  const patches = documents
    .map(document => ({ document, set: buildGroupRecruitmentPatch(document) }))
    .filter(({ set }) => Object.keys(set).length > 0)
  console.table(
    patches.map(({ document, set }) => ({
      _id: document._id,
      before: document.applicationStatus ?? "unset",
      after: set.applicationStatus,
    })),
  )
  if (!process.argv.includes("--apply") || patches.length === 0) {
    console.log(
      patches.length ? "Dry run. Re-run with --apply." : "Nothing to preset.",
    )
    return
  }
  const transaction = client.transaction()
  for (const { document, set } of patches) {
    transaction.patch(document._id, patch =>
      patch.ifRevisionId(document._rev).set(set),
    )
  }
  await transaction.commit()
  console.log(`Preset recruitment for ${patches.length} documents.`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
