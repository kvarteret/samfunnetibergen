import { z } from "zod"

const USER_AGENT =
  "Mozilla/5.0 (compatible; SamfunnetBot/1.0; +https://samfunnetibergen.no)"

// ── Public types ────────────────────────────────────────────────────────────

export interface TemplateField {
  id: number
  title: string
  component: string
  required: boolean
  class: string
  options: string[] | null
}

export interface TemplateSection {
  type: string
  title: string
  parentId: number | null // present for metaData sections
  fields: TemplateField[] // empty for non-metaData sections
}

export interface NormalizedTemplate {
  slug: string
  title: string
  sections: TemplateSection[]
  rooms: { id: number; name: string }[]
}

// ── Zod schemas for the Inertia data-page shape ────────────────────────────

const templateFieldSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  component: z.string(),
  required: z.boolean(),
  class: z.string().default(""),
  options: z.array(z.string()).nullable().default(null),
})

const sectionSchema = z.object({
  type: z.string(),
  title: z.string().default(""),
  content: z
    .object({
      parent_id: z.number().int().optional(),
      fields: z.array(templateFieldSchema).optional(),
    })
    .nullable()
    .optional()
    .default(null),
})

const templateSchema = z.object({
  title: z.string().default(""),
  sections: z.array(sectionSchema).default([]),
})

const dataPageSchema = z.object({
  props: z.object({
    eventRequestTemplate: templateSchema,
    rooms: z
      .array(z.object({ id: z.number().int(), name: z.string() }))
      .default([]),
  }),
})

// ── Pure extraction ─────────────────────────────────────────────────────────

const HTML_ENTITY_RE = /&(?:quot|amp|lt|gt|#39|apos);/g
const HTML_ENTITY_MAP: Record<string, string> = {
  "&quot;": '"',
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&#39;": "'",
  "&apos;": "'",
}

function decodeHtmlEntities(value: string): string {
  return value.replace(HTML_ENTITY_RE, entity => HTML_ENTITY_MAP[entity])
}

/**
 * Extract the Inertia page-props JSON from a fetched form HTML page. Finds the
 * `data-page="…"` attribute on the Inertia root element, HTML-entity-decodes
 * it, and JSON.parses it.
 */
export function extractDataPage(htmlSource: string): unknown {
  const match = htmlSource.match(/data-page="([^"]*)"/)
  if (!match?.[1]) {
    throw new Error(
      "No data-page attribute found — the Crescat form page may have changed its markup.",
    )
  }
  const decoded = decodeHtmlEntities(match[1])
  return JSON.parse(decoded)
}

/**
 * Normalize props.eventRequestTemplate + props.rooms into NormalizedTemplate.
 * Sections keep their source order. Non-metaData sections have empty fields[].
 */
export function normalizeTemplate(
  slug: string,
  dataPage: unknown,
): NormalizedTemplate {
  const parsed = dataPageSchema.safeParse(dataPage)
  if (!parsed.success) {
    const missing = parsed.error.issues.map(e => e.path.join(".")).join(", ")
    throw new Error(
      `The decoded data-page JSON does not match the expected Crescat form shape (missing: ${missing}). ` +
        `The page at slug "${slug}" may not be an event-request form, or its structure changed.`,
    )
  }
  const template = parsed.data.props.eventRequestTemplate

  const sections: TemplateSection[] = template.sections.map(sec => {
    const fields: TemplateField[] = (sec.content?.fields ?? []).map(f => ({
      id: f.id,
      title: f.title,
      component: f.component,
      required: f.required,
      class: f.class,
      options: f.options,
    }))
    return {
      type: sec.type,
      title: sec.title,
      parentId: sec.content?.parent_id ?? null,
      fields,
    }
  })

  const rooms = parsed.data.props.rooms.map(r => ({
    id: r.id,
    name: r.name,
  }))

  return { slug, title: template.title, sections, rooms }
}

// ── Network ─────────────────────────────────────────────────────────────────

/**
 * Fetch a public Crescat form page and return its normalized template.
 * Uses a plain GET — no CSRF session is needed.
 */
export async function fetchNormalizedTemplate(
  slug: string,
): Promise<NormalizedTemplate> {
  const url = `https://app.crescat.io/event-requests/${slug}`
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
  })
  if (!res.ok) {
    throw new Error(`GET ${slug} -> HTTP ${res.status}`)
  }
  const html = await res.text()
  return normalizeTemplate(slug, extractDataPage(html))
}

// ── Drift detection ─────────────────────────────────────────────────────────

export interface RegistryEntry {
  parentId: number
  sectionTitle: string
  fieldIds: number[]
}

/**
 * Compare a live NormalizedTemplate against a registry (what fields.ts
 * describes). Returns a list of human-readable difference strings.
 * When the list is non-empty drift has been detected.
 */
export function diffTemplateAgainstRegistry(
  template: NormalizedTemplate,
  registry: RegistryEntry[],
): string[] {
  const diffs: string[] = []

  // Build a map of parentId -> RegistryEntry for fast lookup.
  const regByParent = new Map<number, RegistryEntry>()
  for (const entry of registry) {
    regByParent.set(entry.parentId, entry)
  }

  for (let i = 0; i < template.sections.length; i++) {
    const sec = template.sections[i]
    if (sec.parentId === null || sec.fields.length === 0) continue

    const reg = regByParent.get(sec.parentId)

    // Check section title.
    if (reg && reg.sectionTitle !== sec.title) {
      diffs.push(
        `section ${i} (parent ${sec.parentId}): live title "${sec.title}" != registry "${reg.sectionTitle}"`,
      )
    }

    // Check for live fields not in the registry.
    if (reg) {
      for (const field of sec.fields) {
        if (!reg.fieldIds.includes(field.id)) {
          diffs.push(
            `section ${i} (parent ${sec.parentId}): live has field ${field.id} "${field.title}" not in registry`,
          )
        }
      }
    } else {
      // metaData section with no registry entry at all
      diffs.push(
        `section ${i} (parent ${sec.parentId}): no registry entry for this parent_id`,
      )
      for (const field of sec.fields) {
        diffs.push(`  live field ${field.id} "${field.title}"`)
      }
    }
  }

  return diffs
}
