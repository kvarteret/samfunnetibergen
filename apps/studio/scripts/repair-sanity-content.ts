import { getCliClient } from "sanity/cli"
import { VERGEORDNING_FORM_URL } from "../src/studio/migrations/nyttigInfo"

const write = process.env.SANITY_MIGRATION_WRITE === "1"
const client = getCliClient({ apiVersion: "2025-02-19" })
const retiredPageIds = ["036d87cc-3613-4e4f-8031-f71d0f09e487", "page-booking"]
const ageLimitPageId = "page-aldersgrense"
const ageLimitMarkdown = `## Aldersgrense på Kvarteret

Aldersgrensen på Kvarteret er 18 år for studenter og 20 år for andre.

Godkjent studentbevis:

- Studentbevis fra høyere utdanning (høyskole eller universitet)
- Gyldig bevis fra ingeniørhøgskolen
- Gyldig lærlingbevis
- Gyldig folkehøgskolebevis

Er du under 18 år, kan du besøke Kvarteret sammen med en verge. [Les mer om vergeordningen her.](${VERGEORDNING_FORM_URL})
`

function toPortableTextBlock(text: string, index: number) {
  return {
    _key: `legacy-body-${index}`,
    _type: "block",
    children: [
      {
        _key: `legacy-span-${index}`,
        _type: "span",
        marks: [],
        text,
      },
    ],
    markDefs: [],
    style: "normal",
  }
}

async function main() {
  const existingPageIds = await client.fetch<string[]>(`*[_id in $ids]._id`, {
    ids: retiredPageIds,
  })

  for (const documentId of existingPageIds) {
    console.log(`${write ? "DELETE" : "WOULD DELETE"} ${documentId}`)
    if (write) await client.delete(documentId)
  }

  const group = await client.fetch<{
    _id: string
    body?: unknown[]
  } | null>(`*[_id == "studentGroup-quiz-gruppen"][0]{_id, body}`)

  const normalizedBody = group?.body?.map((item, index) =>
    typeof item === "string" ? toPortableTextBlock(item, index) : item,
  )
  const needsBodyRepair = group?.body?.some(item => typeof item === "string")

  if (group && normalizedBody && needsBodyRepair) {
    console.log(`${write ? "REPAIR" : "WOULD REPAIR"} ${group._id}.body`)
    if (write) {
      await client.patch(group._id).set({ body: normalizedBody }).commit()
    }
  }

  const ageLimitPage = await client.fetch<{
    _id: string
    content?: unknown
  } | null>(`*[_id == $id][0]{_id, content}`, { id: ageLimitPageId })

  if (ageLimitPage && Array.isArray(ageLimitPage.content)) {
    console.log(
      `${write ? "REPAIR" : "WOULD REPAIR"} ${ageLimitPage._id}.content`,
    )
    if (write) {
      await client
        .patch(ageLimitPage._id)
        .set({ content: ageLimitMarkdown })
        .commit()
    }
  }

  console.log(
    write
      ? "Content cleanup applied."
      : "Dry run complete; no content changed.",
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
