import { existsSync } from "node:fs"
import { isAbsolute, relative } from "node:path"
import { getCliClient } from "sanity/cli"

const client = getCliClient({ apiVersion: "2026-07-29" })
const write = process.env.SANITY_MIGRATION_WRITE === "1"
const backupPath = process.env.SANITY_BACKUP_PATH

type CleanupDocument = {
  _id: string
  _type: "arrangement" | "eventTaxonomyGroup" | "eventType"
  fields: string[]
}

const cleanupQuery = `*[
  (_type == "arrangement" && (
    defined(language) ||
    defined(adminNote) ||
    (eventKind == "festivalParent" && defined(dates))
  )) ||
  (_type == "eventTaxonomyGroup" && (defined(slug) || defined(isActive))) ||
  (_type == "eventType" && (defined(slug) || defined(description)))
] {
  _id,
  _type,
  "fields": [
    select(defined(language) => "language"),
    select(defined(adminNote) => "adminNote"),
    select(
      _type == "arrangement" &&
      eventKind == "festivalParent" &&
      defined(dates) => "dates"
    ),
    select(_type == "eventTaxonomyGroup" && defined(slug) => "slug"),
    select(_type == "eventTaxonomyGroup" && defined(isActive) => "isActive"),
    select(_type == "eventType" && defined(slug) => "slug"),
    select(_type == "eventType" && defined(description) => "description")
  ][defined(@)]
}`

function assertExternalBackup() {
  if (!write) return
  if (!backupPath || !isAbsolute(backupPath) || !existsSync(backupPath)) {
    throw new Error(
      "Write mode requires SANITY_BACKUP_PATH pointing to an existing absolute dataset export.",
    )
  }
  const fromRepository = relative(process.cwd(), backupPath)
  if (!fromRepository.startsWith("..")) {
    throw new Error(
      "SANITY_BACKUP_PATH must be outside the repository so cleanup cannot remove the recovery copy.",
    )
  }
}

function summarize(documents: CleanupDocument[]) {
  const counts = new Map<string, number>()
  for (const document of documents) {
    for (const field of document.fields) {
      const key = `${document._type}.${field}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  for (const [key, count] of [...counts].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    console.log(`${key}: ${count}`)
  }
}

async function main() {
  assertExternalBackup()
  const documents = await client.fetch<CleanupDocument[]>(
    cleanupQuery,
    {},
    {
      perspective: "raw",
    },
  )
  const eventPageReferences = await client.fetch<string[]>(
    '*[references("eventsPage")]._id',
    {},
    { perspective: "raw" },
  )
  const eventPageIds = await client.fetch<string[]>(
    '*[_id in ["eventsPage", "drafts.eventsPage"]]._id',
    {},
    { perspective: "raw" },
  )

  console.log(write ? "WRITE MODE" : "DRY RUN — nothing will be written")
  console.log(`documents with retired fields: ${documents.length}`)
  summarize(documents)
  console.log(`eventsPage documents: ${eventPageIds.length}`)
  console.log(`incoming eventsPage references: ${eventPageReferences.length}`)

  if (eventPageReferences.length > 0) {
    console.log("eventsPage will not be deleted. Convert these documents:")
    for (const id of eventPageReferences) console.log(`  ${id}`)
  }
  if (!write) return

  for (let offset = 0; offset < documents.length; offset += 50) {
    const transaction = client.transaction()
    for (const document of documents.slice(offset, offset + 50)) {
      transaction.patch(document._id, patch => patch.unset(document.fields))
    }
    await transaction.commit()
  }

  if (eventPageReferences.length === 0 && eventPageIds.length > 0) {
    const transaction = client.transaction()
    for (const id of eventPageIds) transaction.delete(id)
    await transaction.commit()
  }

  console.log("Cleanup applied. Rerun dry mode and expect zero changes.")
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
