import { getCliClient } from "sanity/cli"
import {
  findI18nIssues,
  missingCanonicalFields,
} from "../src/studio/migrations/i18n"

const write = process.env.SANITY_I18N_CLEANUP_WRITE === "1"
const confirmation = process.env.SANITY_I18N_CLEANUP_CONFIRM
const verbose = process.env.SANITY_I18N_CLEANUP_VERBOSE === "1"
const client = getCliClient({ apiVersion: "2025-02-19" })

const query = `*[
  !(_id in path("drafts.**")) &&
  _type in [
    "homePage", "roomsPage", "groupsPage", "usefulInfoPage", "sponsorsPage",
    "kontaktPage", "footer", "navbar", "linkInBio", "page", "room",
    "studentGroup", "arrangement", "eventType", "eventTaxonomyGroup"
  ]
] { ... }`

type CleanupPlan = {
  id: string
  type: string
  unset: string[]
}

async function main() {
  if (write && confirmation !== "drop-legacy-i18n") {
    throw new Error(
      "Cleanup writes require SANITY_I18N_CLEANUP_CONFIRM=drop-legacy-i18n after the canonical-only readers are deployed.",
    )
  }

  const documents = await client.fetch<Array<Record<string, unknown>>>(query)
  const blockers: Array<{
    id: unknown
    missing: string[]
    duplicateOrConflict: string[]
  }> = []
  const plans: CleanupPlan[] = []

  for (const document of documents) {
    const issues = findI18nIssues(document)
    const missing = missingCanonicalFields(document)
    const duplicateOrConflict = issues
      .filter(issue => issue.kind === "duplicate" || issue.kind === "conflict")
      .map(issue => issue.path)

    if (missing.length || duplicateOrConflict.length) {
      blockers.push({ id: document._id, missing, duplicateOrConflict })
      continue
    }

    const unset = issues
      .filter(issue => issue.kind === "legacy")
      .map(issue => issue.path)
    if (unset.length === 0) continue
    plans.push({
      id: String(document._id),
      type: String(document._type),
      unset,
    })
  }

  if (blockers.length) {
    console.error(JSON.stringify({ blockers }, null, 2))
    throw new Error(
      `Refusing legacy cleanup: ${blockers.length} documents do not have a conflict-free canonical replacement.`,
    )
  }

  const valueCount = plans.reduce((total, plan) => total + plan.unset.length, 0)
  console.log(
    JSON.stringify(
      {
        mode: write ? "write" : "dry-run",
        documents: documents.length,
        changedDocuments: plans.length,
        legacyValues: valueCount,
        ...(verbose ? { plans } : {}),
      },
      null,
      2,
    ),
  )

  if (write) {
    for (const plan of plans) {
      await client.patch(plan.id).unset(plan.unset).commit()
    }
  }

  console.log(
    `${write ? "Removed" : "Would remove"} ${valueCount} legacy i18n values from ${plans.length} documents.`,
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
