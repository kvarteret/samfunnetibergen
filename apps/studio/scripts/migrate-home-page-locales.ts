import { getCliClient } from "sanity/cli"
import { buildHomePageLocalePatch } from "../src/studio/migrations/homePageLocales"

const write = process.env.SANITY_MIGRATION_WRITE === "1"
const client = getCliClient({ apiVersion: "2025-02-19" })

async function main() {
  const document = await client.fetch<Record<string, unknown> | null>(
    `*[_type == "homePage" && _id == "homePage"][0]{
      localizedEyebrow, localizedTitle, localizedDescription,
      primaryCta{localizedLabel}
    }`,
  )
  if (!document) {
    console.log("No homePage document found.")
    return
  }

  const patch = buildHomePageLocalePatch(document as never)
  console.log(`${write ? "WRITE" : "DRY RUN"} homePage`, patch)
  if (write && Object.keys(patch).length > 0) {
    await client.patch("homePage").set(patch).commit()
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
