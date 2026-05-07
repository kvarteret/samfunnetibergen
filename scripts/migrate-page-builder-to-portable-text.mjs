import { createClient } from "@sanity/client"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "mkjoahvv"
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production"
const token = process.env.SANITY_API_READ_TOKEN
const write = process.argv.includes("--write")

if (!token) {
    throw new Error("Missing SANITY_API_READ_TOKEN")
}

const client = createClient({
    projectId,
    dataset,
    apiVersion: "2025-01-01",
    useCdn: false,
    token,
})

function textBlock(key, style, text) {
    return {
        _key: key,
        _type: "block",
        style,
        markDefs: [],
        children: [{ _key: `${key}-span`, _type: "span", text, marks: [] }],
    }
}

function normalizeBlock(block) {
    if (block._type === "block" || block._type === "image") {
        return [block]
    }

    if (block._type === "heroBlock") {
        return [
            typeof block.eyebrow === "string"
                ? textBlock(`${block._key}-eyebrow`, "normal", block.eyebrow)
                : null,
            typeof block.title === "string" ? textBlock(`${block._key}-title`, "h1", block.title) : null,
            typeof block.lead === "string" ? textBlock(`${block._key}-lead`, "normal", block.lead) : null,
            block.image
                ? {
                      _key: `${block._key}-image`,
                      _type: "image",
                      ...block.image,
                      alt: typeof block.title === "string" ? block.title : "",
                  }
                : null,
        ].filter(Boolean)
    }

    if (block._type === "richTextBlock" || block._type === "calloutBlock") {
        return [
            typeof block.title === "string" ? textBlock(`${block._key}-title`, "h2", block.title) : null,
            ...(Array.isArray(block.content) ? block.content : []),
        ].filter(Boolean)
    }

    if (block._type === "imageBlock" && block.image) {
        return [
            {
                _key: block._key,
                _type: "image",
                ...block.image,
                alt: block.alt ?? "",
                caption: block.caption,
            },
        ]
    }

    return []
}

function normalizePageBuilder(pageBuilder) {
    return pageBuilder.flatMap(normalizeBlock)
}

const pages = await client.fetch(`*[_type == "page" && defined(pageBuilder)] {
    _id,
    title,
    pageBuilder[] {
        ...,
        _type == "heroBlock" => { image },
        _type == "imageBlock" => { image },
        _type == "richTextBlock" => { content[] { ... } },
        _type == "calloutBlock" => { content[] { ... } }
    }
}`)

const legacyPages = pages.filter(page =>
    page.pageBuilder?.some(block => !["block", "image"].includes(block._type)),
)

console.log(`${legacyPages.length} page documents need pageBuilder migration.`)

if (!write) {
    for (const page of legacyPages) {
        console.log(`DRY RUN ${page._id}: ${page.title ?? "Untitled"}`)
    }
    console.log("Run with --write to patch Sanity documents.")
    process.exit(0)
}

const transaction = client.transaction()

for (const page of legacyPages) {
    transaction.patch(page._id, {
        set: { pageBuilder: normalizePageBuilder(page.pageBuilder ?? []) },
    })
}

await transaction.commit()

console.log(`Migrated ${legacyPages.length} page documents.`)
