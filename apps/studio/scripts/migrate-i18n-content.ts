import { readFile, writeFile } from "node:fs/promises"
import { getCliClient } from "sanity/cli"
import {
  buildI18nPatch,
  type TranslationFn,
} from "../src/studio/migrations/i18n"

const write = process.env.SANITY_MIGRATION_WRITE === "1"
const catalogMode = process.env.SANITY_I18N_CATALOG_WRITE === "1"
const catalogPath =
  process.env.SANITY_TRANSLATION_CATALOG ?? ".sanity/i18n-catalog.json"
const client = getCliClient({ apiVersion: "2025-02-19" })

const translationCache = new Map<string, string>()
const translationApiKey = process.env.GOOGLE_TRANSLATE_API_KEY?.trim()
const allowUnofficialTranslator =
  process.env.SANITY_ALLOW_UNOFFICIAL_TRANSLATOR === "1"
let catalog: Record<string, string> = {}
let discoveredCatalog: Record<string, string> = {}

/**
 * Translation is deliberately two-phase.  `SANITY_I18N_CATALOG_WRITE=1`
 * generates a deterministic local catalog (using a supported Google Cloud
 * key, or the opt-in unofficial endpoint for a dry-run).  Write mode consumes
 * only that frozen catalog and refuses all network translation.  Editors
 * should review the catalog before removing legacy fields.
 */
const translateFromNetwork = async (source: string): Promise<string> => {
  let translated = ""
  if (translationApiKey) {
    const url = new URL(
      "https://translation.googleapis.com/language/translate/v2",
    )
    url.searchParams.set("key", translationApiKey)
    let response: Response | undefined
    let payload: unknown
    for (let attempt = 0; attempt < 3; attempt += 1) {
      response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          q: source,
          source: "no",
          target: "en",
          format: "text",
        }),
      })
      if (response.ok) {
        payload = await response.json()
        break
      }
      if (attempt < 2)
        await new Promise(resolve => setTimeout(resolve, 250 * 2 ** attempt))
    }
    if (!response?.ok)
      throw new Error(
        `Google Cloud Translation request failed (${response?.status ?? "unknown"})`,
      )
    translated =
      isRecord(payload) &&
      isRecord(payload.data) &&
      Array.isArray(payload.data.translations)
        ? payload.data.translations
            .map(item =>
              isRecord(item) && typeof item.translatedText === "string"
                ? item.translatedText
                : "",
            )
            .join("")
        : ""
  } else if (allowUnofficialTranslator && catalogMode) {
    const url = new URL("https://translate.googleapis.com/translate_a/single")
    url.searchParams.set("client", "gtx")
    url.searchParams.set("sl", "no")
    url.searchParams.set("tl", "en")
    url.searchParams.set("dt", "t")
    url.searchParams.set("q", source)
    let response: Response | undefined
    let payload: unknown
    for (let attempt = 0; attempt < 3; attempt += 1) {
      response = await fetch(url)
      if (response.ok) {
        payload = await response.json()
        break
      }
      if (attempt < 2)
        await new Promise(resolve => setTimeout(resolve, 250 * 2 ** attempt))
    }
    if (!response?.ok)
      throw new Error(
        `Unofficial translation request failed (${response?.status ?? "unknown"})`,
      )
    translated = Array.isArray(payload)
      ? payload
          .slice(0, 1)
          .flatMap(segment => (Array.isArray(segment) ? segment : []))
          .map(segment => (Array.isArray(segment) ? segment[0] : undefined))
          .filter((value): value is string => typeof value === "string")
          .join("")
      : ""
  } else {
    throw new Error(
      "No translator configured. Generate a catalog with GOOGLE_TRANSLATE_API_KEY or SANITY_I18N_CATALOG_WRITE=1 SANITY_ALLOW_UNOFFICIAL_TRANSLATOR=1.",
    )
  }
  if (!translated.trim())
    throw new Error("Translation service returned an empty value")
  return translated
}

const translate: TranslationFn = async text => {
  const source = text.trim()
  if (!source) return text
  const cached = translationCache.get(source)
  if (cached) return cached
  if (write) {
    const translated = catalog[source]
    if (!translated?.trim()) {
      throw new Error(
        `Translation catalog is missing source text: ${JSON.stringify(source)}`,
      )
    }
    translationCache.set(source, translated)
    return translated
  }
  const fromCatalog = catalog[source]
  if (fromCatalog?.trim()) {
    translationCache.set(source, fromCatalog)
    return fromCatalog
  }
  const translated = await translateFromNetwork(source)
  if (catalogMode) discoveredCatalog[source] = translated
  translationCache.set(source, translated)
  return translated
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

const query = `*[
  !(_id in path("drafts.**")) &&
  _type in [
    "homePage", "roomsPage", "groupsPage", "usefulInfoPage", "sponsorsPage",
    "kontaktPage", "footer", "navbar", "linkInBio", "page", "room",
    "studentGroup", "arrangement", "eventType", "eventTaxonomyGroup"
  ]
] { ... }`

async function main() {
  if (catalogMode && write) {
    throw new Error("Catalog generation and Sanity writes are separate phases")
  }
  if (write) {
    try {
      const parsed = JSON.parse(await readFile(catalogPath, "utf8")) as unknown
      catalog =
        isRecord(parsed) && isRecord(parsed.translations)
          ? Object.fromEntries(
              Object.entries(parsed.translations).filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === "string",
              ),
            )
          : {}
    } catch {
      throw new Error(
        `Write mode requires a frozen translation catalog at ${catalogPath}`,
      )
    }
    if (Object.keys(catalog).length === 0) {
      throw new Error(`Translation catalog at ${catalogPath} is empty`)
    }
  } else {
    try {
      const parsed = JSON.parse(await readFile(catalogPath, "utf8")) as unknown
      if (isRecord(parsed) && isRecord(parsed.translations)) {
        catalog = Object.fromEntries(
          Object.entries(parsed.translations).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        )
      }
    } catch {
      // A dry-run can create the catalog from the configured translator.
    }
  }
  const documents = await client.fetch<Array<Record<string, unknown>>>(query)
  let changed = 0
  let failed = 0
  for (const document of documents) {
    try {
      const patch = await buildI18nPatch(document, translate)
      const setPaths = Object.keys(patch.set)
      if (setPaths.length === 0) {
        if (patch.missing.length || patch.conflicts.length) {
          console.log(
            `AUDIT ${document._id}: missing=${patch.missing.length} conflicts=${patch.conflicts.length}`,
          )
        }
        continue
      }
      if (write && patch.conflicts.length > 0) {
        failed += 1
        console.error(
          `SKIP ${document._id}: conflicting duplicate language entries require editorial resolution`,
          patch.conflicts,
        )
        continue
      }
      changed += 1
      console.log(
        `${write ? "WRITE" : "DRY RUN"} ${document._id} (${document._type})`,
        JSON.stringify({
          set: patch.set,
          missing: patch.missing,
          conflicts: patch.conflicts,
        }),
      )
      if (write) {
        await client
          .patch(document._id as string)
          .set(patch.set)
          .commit()
      }
    } catch (error) {
      failed += 1
      console.error(`FAILED ${document._id} (${document._type})`, error)
    }
  }

  console.log(
    `${write ? "Applied" : "Would apply"} ${changed} i18n patches; ${failed} documents failed translation.`,
  )
  if (catalogMode) {
    const translations = Object.fromEntries(
      Object.entries({ ...catalog, ...discoveredCatalog }).sort(
        ([left], [right]) => left.localeCompare(right),
      ),
    )
    await writeFile(
      catalogPath,
      `${JSON.stringify({ version: 1, sourceLanguage: "nb", targetLanguage: "en", translations }, null, 2)}\n`,
      "utf8",
    )
    console.log(
      `Wrote ${Object.keys(translations).length} translations to ${catalogPath}`,
    )
  }
  if (failed > 0) process.exitCode = 1
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
