import { getCliClient } from "sanity/cli"

import { findRequiredViolations } from "../src/studio/migrations/sanityDefaults"

const client = getCliClient({ apiVersion: "2025-02-19" })

async function main() {
  const documents = await client.fetch<
    Array<{ _id: string; _type: string; [key: string]: unknown }>
  >(`*[!(_id in path("drafts.**")) && _type in [
    "arrangement",
    "eventTaxonomyGroup",
    "eventType",
    "eventsPage",
    "groupsPage",
    "homePage",
    "footer",
    "internbevisBenefit",
    "kontaktPage",
    "linkInBio",
    "navbar",
    "page",
    "room",
    "roomsPage",
    "sponsorsPage",
    "studentGroup"
  ]]`)

  const violations = documents.flatMap(document =>
    findRequiredViolations(document).map(field => ({
      id: document._id,
      type: document._type,
      field,
    })),
  )

  if (violations.length > 0) {
    console.error("Required-field violations:")
    console.table(violations)
    process.exitCode = 1
  } else {
    console.log("Required-field audit passed with zero violations.")
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
