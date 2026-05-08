import { getCliClient } from "sanity/cli"

const client = getCliClient({ apiVersion: "2024-01-01" })
const validTiers = new Set(["trinn1", "trinn2", "trinn3"])

const benefits = await client.fetch(`*[_type == "internbevisBenefit" && defined(tier)] {
    _id,
    _rev,
    name,
    tier,
    minimumTier
}`)

if (benefits.length === 0) {
    console.log("No internbevisBenefit documents still use tier.")
    process.exit(0)
}

const invalidBenefits = benefits.filter(benefit => !validTiers.has(benefit.tier))
if (invalidBenefits.length > 0) {
    console.error("Found internbevisBenefit documents with invalid tier values:")
    for (const benefit of invalidBenefits) {
        console.error(`- ${benefit._id}: ${benefit.name ?? "(untitled)"} has tier=${benefit.tier}`)
    }
    process.exit(1)
}

const conflictingBenefits = benefits.filter(
    benefit => benefit.minimumTier && benefit.minimumTier !== benefit.tier,
)
if (conflictingBenefits.length > 0) {
    console.error("Found internbevisBenefit documents where tier and minimumTier disagree:")
    for (const benefit of conflictingBenefits) {
        console.error(
            `- ${benefit._id}: ${benefit.name ?? "(untitled)"} has tier=${benefit.tier} and minimumTier=${benefit.minimumTier}`,
        )
    }
    process.exit(1)
}

const transaction = client.transaction()

for (const benefit of benefits) {
    transaction.patch(benefit._id, patch =>
        patch.ifRevisionId(benefit._rev).set({ minimumTier: benefit.tier }).unset(["tier"]),
    )
}

await transaction.commit()

console.log(`Migrated ${benefits.length} internbevisBenefit documents from tier to minimumTier.`)
