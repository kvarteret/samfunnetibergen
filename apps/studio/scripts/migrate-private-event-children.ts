import { getCliClient } from "sanity/cli"

import {
  instanceIdFor,
  type Occurrence,
  publishedIdOf,
} from "@samfunnet/content-domain/instances"

// Copies generated child events that were created under dotted Sanity IDs
// (private to unauthenticated clients) to root-path IDs that public queries can
// read. It never deletes the old private documents automatically.
//
//   npm run sanity:migrate:private-event-children
//   MIGRATE_PARENT_ID=<id> npm run sanity:migrate:private-event-children
//   npm run sanity:migrate:private-event-children:write
//   MIGRATE_PARENT_ID=<id> npm run sanity:migrate:private-event-children:write

const write = process.env.SANITY_MIGRATION_WRITE === "1"
const client = getCliClient({ apiVersion: "2026-01-01" })

type EventChildDocument = {
  _id: string
  _type: "arrangement"
  _createdAt?: string
  _updatedAt?: string
  _rev?: string
  parentEvent?: { _ref?: string }
  dates?: Array<{
    startDate?: string | null
    startTime?: string | null
    endTime?: string | null
  }> | null
  title?: string | null
  slug?: { current?: string | null }
}

function parentIdArgument(): string | null {
  const fromEnv = process.env.MIGRATE_PARENT_ID?.trim()
  return fromEnv ? publishedIdOf(fromEnv) : null
}

function occurrenceFor(child: EventChildDocument): Occurrence | null {
  const date = child.dates?.[0]
  if (!date?.startDate) return null
  return {
    startDate: date.startDate,
    startTime: date.startTime ?? null,
    endTime: date.endTime ?? null,
  }
}

function publicIdFor(child: EventChildDocument): string | null {
  const parentId = child.parentEvent?._ref
  const occurrence = occurrenceFor(child)
  if (!parentId || !occurrence) return null
  return instanceIdFor(parentId, occurrence)
}

function cloneWithPublicId(child: EventChildDocument, publicId: string) {
  const document = Object.fromEntries(
    Object.entries(child).filter(
      ([key]) => !["_createdAt", "_id", "_rev", "_updatedAt"].includes(key),
    ),
  )
  return { ...document, _id: publicId, _type: child._type }
}

async function fetchChildren(
  parentId: string | null,
): Promise<EventChildDocument[]> {
  return client.fetch(
    `*[
      _type == "arrangement"
      && defined(parentEvent._ref)
      && !(_id in path("drafts.**"))
      && !(_id in path("versions.**"))
      && ($parentId == null || parentEvent._ref == $parentId)
    ] | order(parentEvent._ref asc, dates[0].startDate asc)`,
    { parentId },
  )
}

async function main() {
  const parentId = parentIdArgument()
  const children = await fetchChildren(parentId)
  const existingIds = new Set(children.map(child => child._id))
  const privateChildren = children.filter(child => child._id.includes("."))

  if (privateChildren.length === 0) {
    console.log(
      parentId
        ? `No private child event ids found for parent ${parentId}`
        : "No private child event ids found",
    )
    return
  }

  const toCreate: Array<{ child: EventChildDocument; publicId: string }> = []
  const skipped: Array<{ child: EventChildDocument; reason: string }> = []

  for (const child of privateChildren) {
    const publicId = publicIdFor(child)
    if (!publicId) {
      skipped.push({ child, reason: "missing parent reference or first date" })
      continue
    }
    if (existingIds.has(publicId)) {
      skipped.push({ child, reason: `public id already exists: ${publicId}` })
      continue
    }
    toCreate.push({ child, publicId })
  }

  console.log(
    `${write ? "WRITE" : "DRY RUN"} private child event migration: ${toCreate.length} to create, ${skipped.length} skipped`,
  )

  for (const { child, publicId } of toCreate) {
    console.log(`  ${write ? "WRITE" : "DRY RUN"} ${child._id} -> ${publicId}`)
  }

  for (const { child, reason } of skipped) {
    console.log(`  SKIP ${child._id}: ${reason}`)
  }

  if (write && toCreate.length > 0) {
    const transaction = client.transaction()
    for (const { child, publicId } of toCreate) {
      transaction.createIfNotExists(cloneWithPublicId(child, publicId))
    }
    await transaction.commit()
  }

  if (toCreate.length > 0) {
    console.log(
      "\nAfter verifying the public replacements, delete old private ids:",
    )
    for (const { child } of toCreate) {
      console.log(`  npx sanity documents delete ${child._id}`)
    }
  }

  console.log(
    write ? "\nMigration applied." : "\nDry run complete – nothing written.",
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
