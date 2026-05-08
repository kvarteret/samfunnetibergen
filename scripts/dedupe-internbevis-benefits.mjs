import { getCliClient } from "sanity/cli"

const client = getCliClient({ apiVersion: "2024-01-01" })
const shouldExecute = process.argv.includes("--execute")
const tierRank = { trinn1: 1, trinn2: 2, trinn3: 3 }

const benefits = await client.fetch(`*[_type == "internbevisBenefit"] {
    _id,
    _createdAt,
    name,
    tier,
    minimumTier
}`)

const publishedBenefits = benefits.filter(benefit => !benefit._id.startsWith("drafts."))
const draftsByPublishedId = new Map(
    benefits
        .filter(benefit => benefit._id.startsWith("drafts."))
        .map(benefit => [benefit._id.replace(/^drafts\./, ""), benefit]),
)

const benefitsByName = new Map()
for (const benefit of publishedBenefits) {
    const name = benefit.name?.trim()
    if (!name) {
        continue
    }
    const currentBenefits = benefitsByName.get(name) ?? []
    benefitsByName.set(name, [...currentBenefits, benefit])
}

const idsToDelete = []

for (const [name, duplicates] of benefitsByName) {
    if (duplicates.length <= 1) {
        continue
    }

    const sorted = [...duplicates].sort((left, right) => {
        const leftTier = tierRank[left.minimumTier ?? left.tier] ?? Number.POSITIVE_INFINITY
        const rightTier = tierRank[right.minimumTier ?? right.tier] ?? Number.POSITIVE_INFINITY
        if (leftTier !== rightTier) {
            return leftTier - rightTier
        }
        return left._createdAt.localeCompare(right._createdAt)
    })

    const [keptBenefit, ...removedBenefits] = sorted
    console.log(
        `Keeping ${keptBenefit._id}: ${name} (${keptBenefit.minimumTier ?? keptBenefit.tier ?? "missing tier"})`,
    )

    for (const removedBenefit of removedBenefits) {
        const draft = draftsByPublishedId.get(removedBenefit._id)
        idsToDelete.push(removedBenefit._id)
        if (draft) {
            idsToDelete.push(draft._id)
        }
        console.log(
            `  Removing ${removedBenefit._id}: ${name} (${removedBenefit.minimumTier ?? removedBenefit.tier ?? "missing tier"})`,
        )
        if (draft) {
            console.log(`  Removing ${draft._id}: draft for ${name}`)
        }
    }
}

if (idsToDelete.length === 0) {
    console.log("No duplicate internbevisBenefit documents found.")
    process.exit(0)
}

if (!shouldExecute) {
    console.log(`Dry run: would delete ${idsToDelete.length} duplicate documents.`)
    console.log("Run again with --execute to delete them.")
    process.exit(0)
}

const transaction = client.transaction()
for (const id of idsToDelete) {
    transaction.delete(id)
}

await transaction.commit()
console.log(`Deleted ${idsToDelete.length} duplicate internbevisBenefit documents.`)
