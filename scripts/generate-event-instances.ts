import { getCliClient } from "sanity/cli"

import {
  buildInstanceDocument,
  diffInstances,
  type ExistingInstance,
  expandOccurrencesInRange,
  type GenerationParent,
  type GenerationSeed,
  publishedIdOf,
  type SemesterWindow,
  semesterForCode,
  semesterForDate,
} from "../src/features/events/domain/instances"
import { INHERITED_FIELDS } from "../src/features/events/domain/resolveEvent"

// Materialize seriesInstance documents from seriesParent recurrence rules
// (ADR 005, execplan 008 Milestone 5).
//
//   npm run sanity:generate:instances                              current semester, dry-run
//   GENERATE_SEMESTER=H26 npm run sanity:generate:instances        chosen semester
//   GENERATE_PARENT_ID=<id> GENERATE_SEMESTER=H26 npm run sanity:generate:instances
//   GENERATE_SEMESTER=H26 npm run sanity:generate:instances:write  apply creations
//
// Scope to one parent with the GENERATE_PARENT_ID env var — `sanity exec`
// swallows a bare `--parent` flag before the script sees it.
//
// Creation uses createIfNotExists on deterministic ids, so reruns are no-ops
// and edited children are never overwritten. Orphans (children whose
// occurrence no longer matches the rule) are only reported — deletion is
// always a deliberate editor action; the exact commands are printed.

const write = process.env.SANITY_MIGRATION_WRITE === "1"
const client = getCliClient({ apiVersion: "2026-01-01" })

// Field names as stored on the document (the query projections rename
// image/openGraphImage, which do not exist under those names in GROQ).
const OVERRIDE_FIELDS = INHERITED_FIELDS.map(field =>
  field === "imageUrl" ? "image" : field,
)

type ParentRow = GenerationParent & {
  title: string | null
  rrule: string | null
  seed: GenerationSeed | null
  children: Array<ExistingInstance & { overrideCount: number }>
}

// Scope generation to a single parent. Prefer the GENERATE_PARENT_ID env var:
// `sanity exec` swallows unknown CLI flags, so a `--parent` flag never reaches
// this script. The argv form is kept only as a fallback for direct
// `node`/`tsx` invocation that bypasses the Sanity CLI.
function parentIdArgument(): string | null {
  const fromEnv = process.env.GENERATE_PARENT_ID?.trim()
  if (fromEnv) return publishedIdOf(fromEnv)

  const index = process.argv.indexOf("--parent")
  if (index === -1) return null
  const value = process.argv[index + 1]
  if (!value) {
    throw new Error("--parent requires a document id argument")
  }
  return publishedIdOf(value)
}

function semesterArgument(): SemesterWindow {
  const fromEnv = process.env.GENERATE_SEMESTER?.trim()
  if (fromEnv) {
    const semester = semesterForCode(fromEnv)
    if (!semester) {
      throw new Error(
        `Invalid GENERATE_SEMESTER "${fromEnv}". Expected VYY or HYY, for example H26.`,
      )
    }
    return semester
  }

  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Oslo",
  }).format(new Date())
  const semester = semesterForDate(today)
  if (!semester) throw new Error(`Could not resolve semester for ${today}`)
  return semester
}

async function fetchParents(parentId: string | null): Promise<ParentRow[]> {
  const overrideChecks = OVERRIDE_FIELDS.map(field => `defined(${field})`).join(
    ", ",
  )
  const overrideCount = `count([${overrideChecks}][@ == true])`

  return client.fetch(
    `*[
        _type == "arrangement"
        && coalesce(eventKind, "single") == "seriesParent"
        && !(_id in path("drafts.**"))
        && ($parentId == null || _id == $parentId)
    ] {
        _id,
        title,
        "slug": slug.current,
        "approvalStatus": coalesce(approvalStatus, "pending"),
        rrule,
        "seed": dates[0] { startDate, startTime, endTime },
        "children": *[_type == "arrangement" && parentEvent._ref == ^._id && !(_id in path("drafts.**"))] {
            _id,
            eventStatus,
            approvalStatus,
            dates[] { startDate, startTime, endTime },
            "overrideCount": ${overrideCount}
        }
    }`,
    { parentId },
  )
}

async function processParent(
  parent: ParentRow,
  semester: SemesterWindow,
): Promise<void> {
  const label = `${parent.title ?? "(uten tittel)"} <${parent._id}>`

  if (!parent.rrule || !parent.seed?.startDate) {
    console.log(`SKIP ${label}: missing rrule or seed date`)
    return
  }
  if (!parent.slug) {
    console.log(`SKIP ${label}: missing slug`)
    return
  }

  const occurrences = expandOccurrencesInRange(
    parent.rrule,
    parent.seed,
    semester,
  )
  if (occurrences.length === 0) {
    console.log(`SKIP ${label}: rule "${parent.rrule}" expands to nothing`)
    return
  }

  const existing: ExistingInstance[] = parent.children
    .filter(child =>
      child.dates?.some(
        date =>
          Boolean(date.startDate) &&
          date.startDate! >= semester.startDate &&
          date.startDate! <= semester.endDate,
      ),
    )
    .map(child => ({
      ...child,
      hasContentOverrides: child.overrideCount > 0,
    }))

  const diff = diffInstances(parent, occurrences, existing, parent.seed)
  const kept = occurrences.length - diff.toCreate.length

  console.log(`\n${label}`)
  console.log(
    `  ${semester.code} (${semester.startDate}–${semester.endDate}), ` +
      `rule ${parent.rrule} from ${parent.seed.startDate}: ` +
      `${occurrences.length} occurrences — ${diff.toCreate.length} to create, ${kept} already exist`,
  )

  for (const occurrence of diff.toCreate) {
    const doc = buildInstanceDocument(parent, occurrence)
    console.log(
      `  ${write ? "WRITE" : "DRY RUN"} createIfNotExists ${doc._id} (${doc.approvalStatus})`,
    )
  }

  if (write && diff.toCreate.length > 0) {
    const transaction = client.transaction()
    for (const occurrence of diff.toCreate) {
      transaction.createIfNotExists(buildInstanceDocument(parent, occurrence))
    }
    await transaction.commit()
  }

  if (diff.orphanedUntouched.length > 0) {
    console.log(
      `  ${diff.orphanedUntouched.length} untouched children no longer match the rule.`,
    )
    console.log("  Safe to delete after review (never deleted automatically):")
    for (const orphan of diff.orphanedUntouched) {
      console.log(`    npx sanity documents delete ${orphan._id}`)
    }
  }

  if (diff.orphanedEdited.length > 0) {
    console.log(
      `  ${diff.orphanedEdited.length} EDITED children no longer match the rule — review each in Studio:`,
    )
    for (const orphan of diff.orphanedEdited) {
      console.log(
        `    ${orphan._id} (status: ${orphan.eventStatus ?? "scheduled"})`,
      )
    }
  }
}

async function main() {
  const parentId = parentIdArgument()
  const semester = semesterArgument()
  const parents = await fetchParents(parentId)

  if (parents.length === 0) {
    console.log(
      parentId
        ? `No published seriesParent found with id ${parentId}`
        : "No published seriesParent documents found",
    )
    return
  }

  for (const parent of parents) {
    await processParent(parent, semester)
  }

  console.log(
    write ? "\nGeneration applied." : "\nDry run complete – nothing written.",
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
