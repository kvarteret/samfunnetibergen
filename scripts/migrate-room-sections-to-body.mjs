import { getCliClient } from "sanity/cli"

const client = getCliClient({ apiVersion: "2024-01-01" })
const shouldExecute = process.argv.includes("--execute")

const rooms = await client.fetch(`*[_type == "room" && defined(sections)] {
    _id,
    _rev,
    title,
    body,
    sections
}`)

const migrations = rooms.flatMap(room => {
    if (room.body?.length) {
        console.log(`Skipping ${room._id}: ${room.title ?? "(untitled)"} already has body`)
        return []
    }

    const body = sectionsToPortableText(room.sections ?? [])
    if (body.length === 0) {
        return []
    }

    return [{ _id: room._id, _rev: room._rev, title: room.title, body }]
})

if (migrations.length === 0) {
    console.log("No room sections need migration.")
    process.exit(0)
}

for (const migration of migrations) {
    console.log(
        `${shouldExecute ? "Migrating" : "Would migrate"} ${migration._id}: ${migration.title ?? "(untitled)"} (${migration.body.length} blocks)`,
    )
}

if (!shouldExecute) {
    console.log(`Dry run: would migrate ${migrations.length} room documents.`)
    console.log("Run again with --execute to update Sanity.")
    process.exit(0)
}

const transaction = client.transaction()
for (const migration of migrations) {
    transaction.patch(migration._id, patch =>
        patch.ifRevisionId(migration._rev).set({ body: migration.body }).unset(["sections"]),
    )
}

await transaction.commit()
console.log(`Migrated ${migrations.length} room documents from sections to body.`)

function sectionsToPortableText(sections) {
    return sections.flatMap((section, sectionIndex) => {
        const blocks = []

        if (section.title) {
            blocks.push(textBlock(`section-${sectionIndex}-title`, "h2", section.title))
        }

        for (const [paragraphIndex, paragraph] of (section.paragraphs ?? []).entries()) {
            if (!paragraph) {
                continue
            }
            blocks.push(
                textBlock(
                    `section-${sectionIndex}-paragraph-${paragraphIndex}`,
                    "normal",
                    paragraph,
                ),
            )
        }

        for (const [linkIndex, link] of (section.links ?? []).entries()) {
            if (!link?.url) {
                continue
            }
            blocks.push(
                linkBlock(
                    `section-${sectionIndex}-link-${linkIndex}`,
                    link.label ?? link.url,
                    link.url,
                ),
            )
        }

        return blocks
    })
}

function textBlock(_key, style, text) {
    return {
        _key,
        _type: "block",
        style,
        markDefs: [],
        children: [
            {
                _key: `${_key}-span`,
                _type: "span",
                marks: [],
                text,
            },
        ],
    }
}

function linkBlock(_key, label, href) {
    const markKey = `${_key}-link`
    return {
        _key,
        _type: "block",
        style: "normal",
        markDefs: [
            {
                _key: markKey,
                _type: "link",
                href,
                blank: true,
            },
        ],
        children: [
            {
                _key: `${_key}-span`,
                _type: "span",
                marks: [markKey],
                text: label,
            },
        ],
    }
}
