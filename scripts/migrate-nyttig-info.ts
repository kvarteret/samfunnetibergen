import { getCliClient } from "sanity/cli"

import {
  ACCESSIBILITY_MARKDOWN,
  buildNavbarNyttigItems,
  buildUsefulInfoPageDocument,
  RETIRED_ACCESSIBILITY_PAGE_ID,
  USEFUL_INFO_PAGE_ID,
} from "../src/studio/migrations/nyttigInfo"

const write = process.env.SANITY_MIGRATION_WRITE === "1"
const client = getCliClient({ apiVersion: "2025-02-19" })

async function main() {
  // Prefer the live retired-page markdown so the migration reflects any late
  // edits; fall back to the embedded copy when the document is already gone.
  const retiredContent = await client.fetch<string | null>(
    `*[_id == $id][0].content`,
    { id: RETIRED_ACCESSIBILITY_PAGE_ID },
  )
  const accessibilityMarkdown = retiredContent ?? ACCESSIBILITY_MARKDOWN

  const document = buildUsefulInfoPageDocument(accessibilityMarkdown)
  console.log(
    `${write ? "WRITE" : "DRY RUN"} createOrReplace ${USEFUL_INFO_PAGE_ID} (${document.sections.length} sections)`,
  )
  if (write) {
    await client.createOrReplace(document)
  }

  const navbar = await client.fetch<{
    _id: string
    _type: string
    items?: unknown
  } | null>(`*[_id == "navbar"][0]{ _id, _type, items }`)
  if (navbar) {
    const nextItems = buildNavbarNyttigItems(navbar)
    if (nextItems) {
      console.log(`${write ? "WRITE" : "DRY RUN"} add "Nyttig info" nav item`)
      if (write) {
        await client.patch("navbar").set({ items: nextItems }).commit()
      }
    } else {
      console.log('Nav item "/nyttig" already present – skipping')
    }
  }

  // Unpublish the retired page: delete the published id, keeping any draft so
  // it can be restored. Idempotent – deleting a missing id is a no-op.
  console.log(
    `${write ? "WRITE" : "DRY RUN"} unpublish retired page ${RETIRED_ACCESSIBILITY_PAGE_ID}`,
  )
  if (write) {
    await client.delete(RETIRED_ACCESSIBILITY_PAGE_ID)
  }

  console.log(
    write ? "Migration applied." : "Dry run complete – nothing written.",
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
