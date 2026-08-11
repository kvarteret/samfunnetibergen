import { existsSync } from "node:fs"
import { isAbsolute, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { getCliClient } from "sanity/cli"

import { buildArrangementStatusPatch } from "../src/studio/migrations/arrangementStatuses"

const client = getCliClient({ apiVersion: "2026-07-29" })
const write = process.env.SANITY_MIGRATION_WRITE === "1"
const backupPath = process.env.SANITY_BACKUP_PATH
const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url))

type ArrangementDocument = {
  _id: string
  _type: "arrangement"
  approvalStatus?: unknown
  eventStatus?: unknown
  submittedByEmail?: unknown
}

function assertExternalBackup() {
  if (!write) return
  if (!backupPath || !isAbsolute(backupPath) || !existsSync(backupPath)) {
    throw new Error(
      "Write mode requires SANITY_BACKUP_PATH pointing to an existing absolute dataset export.",
    )
  }
  const fromRepository = relative(repositoryRoot, backupPath)
  if (!fromRepository.startsWith("..")) {
    throw new Error(
      "SANITY_BACKUP_PATH must be outside the repository so the recovery copy is independent.",
    )
  }
}

async function main() {
  assertExternalBackup()
  const documents = await client.fetch<ArrangementDocument[]>(
    `*[_type == "arrangement"] {
      _id,
      _type,
      approvalStatus,
      eventStatus,
      submittedByEmail
    }`,
    {},
    { perspective: "raw" },
  )
  const patches = documents
    .map(document => ({
      document,
      values: buildArrangementStatusPatch(document),
    }))
    .filter(({ values }) => Object.keys(values).length > 0)

  console.log(write ? "WRITE MODE" : "DRY RUN — nothing will be written")
  console.log(`arrangements inspected: ${documents.length}`)
  console.log(`arrangements to normalize: ${patches.length}`)
  for (const { document, values } of patches) {
    console.log(`${write ? "WRITE" : "DRY RUN"} ${document._id}`, values)
  }

  if (!write) return
  for (let offset = 0; offset < patches.length; offset += 50) {
    const transaction = client.transaction()
    for (const { document, values } of patches.slice(offset, offset + 50)) {
      transaction.patch(document._id, patch => patch.set(values))
    }
    await transaction.commit()
  }

  console.log(`Applied ${patches.length} idempotent arrangement patches.`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
