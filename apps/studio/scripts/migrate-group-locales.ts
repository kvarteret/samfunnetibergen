import { getCliClient } from "sanity/cli"
import {
  buildGroupLocalePatch,
  mergeGroupLocalePatches,
} from "../src/studio/migrations/groupLocales"
import { buildInitialEnglishGroupPatch } from "../src/studio/migrations/initialEnglishGroupContent"

const write = process.env.SANITY_MIGRATION_WRITE === "1"
const client = getCliClient({ apiVersion: "2025-02-19" })

async function main() {
  const documents = await client.fetch<Array<Record<string, unknown>>>(
    `*[_type in ["groupsPage", "studentGroup"]]{
      _id, _type, name, summary, body, eyebrow, title, description,
      localizedName, localizedSummary, localizedBody,
      localizedEyebrow, localizedTitle, localizedDescription,
      sections[]{_key, title, body, localizedTitle, localizedBody},
      faq[]{_key, question, answer, localizedQuestion, localizedAnswer}
    }`,
  )

  let count = 0
  for (const document of documents) {
    const patch = mergeGroupLocalePatches(
      buildGroupLocalePatch(document as never),
      buildInitialEnglishGroupPatch(document as never),
    )
    if (Object.keys(patch).length === 0) continue
    count += 1
    console.log(`${write ? "WRITE" : "DRY RUN"} ${document._id}`, patch)
    if (write)
      await client
        .patch(document._id as string)
        .set(patch)
        .commit()
  }
  console.log(
    `${write ? "Applied" : "Would apply"} ${count} group locale patches.`,
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
