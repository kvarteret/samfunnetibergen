import { getCliClient } from "sanity/cli"
import {
  findI18nIssues,
  missingCanonicalFields,
} from "../src/studio/migrations/i18n"

const client = getCliClient({ apiVersion: "2025-02-19" })

const query = `*[
  !(_id in path("drafts.**")) &&
  _type in [
    "homePage", "roomsPage", "groupsPage", "usefulInfoPage", "sponsorsPage",
    "kontaktPage", "footer", "navbar", "linkInBio", "page", "room",
    "studentGroup", "arrangement", "eventType", "eventTaxonomyGroup"
  ]
] { ... }`

async function main() {
  const documents = await client.fetch<Array<Record<string, unknown>>>(query)
  const missing = documents.flatMap(document =>
    missingCanonicalFields(document).map(path => ({
      id: document._id,
      type: document._type,
      path,
    })),
  )
  const issues = documents.flatMap(document =>
    findI18nIssues(document).map(issue => ({
      id: document._id,
      type: document._type,
      ...issue,
    })),
  )
  const duplicateOrConflict = issues.filter(
    issue => issue.kind === "duplicate" || issue.kind === "conflict",
  )
  const legacy = issues.filter(issue => issue.kind === "legacy")

  console.log(
    JSON.stringify(
      {
        documents: documents.length,
        missing,
        duplicateOrConflict,
        legacy,
      },
      null,
      2,
    ),
  )
  if (missing.length || duplicateOrConflict.length || legacy.length) {
    console.error(
      `i18n audit failed: ${missing.length} missing canonical values, ${duplicateOrConflict.length} duplicate/conflicting language entries, ${legacy.length} populated legacy values.`,
    )
    process.exitCode = 1
    return
  }
  console.log("i18n audit passed with no populated legacy fields.")
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
