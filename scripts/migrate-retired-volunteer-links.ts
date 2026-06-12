import { getCliClient } from "sanity/cli"

import { buildRetiredVolunteerLinkPatch } from "../src/studio/migrations/retiredVolunteerLinks"

const write = process.env.SANITY_MIGRATION_WRITE === "1"
const client = getCliClient({ apiVersion: "2025-02-19" })

async function main() {
  const documents = await client.fetch<
    Array<{ _id: string; _type: string; [key: string]: unknown }>
  >(
    `*[_id in [
      "homePage",
      "drafts.homePage",
      "navbar",
      "drafts.navbar"
    ]]`,
  )

  const patches = documents
    .map(document => ({
      document,
      values: buildRetiredVolunteerLinkPatch(document),
    }))
    .filter(({ values }) => Object.keys(values).length > 0)

  for (const { document, values } of patches) {
    console.log(`${write ? "WRITE" : "DRY RUN"} ${document._id}`, values)
    if (write) {
      await client.patch(document._id).set(values).commit()
    }
  }

  console.log(
    `${write ? "Applied" : "Would apply"} ${patches.length} idempotent document patches.`,
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
