import { readFile } from "node:fs/promises"
import { basename, join } from "node:path"

import { getCliClient } from "sanity/cli"

const client = getCliClient({ apiVersion: "2024-01-01" })
const write = process.argv.includes("--write")
const sourceDir =
    process.argv.find(arg => arg.startsWith("--dir="))?.slice("--dir=".length) ??
    "/private/tmp/samfunnet-floor-plans"

const floorPlans = [
    { floor: 1, filename: "1_etg_original.svg", title: "1. etasje" },
    { floor: 2, filename: "2_etg_original.svg", title: "2. etasje" },
    { floor: 3, filename: "3_etg_original.svg", title: "3. etasje" },
]

function floorPlanValue(plan, assetId) {
    return {
        _key: `floor-${plan.floor}`,
        _type: "floorPlan",
        floor: plan.floor,
        title: plan.title,
        file: {
            _type: "file",
            asset: {
                _type: "reference",
                _ref: assetId,
            },
        },
    }
}

async function findExistingFileAsset(filename) {
    return client.fetch(`*[_type == "sanity.fileAsset" && originalFilename == $filename][0]._id`, {
        filename,
    })
}

async function uploadFileAsset(plan) {
    const existingAssetId = await findExistingFileAsset(plan.filename)
    if (existingAssetId) {
        return existingAssetId
    }

    const filePath = join(sourceDir, plan.filename)
    const buffer = await readFile(filePath)

    if (!write) {
        return `dry-${basename(filePath)}`
    }

    const asset = await client.assets.upload("file", buffer, {
        contentType: "image/svg+xml",
        filename: plan.filename,
    })

    return asset._id
}

async function main() {
    const values = []

    for (const plan of floorPlans) {
        const assetId = await uploadFileAsset(plan)
        values.push(floorPlanValue(plan, assetId))
        console.log(`${write ? "WRITE" : "DRY"} ${plan.title}: ${assetId}`)
    }

    if (!write) {
        console.log("DRY would patch roomsPage.floorPlans")
        return
    }

    await client.createIfNotExists({
        _id: "roomsPage",
        _type: "roomsPage",
        title: "Rom",
    })

    await client
        .patch("roomsPage")
        .set({ floorPlans: values })
        .commit({ autoGenerateArrayKeys: true })

    console.log("WRITE patched roomsPage.floorPlans")
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
