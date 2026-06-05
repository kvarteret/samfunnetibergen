import { getCliClient } from "sanity/cli"

const client = getCliClient({ apiVersion: "2024-01-01" })
const shouldWrite = process.argv.includes("--write")

const weekdays = [
    { day: 1, names: ["mandag", "man"] },
    { day: 2, names: ["tirsdag", "tir"] },
    { day: 3, names: ["onsdag", "ons"] },
    { day: 4, names: ["torsdag", "tor"] },
    { day: 5, names: ["fredag", "fre"] },
    { day: 6, names: ["lørdag", "lordag", "lør", "lor"] },
    { day: 7, names: ["søndag", "sondag", "søn", "son"] },
]

function normalize(value) {
    return value.toLowerCase().replaceAll("æ", "ae").replaceAll("ø", "o").replaceAll("å", "a")
}

function inferWeekdays(label) {
    const normalized = normalize(label)
    const matchedDays = weekdays
        .filter(({ names }) => names.some(name => normalized.includes(normalize(name))))
        .map(({ day }) => day)

    if (matchedDays.length >= 2 && /[-–—]/.test(label)) {
        const start = matchedDays[0]
        const end = matchedDays[matchedDays.length - 1]
        if (start <= end) {
            return Array.from({ length: end - start + 1 }, (_, index) => start + index)
        }
    }

    return matchedDays
}

const documents = await client.fetch(`*[
    _type in ["siteMetadata", "room"] &&
    defined(openingHours.rows)
] {
    _id,
    _type,
    title,
    openingHours {
        rows[] {
            _key,
            label,
            weekdays
        }
    }
}`)

const updates = documents.flatMap(document =>
    (document.openingHours?.rows ?? []).flatMap(row => {
        if (!row?._key || !row.label) return []

        if (row.weekdays?.length) {
            return [
                {
                    document,
                    row,
                    weekdays: row.weekdays,
                    skipped: false,
                    unsetOnly: true,
                },
            ]
        }

        const inferred = inferWeekdays(row.label)
        if (!inferred.length) {
            return [
                {
                    document,
                    row,
                    weekdays: [],
                    skipped: true,
                },
            ]
        }

        return [
            {
                document,
                row,
                weekdays: inferred,
                skipped: false,
            },
        ]
    }),
)

for (const update of updates) {
    const owner = update.document.title ?? update.document._id
    const action = update.skipped ? "SKIP" : shouldWrite ? "PATCH" : "DRY"
    const suffix = update.unsetOnly ? "unset label" : `-> [${update.weekdays.join(", ")}]`
    console.log(`${action} ${owner}: "${update.row.label}" ${suffix}`)
}

if (!shouldWrite) {
    console.log("\nDry run only. Re-run with --write to patch Sanity content.")
    process.exit(updates.some(update => update.skipped) ? 1 : 0)
}

for (const update of updates) {
    if (update.skipped) continue

    const patch = client
        .patch(update.document._id)
        .unset([`openingHours.rows[_key=="${update.row._key}"].label`])

    if (!update.unsetOnly) {
        patch.set({ [`openingHours.rows[_key=="${update.row._key}"].weekdays`]: update.weekdays })
    }

    await patch.commit()
}

console.log(`\nPatched ${updates.filter(update => !update.skipped).length} opening-hours rows.`)
