import { getCliClient } from "sanity/cli"

const client = getCliClient({ apiVersion: "2024-01-01" })
const shouldExecute = process.argv.includes("--execute")

const rooms = await client.fetch(`*[_type == "room" && defined(openingHours)] {
    _id,
    _rev,
    title,
    openingHours
}`)

const migrations = []

for (const room of rooms) {
    if (room.openingHours?.rows?.length) {
        continue
    }

    if (room.openingHours?.start && room.openingHours?.end) {
        migrations.push({
            _id: room._id,
            _rev: room._rev,
            title: room.title,
            rows: [
                {
                    _key: "monday-saturday",
                    _type: "openingHoursRow",
                    label: "Mandag-lørdag",
                    duration: {
                        _type: "duration",
                        start: room.openingHours.start,
                        end: room.openingHours.end,
                    },
                },
                {
                    _key: "sunday",
                    _type: "openingHoursRow",
                    label: "Søndag",
                    closed: true,
                },
            ],
        })
        continue
    }

    const ranges = new Map()
    for (const entry of room.openingHours?.hours ?? []) {
        const label = dayLabel(entry.day)
        if (!label) {
            continue
        }
        const key =
            entry.closed || !entry.opens || !entry.closes
                ? "closed"
                : `${entry.opens}|${entry.closes}`
        const group = ranges.get(key) ?? {
            days: [],
            closed: key === "closed",
            start: entry.opens,
            end: entry.closes,
        }
        ranges.set(key, { ...group, days: [...group.days, label] })
    }

    const rows = [...ranges.values()].flatMap((range, index) => {
        if (range.days.length === 0) {
            return []
        }
        return [
            {
                _key: `row-${index}`,
                _type: "openingHoursRow",
                label: compactDayLabels(range.days),
                closed: range.closed || undefined,
                duration: range.closed
                    ? undefined
                    : {
                          _type: "duration",
                          start: range.start,
                          end: range.end,
                      },
            },
        ]
    })

    if (rows.length > 0) {
        migrations.push({ _id: room._id, _rev: room._rev, title: room.title, rows })
    }
}

if (migrations.length === 0) {
    console.log("No room opening hours need row migration.")
    process.exit(0)
}

for (const migration of migrations) {
    console.log(
        `${shouldExecute ? "Migrating" : "Would migrate"} ${migration._id}: ${migration.title ?? "(untitled)"}`,
    )
    for (const row of migration.rows) {
        const time = row.closed ? "Stengt" : `${row.duration.start}-${row.duration.end}`
        console.log(`  ${row.label}: ${time}`)
    }
}

if (!shouldExecute) {
    console.log(`Dry run: would migrate ${migrations.length} room opening-hours fields.`)
    console.log("Run again with --execute to update Sanity.")
    process.exit(0)
}

const transaction = client.transaction()
for (const migration of migrations) {
    transaction.patch(migration._id, patch =>
        patch.ifRevisionId(migration._rev).set({
            openingHours: {
                _type: "openingHours",
                rows: migration.rows,
            },
        }),
    )
}

await transaction.commit()
console.log(`Migrated ${migrations.length} room opening-hours fields to row objects.`)

function dayLabel(day) {
    const labels = {
        monday: "Mandag",
        tuesday: "Tirsdag",
        wednesday: "Onsdag",
        thursday: "Torsdag",
        friday: "Fredag",
        saturday: "Lørdag",
        sunday: "Søndag",
    }
    return labels[day]
}

function compactDayLabels(days) {
    if (days.length <= 1) {
        return days[0]
    }
    return `${days[0]}-${days.at(-1)?.toLowerCase()}`
}
