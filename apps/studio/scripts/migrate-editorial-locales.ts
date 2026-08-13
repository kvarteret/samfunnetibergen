import { getCliClient } from "sanity/cli"
import { buildEditorialLocalePatch } from "../src/studio/migrations/editorialLocales"

const write = process.env.SANITY_MIGRATION_WRITE === "1"
const client = getCliClient({ apiVersion: "2025-02-19" })

async function main() {
  const documents = await client.fetch<Array<Record<string, unknown>>>(
    `*[_id in ["roomsPage", "usefulInfoPage", "sponsorsPage"]]{
      _id, _type,
      sections[]{_key, _type, body, items[]{_key, title, body}},
      sponsors[]{_key, title, description}
    }`,
  )
  for (const document of documents) {
    const patch = buildEditorialLocalePatch(document as never)
    if (!Object.keys(patch).length) continue
    console.log(`${write ? "WRITE" : "DRY RUN"} ${document._id}`, patch)
    if (write)
      await client
        .patch(document._id as string)
        .set(patch)
        .commit()
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
