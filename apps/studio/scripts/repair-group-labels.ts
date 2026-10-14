import { getCliClient } from "sanity/cli"
import {
  buildGroupLabelsPatch,
  type GroupLabelsDocument,
} from "../src/studio/migrations/groupLabels"

// Dry run by default; --apply repairs published documents and drafts without
// publishing unrelated draft edits. Revision guards reject concurrent changes.
const client = getCliClient({ apiVersion: "2025-02-19" }).withConfig({
  perspective: "raw",
})
const apply = process.argv.includes("--apply")

async function main() {
  const documents = await client.fetch<
    Array<GroupLabelsDocument & { _id: string; _rev: string }>
  >(`*[_type == "studentGroup"]{_id, _rev, slug, labels, localizedLabels}`)
  const patches = documents
    .map(document => ({ document, set: buildGroupLabelsPatch(document) }))
    .filter(({ set }) => Object.keys(set).length > 0)
  console.table(
    patches.map(({ document, set }) => ({
      _id: document._id,
      labels: set.localizedLabels
        ?.map(item => `${item.language}: ${item.value}`)
        .join("; "),
    })),
  )
  if (!apply || patches.length === 0) {
    console.log(apply ? "Nothing to repair." : "Dry run. Re-run with --apply.")
    return
  }
  const transaction = client.transaction()
  for (const { document, set } of patches) {
    transaction.patch(document._id, patch =>
      patch.ifRevisionId(document._rev).set(set),
    )
  }
  await transaction.commit()
  console.log(`Repaired ${patches.length} documents.`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
