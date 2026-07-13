import { getCliClient } from "sanity/cli"

import { migrateUsefulInfoEditorialSections } from "../src/studio/migrations/nyttigInfo"

const write = process.env.SANITY_MIGRATION_WRITE === "1"
const client = getCliClient({ apiVersion: "2025-02-19" })
const documentTypes = ["usefulInfoPage", "roomsPage", "groupsPage"]

async function main() {
  const documents = await client.fetch<
    Array<{
      _id: string
      _type: string
      sections?: Array<Record<string, unknown>>
    }>
  >(`*[_type in $types && defined(sections)]{ _id, _type, sections }`, {
    types: documentTypes,
  })

  if (documents.length === 0) {
    console.log("No documents with editorial sections found")
    return
  }

  let changedCount = 0

  for (const document of documents) {
    const migration = migrateUsefulInfoEditorialSections(document)
    if (!migration.changed) {
      console.log(`${document._id}.sections already migrated`)
      continue
    }

    changedCount += 1
    console.log(
      `${write ? "WRITE" : "DRY RUN"} migrate ${document._id}.sections to Portable Text`,
    )

    if (write) {
      await client
        .patch(document._id)
        .set({ sections: migration.sections })
        .commit()
    }
  }

  if (changedCount === 0) {
    console.log("All editorial sections already migrated")
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
