/**
 * Migration: upload Directus room images as proper Sanity assets
 *
 * Rooms currently have images stored as `sourceUrl` (external Directus CDN links).
 * This script downloads each image and re-uploads it as a native Sanity asset,
 * then patches both draft and published documents to use the asset reference.
 */

import { readFileSync } from "fs"
import { createClient } from "next-sanity"
import { homedir } from "os"
import { join } from "path"

// ── Config ─────────────────────────────────────────────────────────────────

const PROJECT_ID = "mkjoahvv"
const DATASET = "production"
const API_VERSION = "2024-01-01"
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN

if (!DIRECTUS_TOKEN) {
    throw new Error("DIRECTUS_TOKEN is required")
}

const sanityConfig = JSON.parse(readFileSync(join(homedir(), ".config/sanity/config.json"), "utf8"))
const SANITY_TOKEN = sanityConfig.authToken

const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    token: SANITY_TOKEN,
    useCdn: false,
})

// ── Helpers ─────────────────────────────────────────────────────────────────

async function downloadImage(url) {
    const withToken = url.includes("?")
        ? `${url}&access_token=${DIRECTUS_TOKEN}`
        : `${url}?access_token=${DIRECTUS_TOKEN}`

    const res = await fetch(withToken)
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    return { buffer: Buffer.from(buffer), contentType }
}

async function uploadToSanity(buffer, contentType, filename) {
    const ext = contentType.split("/")[1]?.split(";")[0] ?? "jpg"
    const asset = await client.assets.upload("image", buffer, {
        filename: `${filename}.${ext}`,
        contentType,
    })
    return asset._id
}

// ── Main ─────────────────────────────────────────────────────────────────────

const rooms = await client.fetch(
    `*[_type == "room" && count(images[defined(sourceUrl)]) > 0] {
        _id,
        title,
        "images": images[] { _key, alt, caption, sourceUrl, "hasAsset": defined(image.asset) }
    }`,
)

console.log(`Found ${rooms.length} rooms with sourceUrl images\n`)

for (const room of rooms) {
    console.log(`\n── ${room.title} (${room._id})`)

    const patches = []

    for (const img of room.images) {
        if (img.hasAsset) {
            console.log(`  [skip] ${img._key} — already has asset`)
            continue
        }
        if (!img.sourceUrl) {
            console.log(`  [skip] ${img._key} — no sourceUrl`)
            continue
        }

        process.stdout.write(`  [upload] ${img._key} from ${img.sourceUrl.slice(0, 60)}... `)

        try {
            const { buffer, contentType } = await downloadImage(img.sourceUrl)
            const assetId = await uploadToSanity(buffer, contentType, `${room._id}-${img._key}`)
            console.log(`→ ${assetId}`)

            patches.push({
                key: img._key,
                assetId,
                alt: img.alt,
                caption: img.caption,
            })
        } catch (err) {
            console.error(`FAILED: ${err.message}`)
        }
    }

    if (patches.length === 0) {
        console.log(`  (no patches needed)`)
        continue
    }

    // Patch the document: set image.asset reference and unset sourceUrl for each image
    let tx = client.patch(room._id)
    for (const { key, assetId, alt, caption } of patches) {
        tx = tx
            .set({
                [`images[_key=="${key}"].image`]: {
                    _type: "image",
                    asset: { _type: "reference", _ref: assetId },
                },
            })
            .unset([`images[_key=="${key}"].sourceUrl`])
        if (alt !== undefined) tx = tx.set({ [`images[_key=="${key}"].alt`]: alt })
        if (caption != null) tx = tx.set({ [`images[_key=="${key}"].caption`]: caption })
    }

    await tx.commit({ autoGenerateArrayKeys: true })
    console.log(`  ✓ patched ${patches.length} image(s)`)
}

console.log("\nDone.")
