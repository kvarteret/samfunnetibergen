import { getCliClient } from "sanity/cli"
import { findMissingEnglishGroupFields } from "../src/studio/migrations/groupLocales"

const client = getCliClient({ apiVersion: "2025-02-19" })

async function main() {
  const documents = await client.fetch<Array<Record<string, unknown>>>(
    `*[!(_id in path("drafts.**")) && _type in ["groupsPage", "studentGroup"]]{
      _id, _type, localizedName, localizedSummary, localizedBody,
      localizedTitle, localizedDescription,
      faq[]{_key, localizedQuestion, localizedAnswer}
    }`,
  )
  const missing = documents.flatMap(document =>
    findMissingEnglishGroupFields(document as never).map(field => ({
      id: document._id,
      type: document._type,
      field,
    })),
  )
  if (missing.length) {
    console.error("Missing published English group translations:")
    console.table(missing)
    process.exitCode = 1
    return
  }
  console.log("Published English group translation audit passed.")
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
