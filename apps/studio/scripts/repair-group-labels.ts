import { getCliClient } from "sanity/cli"

// The i18n migration wrote some group label items without the plugin's item
// type, which breaks the label input. Dry run by default; pass --apply.
const ITEM_TYPE = "internationalizedArrayStudentGroupLabelValueValue"
const client = getCliClient({ apiVersion: "2025-02-19" }).withConfig({
  perspective: "raw",
})
const apply = process.argv.includes("--apply")

async function main() {
  const documents = await client.fetch<
    Array<{ _id: string; _rev: string; keys: string[] }>
  >(
    `*[_type == "studentGroup" && count(localizedLabels[_type != $type]) > 0]{
      _id, _rev, "keys": localizedLabels[_type != $type]._key
    }`,
    { type: ITEM_TYPE },
  )
  console.table(documents.map(({ _id, keys }) => ({ _id, items: keys.length })))
  if (!apply || documents.length === 0) {
    console.log(apply ? "Nothing to repair." : "Dry run. Re-run with --apply.")
    return
  }
  const transaction = client.transaction()
  for (const document of documents) {
    transaction.patch(document._id, patch =>
      patch
        .ifRevisionId(document._rev)
        .set(
          Object.fromEntries(
            document.keys.map(key => [
              `localizedLabels[_key=="${key}"]._type`,
              ITEM_TYPE,
            ]),
          ),
        ),
    )
  }
  await transaction.commit()
  console.log(`Repaired ${documents.length} documents.`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
