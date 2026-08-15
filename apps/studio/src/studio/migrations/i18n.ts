/**
 * Shared, idempotent helpers for moving legacy Sanity text into the
 * field-level internationalized-array model.
 *
 * The helpers intentionally do not unset legacy fields.  A first migration
 * pass creates/repairs the canonical values and leaves the old values in
 * place for rollback and editorial review.  The audit reports the remaining
 * legacy fields; a later, explicitly approved cleanup can remove them.
 */

export type Language = "nb" | "en"

export type LocalizedItem<T = unknown> = {
  _key?: string
  _type?: string
  language?: string
  value?: T
}

export type I18nPatch = {
  set: Record<string, unknown>
  /** Paths that are safe to unset only after a separately approved cleanup. */
  unset: string[]
  missing: string[]
  conflicts: string[]
}

export type I18nIssue = {
  path: string
  kind: "missing" | "duplicate" | "conflict" | "legacy"
  message: string
}

export type TranslationFn = (text: string) => Promise<string>

const LEGACY_TO_LOCALIZED: Record<string, string> = {
  name: "localizedName",
  summary: "localizedSummary",
  body: "localizedBody",
  labels: "localizedLabels",
  eyebrow: "localizedEyebrow",
  title: "localizedTitle",
  description: "localizedDescription",
  question: "localizedQuestion",
  answer: "localizedAnswer",
  content: "localizedContent",
  heading: "localizedHeading",
  intro: "localizedIntro",
  address: "localizedAddress",
  visitAddress: "localizedVisitAddress",
  postAddress: "localizedPostAddress",
  invoiceAddress: "localizedInvoiceAddress",
  generalContact: "localizedGeneralContact",
  pressContact: "localizedPressContact",
  rolle: "localizedRole",
  role: "localizedRole",
  imageCaption: "localizedImageCaption",
  roomText: "localizedRoomText",
  organizerText: "localizedOrganizerText",
  label: "localizedLabel",
  alt: "localizedAlt",
  caption: "localizedCaption",
  bar: "localizedBar",
  soundDetails: "localizedSoundDetails",
  lightingDetails: "localizedLightingDetails",
  avDetails: "localizedAvDetails",
  suitedPurposes: "localizedSuitedPurposes",
}

// Legacy reporting is intentionally type-aware. A generic walk over every
// `name`/`title` property would report unrelated semantic fields as
// translation debt in embedded objects that merely happen to share a name.
const ROOT_LEGACY_FIELDS: Record<string, Set<string>> = {
  studentGroup: new Set(["name", "summary", "body", "labels"]),
  eventType: new Set(["name"]),
  eventTaxonomyGroup: new Set(["name"]),
  room: new Set([
    "title",
    "summary",
    "body",
    "bar",
    "soundDetails",
    "lightingDetails",
    "avDetails",
    "suitedPurposes",
  ]),
  arrangement: new Set([
    "title",
    "description",
    "imageCaption",
    "roomText",
    "organizerText",
  ]),
  homePage: new Set(["eyebrow", "title", "description"]),
  roomsPage: new Set(["eyebrow", "title", "description"]),
  groupsPage: new Set(["eyebrow", "title", "description"]),
  sponsorsPage: new Set(["eyebrow", "title", "description"]),
  usefulInfoPage: new Set(["eyebrow", "title", "intro"]),
  page: new Set(["title", "content"]),
  kontaktPage: new Set([
    "visitAddress",
    "postAddress",
    "invoiceAddress",
    "generalContact",
    "pressContact",
  ]),
  linkInBio: new Set(["heading", "bio"]),
}

const OBJECT_LEGACY_FIELDS: Record<string, Set<string>> = {
  sourceLink: new Set(["label"]),
  footerSocialLink: new Set(["label"]),
  navItem: new Set(["label"]),
  navGroup: new Set(["groupLabel"]),
  navLeaf: new Set(["label"]),
  editorialSection: new Set(["title", "body"]),
  infoAddressBlock: new Set(["heading", "body", "address"]),
  infoAccordionBlock: new Set(["heading", "intro"]),
  infoAccordionItem: new Set(["title", "body"]),
  contactPerson: new Set(["name", "rolle"]),
  contactGroup: new Set(["title"]),
  sourcedImage: new Set(["alt", "caption"]),
  faqItem: new Set(["question", "answer"]),
  floorPlan: new Set(["title"]),
  groupLink: new Set(["customLabel"]),
  sponsor: new Set(["title", "description"]),
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function isNonBlank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function hasValue(value: unknown): boolean {
  if (isNonBlank(value)) return true
  if (Array.isArray(value)) return value.length > 0
  return value != null
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function itemValue<T>(item: LocalizedItem<T> | undefined): T | undefined {
  return item && "value" in item ? item.value : undefined
}

/**
 * Return one canonical item per language while retaining the first meaningful
 * value.  Duplicate entries with identical values are harmless and collapse
 * deterministically; conflicting entries are reported to the caller.
 */
export function normalizeLocalized<T>(
  items: unknown,
  path: string,
): { items: LocalizedItem<T>[]; conflicts: string[] } {
  const byLanguage = new Map<string, LocalizedItem<T>>()
  const conflicts: string[] = []
  if (!Array.isArray(items)) return { items: [], conflicts }

  for (const candidate of items) {
    if (!isObject(candidate) || typeof candidate.language !== "string") continue
    const language = candidate.language
    const next = candidate as LocalizedItem<T>
    const current = byLanguage.get(language)
    if (!current) {
      byLanguage.set(language, next)
      continue
    }
    if (!valuesEqual(itemValue(current), itemValue(next))) {
      conflicts.push(`${path}.${language}`)
      // Keep the first value so the migration never silently replaces an
      // editor's existing canonical value with a later duplicate.
    }
  }

  return { items: [...byLanguage.values()], conflicts }
}

function keyFor(field: string, language: Language, item?: LocalizedItem) {
  return item?._key ?? `${field}-${language}`
}

function withValue<T>(
  item: LocalizedItem<T> | undefined,
  field: string,
  language: Language,
  value: T,
): LocalizedItem<T> {
  return {
    ...(item ?? {}),
    _key: keyFor(field, language, item),
    language,
    value,
  }
}

/** Translate only Portable Text spans, preserving marks, keys and block data. */
export async function translatePortableText(
  value: unknown,
  translate: TranslationFn,
): Promise<unknown[]> {
  if (!Array.isArray(value)) return []
  const output: unknown[] = []
  for (const block of value) {
    if (!isObject(block)) {
      output.push(block)
      continue
    }
    // Portable Text image blocks carry their own editorial alt/caption
    // strings. They live inside the localized body value, so translate them
    // along with spans instead of leaving Norwegian media text in English
    // content.
    if (block._type === "image") {
      const image = { ...block }
      for (const field of ["alt", "caption"] as const) {
        if (isNonBlank(image[field]))
          image[field] = await translate(image[field])
      }
      output.push(image)
      continue
    }
    if (!Array.isArray(block.children)) {
      output.push(block)
      continue
    }
    const children: unknown[] = []
    for (const child of block.children) {
      if (!isObject(child) || !isNonBlank(child.text)) {
        children.push(child)
        continue
      }
      children.push({ ...child, text: await translate(child.text) })
    }
    output.push({ ...block, children })
  }
  return output
}

function joinLegacyAnswer(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const text = value.filter(isNonBlank).join("\n")
    return text || undefined
  }
  return isNonBlank(value) ? value : undefined
}

function legacyValue(value: unknown, kind: "string" | "portable" = "string") {
  if (kind === "portable") return Array.isArray(value) ? value : undefined
  return isNonBlank(value) ? value : undefined
}

type EnsureOptions = {
  field: string
  path: string
  current: unknown
  legacy: unknown
  kind?: "string" | "portable" | "arrayText"
  translate: TranslationFn
  required?: boolean
}

async function ensureLocalized(options: EnsureOptions): Promise<{
  value?: LocalizedItem[]
  conflicts: string[]
  missing: string[]
}> {
  const {
    field,
    path,
    current,
    legacy,
    kind = "string",
    translate,
    required = true,
  } = options
  const normalized = normalizeLocalized<unknown>(current, path)
  const items = normalized.items.filter(item => isNonBlank(item.language))
  const conflicts = [...normalized.conflicts]

  const existingNb = items.find(item => item.language === "nb")
  const existingEn = items.find(item => item.language === "en")
  let nbValue = itemValue(existingNb)
  if (!hasValue(nbValue)) {
    nbValue =
      kind === "portable"
        ? legacyValue(legacy, "portable")
        : legacyValue(legacy)
    if (kind === "arrayText") nbValue = joinLegacyAnswer(legacy)
    if (hasValue(nbValue)) {
      items.push(withValue(existingNb, field, "nb", nbValue))
    }
  }

  let enValue = itemValue(existingEn)
  if (!hasValue(enValue) && hasValue(nbValue)) {
    if (kind === "portable") {
      enValue = await translatePortableText(nbValue, translate)
    } else if (kind === "arrayText") {
      enValue = await translate(String(nbValue))
    } else if (isNonBlank(nbValue)) {
      enValue = await translate(nbValue)
    }
    if (hasValue(enValue))
      items.push(withValue(existingEn, field, "en", enValue))
  }

  if (!hasValue(current) && !hasValue(legacy)) {
    return { conflicts, missing: [] }
  }
  const missing: string[] = []
  const hasNb = hasValue(items.find(item => item.language === "nb")?.value)
  const hasEn = hasValue(items.find(item => item.language === "en")?.value)
  // A legacy/source value is authoritative for the base locale.  If a
  // document already contains an English-only value but no Norwegian source,
  // do not manufacture Norwegian text or report a false migration failure;
  // the completeness audit can still enforce nb for fields whose schema marks
  // it as required.
  if (required && !hasNb && !hasEn && (hasValue(current) || hasValue(legacy))) {
    missing.push(`${path}.nb`, `${path}.en`)
  } else if (required && hasNb && !hasEn) {
    missing.push(`${path}.en`)
  }
  // Keep deterministic ordering while preserving any non-nb/en language the
  // project may add later.
  const ordered = items.sort((left, right) => {
    const order = (language?: string) =>
      language === "nb" ? 0 : language === "en" ? 1 : 2
    return order(left.language) - order(right.language)
  })
  return { value: ordered, conflicts, missing }
}

function setIfChanged(
  set: Record<string, unknown>,
  path: string,
  current: unknown,
  next: unknown,
) {
  if (!valuesEqual(current, next)) set[path] = next
}

async function applyField(
  document: Record<string, unknown>,
  patch: I18nPatch,
  path: string,
  localized: string,
  legacy: string,
  translate: TranslationFn,
  kind: EnsureOptions["kind"] = "string",
) {
  const result = await ensureLocalized({
    field: localized,
    path: `${document._id ?? "document"}.${path}`,
    current: document[localized],
    legacy: document[legacy],
    kind,
    translate,
  })
  patch.missing.push(...result.missing)
  patch.conflicts.push(...result.conflicts)
  if (result.value)
    setIfChanged(patch.set, path, document[localized], result.value)
}

function nestedPath(arrayPath: string, key: string, fieldPath: string) {
  const escaped = key.replaceAll('"', '\\"')
  return `${arrayPath}[_key == "${escaped}"].${fieldPath}`
}

export async function buildI18nPatch(
  document: Record<string, unknown>,
  translate: TranslationFn,
): Promise<I18nPatch> {
  const patch: I18nPatch = { set: {}, unset: [], missing: [], conflicts: [] }
  const type = typeof document._type === "string" ? document._type : ""

  const apply = (
    path: string,
    localized: string,
    legacy: string,
    kind: EnsureOptions["kind"] = "string",
  ) => applyField(document, patch, path, localized, legacy, translate, kind)

  const applySourceLink = async (link: unknown, path: string) => {
    if (!isObject(link)) return
    const result = await ensureLocalized({
      field: "localizedLabel",
      path: `${document._id}.${path}.localizedLabel`,
      current: link.localizedLabel,
      legacy: link.label,
      translate,
    })
    patch.missing.push(...result.missing)
    patch.conflicts.push(...result.conflicts)
    if (result.value)
      setIfChanged(
        patch.set,
        `${path}.localizedLabel`,
        link.localizedLabel,
        result.value,
      )
  }

  if (type === "studentGroup") {
    await apply("localizedName", "localizedName", "name")
    await apply("localizedSummary", "localizedSummary", "summary")
    await apply("localizedBody", "localizedBody", "body", "portable")
    await apply("localizedLabels", "localizedLabels", "labels", "arrayText")
    for (const link of Array.isArray(document.links) ? document.links : []) {
      if (!isObject(link) || !isNonBlank(link._key)) continue
      const result = await ensureLocalized({
        field: "localizedCustomLabel",
        path: `${document._id}.links[${link._key}].localizedCustomLabel`,
        current: link.localizedCustomLabel,
        legacy: link.customLabel,
        translate,
      })
      patch.missing.push(...result.missing)
      patch.conflicts.push(...result.conflicts)
      const linkPath = nestedPath("links", link._key, "localizedCustomLabel")
      if (result.value)
        setIfChanged(
          patch.set,
          linkPath,
          link.localizedCustomLabel,
          result.value,
        )
    }
  }

  if (type === "homePage") {
    await applySourceLink(document.primaryCta, "primaryCta")
  }
  if (type === "roomsPage") {
    await applySourceLink(document.bookingLink, "bookingLink")
    for (const floorPlan of Array.isArray(document.floorPlans)
      ? document.floorPlans
      : []) {
      if (!isObject(floorPlan) || !isNonBlank(floorPlan._key)) continue
      const result = await ensureLocalized({
        field: "localizedTitle",
        path: `${document._id}.floorPlans[${floorPlan._key}].localizedTitle`,
        current: floorPlan.localizedTitle,
        legacy: floorPlan.title,
        translate,
      })
      patch.missing.push(...result.missing)
      patch.conflicts.push(...result.conflicts)
      const floorPath = nestedPath(
        "floorPlans",
        floorPlan._key,
        "localizedTitle",
      )
      if (result.value)
        setIfChanged(
          patch.set,
          floorPath,
          floorPlan.localizedTitle,
          result.value,
        )
    }
  }

  if (type === "eventType" || type === "eventTaxonomyGroup") {
    await apply("localizedName", "localizedName", "name")
  }

  if (type === "room") {
    await apply("localizedTitle", "localizedTitle", "title")
    await apply("localizedSummary", "localizedSummary", "summary")
    await apply("localizedBody", "localizedBody", "body", "portable")
    await apply("localizedBar", "localizedBar", "bar")
    await apply(
      "localizedSoundDetails",
      "localizedSoundDetails",
      "soundDetails",
    )
    await apply(
      "localizedLightingDetails",
      "localizedLightingDetails",
      "lightingDetails",
    )
    await apply("localizedAvDetails", "localizedAvDetails", "avDetails")
    // suitedPurposes is a legacy tag array.  It is represented in one
    // localized text field (one purpose per line) by the schema migration.
    await apply(
      "localizedSuitedPurposes",
      "localizedSuitedPurposes",
      "suitedPurposes",
      "arrayText",
    )
    for (const image of Array.isArray(document.images) ? document.images : []) {
      if (!isObject(image) || !isNonBlank(image._key)) continue
      const base = nestedPath("images", image._key, "")
      const imagePatch = await ensureLocalized({
        field: "localizedAlt",
        path: `${document._id}.images[${image._key}].localizedAlt`,
        current: image.localizedAlt,
        legacy: image.alt,
        translate,
      })
      patch.missing.push(...imagePatch.missing)
      patch.conflicts.push(...imagePatch.conflicts)
      if (imagePatch.value)
        setIfChanged(
          patch.set,
          `${base}localizedAlt`,
          image.localizedAlt,
          imagePatch.value,
        )
      const captionPatch = await ensureLocalized({
        field: "localizedCaption",
        path: `${document._id}.images[${image._key}].localizedCaption`,
        current: image.localizedCaption,
        legacy: image.caption,
        translate,
      })
      patch.missing.push(...captionPatch.missing)
      patch.conflicts.push(...captionPatch.conflicts)
      if (captionPatch.value)
        setIfChanged(
          patch.set,
          `${base}localizedCaption`,
          image.localizedCaption,
          captionPatch.value,
        )
    }
  }

  if (type === "arrangement") {
    await apply("localizedTitle", "localizedTitle", "title")
    await apply(
      "localizedDescription",
      "localizedDescription",
      "description",
      "portable",
    )
    await apply(
      "localizedImageCaption",
      "localizedImageCaption",
      "imageCaption",
    )
    await apply("localizedRoomText", "localizedRoomText", "roomText")
    await apply(
      "localizedOrganizerText",
      "localizedOrganizerText",
      "organizerText",
    )
  }

  if (
    type === "homePage" ||
    type === "roomsPage" ||
    type === "sponsorsPage" ||
    type === "groupsPage"
  ) {
    await apply("localizedEyebrow", "localizedEyebrow", "eyebrow")
    await apply("localizedTitle", "localizedTitle", "title")
    await apply("localizedDescription", "localizedDescription", "description")
  }

  if (type === "usefulInfoPage") {
    await apply("localizedEyebrow", "localizedEyebrow", "eyebrow")
    await apply("localizedTitle", "localizedTitle", "title")
    await apply("localizedIntro", "localizedIntro", "intro")
  }

  if (type === "page") {
    await apply("localizedTitle", "localizedTitle", "title")
    await apply("localizedContent", "localizedContent", "content", "arrayText")
  }

  if (type === "kontaktPage") {
    await apply(
      "localizedVisitAddress",
      "localizedVisitAddress",
      "visitAddress",
      "arrayText",
    )
    await apply(
      "localizedPostAddress",
      "localizedPostAddress",
      "postAddress",
      "arrayText",
    )
    await apply(
      "localizedInvoiceAddress",
      "localizedInvoiceAddress",
      "invoiceAddress",
      "arrayText",
    )
    await apply(
      "localizedGeneralContact",
      "localizedGeneralContact",
      "generalContact",
      "arrayText",
    )
    await apply(
      "localizedPressContact",
      "localizedPressContact",
      "pressContact",
      "arrayText",
    )
    for (const group of Array.isArray(document.contactGroups)
      ? document.contactGroups
      : []) {
      if (!isObject(group) || !isNonBlank(group._key)) continue
      const groupPath = nestedPath("contactGroups", group._key, "")
      const title = await ensureLocalized({
        field: "localizedTitle",
        path: `${document._id}.${groupPath}localizedTitle`,
        current: group.localizedTitle,
        legacy: group.title,
        translate,
      })
      patch.missing.push(...title.missing)
      patch.conflicts.push(...title.conflicts)
      if (title.value)
        setIfChanged(
          patch.set,
          `${groupPath}localizedTitle`,
          group.localizedTitle,
          title.value,
        )
      for (const person of Array.isArray(group.persons) ? group.persons : []) {
        if (!isObject(person) || !isNonBlank(person._key)) continue
        const name = await ensureLocalized({
          field: "localizedName",
          path: `${document._id}.${groupPath}persons[${person._key}].localizedName`,
          current: person.localizedName,
          legacy: person.name,
          translate,
        })
        patch.missing.push(...name.missing)
        patch.conflicts.push(...name.conflicts)
        const role = await ensureLocalized({
          field: "localizedRole",
          path: `${document._id}.${groupPath}persons[${person._key}].localizedRole`,
          current: person.localizedRole,
          legacy: person.rolle,
          translate,
        })
        patch.missing.push(...role.missing)
        patch.conflicts.push(...role.conflicts)
        const personBase = nestedPath(`${groupPath}persons`, person._key, "")
        if (name.value)
          setIfChanged(
            patch.set,
            `${personBase}localizedName`,
            person.localizedName,
            name.value,
          )
        if (role.value)
          setIfChanged(
            patch.set,
            `${personBase}localizedRole`,
            person.localizedRole,
            role.value,
          )
      }
    }
  }

  if (type === "footer") {
    for (const item of Array.isArray(document.socialLinks)
      ? document.socialLinks
      : []) {
      if (!isObject(item) || !isNonBlank(item._key)) continue
      const result = await ensureLocalized({
        field: "localizedLabel",
        path: `${document._id}.socialLinks[${item._key}].localizedLabel`,
        current: item.localizedLabel,
        legacy: item.label,
        translate,
      })
      patch.missing.push(...result.missing)
      patch.conflicts.push(...result.conflicts)
      const itemPath = nestedPath("socialLinks", item._key, "localizedLabel")
      if (result.value)
        setIfChanged(patch.set, itemPath, item.localizedLabel, result.value)
    }
  }

  if (type === "navbar") {
    const walk = async (items: unknown, path: string) => {
      if (!Array.isArray(items)) return
      for (const item of items) {
        if (!isObject(item) || !isNonBlank(item._key)) continue
        const itemPath = nestedPath(path, item._key, "")
        if (item._type === "navGroup") {
          const result = await ensureLocalized({
            field: "localizedGroupLabel",
            path: `${document._id}.${itemPath}localizedGroupLabel`,
            current: item.localizedGroupLabel,
            legacy: item.groupLabel,
            translate,
          })
          patch.missing.push(...result.missing)
          patch.conflicts.push(...result.conflicts)
          if (result.value)
            setIfChanged(
              patch.set,
              `${itemPath}localizedGroupLabel`,
              item.localizedGroupLabel,
              result.value,
            )
          await walk(item.items, `${itemPath}items`)
        } else {
          const result = await ensureLocalized({
            field: "localizedLabel",
            path: `${document._id}.${itemPath}localizedLabel`,
            current: item.localizedLabel,
            legacy: item.label,
            translate,
          })
          patch.missing.push(...result.missing)
          patch.conflicts.push(...result.conflicts)
          if (result.value)
            setIfChanged(
              patch.set,
              `${itemPath}localizedLabel`,
              item.localizedLabel,
              result.value,
            )
          await walk(item.children, `${itemPath}children`)
        }
      }
    }
    await walk(document.items, "items")
  }

  if (type === "linkInBio") {
    await apply("localizedHeading", "localizedHeading", "heading")
    await apply("localizedBio", "localizedBio", "bio", "arrayText")
    for (const item of Array.isArray(document.links) ? document.links : []) {
      if (!isObject(item) || !isNonBlank(item._key) || !isObject(item.link))
        continue
      await applySourceLink(item.link, nestedPath("links", item._key, "link"))
    }
  }

  // Shared nested editorial/FAQ/image structures occur on multiple document
  // types.  They are handled after the root fields so a single audit can cover
  // every published page without bespoke route logic.
  if (["groupsPage", "roomsPage", "usefulInfoPage"].includes(type)) {
    for (const section of Array.isArray(document.sections)
      ? document.sections
      : []) {
      if (!isObject(section) || !isNonBlank(section._key)) continue
      const sectionPath = nestedPath("sections", section._key, "")
      const title = await ensureLocalized({
        field: "localizedTitle",
        path: `${document._id}.${sectionPath}localizedTitle`,
        current: section.localizedTitle,
        legacy: section.title,
        translate,
      })
      const body = await ensureLocalized({
        field: "localizedBody",
        path: `${document._id}.${sectionPath}localizedBody`,
        current: section.localizedBody,
        legacy: section.body,
        kind: "portable",
        translate,
      })
      patch.missing.push(...title.missing, ...body.missing)
      patch.conflicts.push(...title.conflicts, ...body.conflicts)
      if (title.value)
        setIfChanged(
          patch.set,
          `${sectionPath}localizedTitle`,
          section.localizedTitle,
          title.value,
        )
      if (body.value)
        setIfChanged(
          patch.set,
          `${sectionPath}localizedBody`,
          section.localizedBody,
          body.value,
        )
      if (section._type === "infoAddressBlock") {
        for (const [localized, legacy] of [
          ["localizedHeading", "heading"],
          ["localizedAddress", "address"],
        ] as const) {
          const result = await ensureLocalized({
            field: localized,
            path: `${document._id}.${sectionPath}${localized}`,
            current: section[localized],
            legacy: section[legacy],
            translate,
          })
          patch.missing.push(...result.missing)
          patch.conflicts.push(...result.conflicts)
          if (result.value)
            setIfChanged(
              patch.set,
              `${sectionPath}${localized}`,
              section[localized],
              result.value,
            )
        }
      }
      if (section._type === "infoAccordionBlock") {
        for (const [localized, legacy, kind] of [
          ["localizedHeading", "heading", "string"],
          ["localizedIntro", "intro", "arrayText"],
        ] as const) {
          const result = await ensureLocalized({
            field: localized,
            path: `${document._id}.${sectionPath}${localized}`,
            current: section[localized],
            legacy: section[legacy],
            kind,
            translate,
          })
          patch.missing.push(...result.missing)
          patch.conflicts.push(...result.conflicts)
          if (result.value)
            setIfChanged(
              patch.set,
              `${sectionPath}${localized}`,
              section[localized],
              result.value,
            )
        }
        for (const item of Array.isArray(section.items) ? section.items : []) {
          if (!isObject(item) || !isNonBlank(item._key)) continue
          const itemPath = nestedPath(`${sectionPath}items`, item._key, "")
          for (const [localized, legacy, kind] of [
            ["localizedTitle", "title", "string"],
            ["localizedBody", "body", "portable"],
          ] as const) {
            const result = await ensureLocalized({
              field: localized,
              path: `${document._id}.${itemPath}${localized}`,
              current: item[localized],
              legacy: item[legacy],
              kind,
              translate,
            })
            patch.missing.push(...result.missing)
            patch.conflicts.push(...result.conflicts)
            if (result.value)
              setIfChanged(
                patch.set,
                `${itemPath}${localized}`,
                item[localized],
                result.value,
              )
          }
        }
      }
    }
  }
  if (type === "groupsPage") {
    for (const item of Array.isArray(document.faq) ? document.faq : []) {
      if (!isObject(item) || !isNonBlank(item._key)) continue
      const itemPath = nestedPath("faq", item._key, "")
      const question = await ensureLocalized({
        field: "localizedQuestion",
        path: `${document._id}.${itemPath}localizedQuestion`,
        current: item.localizedQuestion,
        legacy: item.question,
        translate,
      })
      const answer = await ensureLocalized({
        field: "localizedAnswer",
        path: `${document._id}.${itemPath}localizedAnswer`,
        current: item.localizedAnswer,
        legacy: item.answer,
        kind: "arrayText",
        translate,
      })
      patch.missing.push(...question.missing, ...answer.missing)
      patch.conflicts.push(...question.conflicts, ...answer.conflicts)
      if (question.value)
        setIfChanged(
          patch.set,
          `${itemPath}localizedQuestion`,
          item.localizedQuestion,
          question.value,
        )
      if (answer.value)
        setIfChanged(
          patch.set,
          `${itemPath}localizedAnswer`,
          item.localizedAnswer,
          answer.value,
        )
    }
  }

  if (type === "sponsorsPage") {
    for (const sponsor of Array.isArray(document.sponsors)
      ? document.sponsors
      : []) {
      if (!isObject(sponsor) || !isNonBlank(sponsor._key)) continue
      const sponsorPath = nestedPath("sponsors", sponsor._key, "")
      for (const [localized, legacy, kind] of [
        ["localizedTitle", "title", "string"],
        ["localizedDescription", "description", "portable"],
      ] as const) {
        const result = await ensureLocalized({
          field: localized,
          path: `${document._id}.${sponsorPath}${localized}`,
          current: sponsor[localized],
          legacy: sponsor[legacy],
          kind,
          translate,
        })
        patch.missing.push(...result.missing)
        patch.conflicts.push(...result.conflicts)
        if (result.value)
          setIfChanged(
            patch.set,
            `${sponsorPath}${localized}`,
            sponsor[localized],
            result.value,
          )
      }
      const logo = isObject(sponsor.logo) ? sponsor.logo : undefined
      const logoAlt = await ensureLocalized({
        field: "localizedLogoAlt",
        path: `${document._id}.${sponsorPath}localizedLogoAlt`,
        current: sponsor.localizedLogoAlt,
        legacy: logo?.alt ?? sponsor.title,
        translate,
      })
      patch.missing.push(...logoAlt.missing)
      patch.conflicts.push(...logoAlt.conflicts)
      if (logoAlt.value)
        setIfChanged(
          patch.set,
          `${sponsorPath}localizedLogoAlt`,
          sponsor.localizedLogoAlt,
          logoAlt.value,
        )
    }
  }

  return patch
}

export function findI18nIssues(
  document: Record<string, unknown>,
  options: { includeLegacy?: boolean } = {},
): I18nIssue[] {
  const issues: I18nIssue[] = []
  const rootType =
    typeof document._type === "string"
      ? document._type
      : typeof document._id === "string" && document._id in ROOT_LEGACY_FIELDS
        ? document._id
        : undefined
  const walk = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      const { conflicts } = normalizeLocalized(value, path)
      for (const conflict of conflicts) {
        issues.push({
          path: conflict,
          kind: "conflict",
          message: "Conflicting duplicate language entries",
        })
      }
      const seen = new Set<string>()
      for (const item of value) {
        if (!isObject(item) || typeof item.language !== "string") continue
        if (seen.has(item.language)) {
          issues.push({
            path: `${path}.${item.language}`,
            kind: "duplicate",
            message: "Duplicate language entry",
          })
        }
        seen.add(item.language)
      }
      for (const [index, item] of value.entries())
        walk(item, `${path}[${index}]`)
      return
    }
    if (!isObject(value)) return
    const ownerType = typeof value._type === "string" ? value._type : rootType
    const allowedLegacy = ownerType
      ? (ROOT_LEGACY_FIELDS[ownerType] ??
        OBJECT_LEGACY_FIELDS[ownerType] ??
        new Set<string>())
      : new Set<string>()
    for (const [key, child] of Object.entries(value)) {
      const childPath = path ? `${path}.${key}` : key
      if (
        options.includeLegacy !== false &&
        allowedLegacy.has(key) &&
        LEGACY_TO_LOCALIZED[key] &&
        LEGACY_TO_LOCALIZED[key] in value &&
        hasValue(child)
      ) {
        issues.push({
          path: childPath,
          kind: "legacy",
          message: "Legacy field still populated",
        })
      }
      walk(child, childPath)
    }
  }
  walk(document, "")
  return issues
}

export function missingCanonicalFields(
  document: Record<string, unknown>,
): string[] {
  const missing: string[] = []
  const check = (
    path: string,
    value: unknown,
    legacy?: unknown,
    required = false,
  ) => {
    const { items } = normalizeLocalized(value, path)
    const hasNb = items.some(
      item => item.language === "nb" && hasValue(item.value),
    )
    const hasEn = items.some(
      item => item.language === "en" && hasValue(item.value),
    )
    const hasLegacy = hasValue(legacy)
    // Optional fields are complete when there is no Norwegian source to
    // translate.  An existing English-only value is useful content and
    // should not force us to invent a Norwegian source.  Once nb (or a
    // legacy Norwegian value) exists, English is required as well.
    if (!hasNb && !hasEn && !hasLegacy) {
      if (required) missing.push(`${path}.nb`, `${path}.en`)
      return
    }
    if ((required || hasLegacy) && !hasNb) missing.push(`${path}.nb`)
    if ((required || hasNb || hasLegacy) && !hasEn) missing.push(`${path}.en`)
  }
  const type = typeof document._type === "string" ? document._type : ""
  const rootFields: Record<string, string[]> = {
    studentGroup: ["localizedName", "localizedSummary", "localizedBody"],
    eventType: ["localizedName"],
    eventTaxonomyGroup: ["localizedName"],
    room: ["localizedTitle", "localizedSummary", "localizedBody"],
    arrangement: ["localizedTitle", "localizedDescription"],
    homePage: ["localizedEyebrow", "localizedTitle", "localizedDescription"],
    roomsPage: ["localizedEyebrow", "localizedTitle", "localizedDescription"],
    sponsorsPage: [
      "localizedEyebrow",
      "localizedTitle",
      "localizedDescription",
    ],
    groupsPage: ["localizedEyebrow", "localizedTitle", "localizedDescription"],
    usefulInfoPage: ["localizedEyebrow", "localizedTitle", "localizedIntro"],
    page: ["localizedTitle", "localizedContent"],
    kontaktPage: [
      "localizedVisitAddress",
      "localizedPostAddress",
      "localizedInvoiceAddress",
      "localizedGeneralContact",
      "localizedPressContact",
    ],
    linkInBio: ["localizedHeading", "localizedBio"],
  }
  const requiredRootFields: Record<string, string[]> = {
    studentGroup: ["localizedName", "localizedSummary"],
    eventType: ["localizedName"],
    eventTaxonomyGroup: ["localizedName"],
    room: ["localizedTitle", "localizedSummary"],
    arrangement: ["localizedTitle"],
    homePage: ["localizedTitle"],
    roomsPage: ["localizedTitle"],
    groupsPage: ["localizedTitle"],
    usefulInfoPage: ["localizedTitle"],
    page: ["localizedTitle"],
  }
  for (const name of rootFields[type] ?? []) {
    const legacy = name.startsWith("localized")
      ? name
          .slice("localized".length, name.length)
          .replace(/^./, letter => letter.toLowerCase())
      : undefined
    const arrangementChild =
      type === "arrangement" &&
      name === "localizedTitle" &&
      ["seriesInstance", "festivalSession"].includes(
        String(document.eventKind ?? ""),
      )
    check(
      name,
      document[name],
      legacy ? document[legacy] : undefined,
      Boolean(requiredRootFields[type]?.includes(name)) && !arrangementChild,
    )
  }

  if (type === "arrangement" && document.eventKind === "festivalParent") {
    check(
      "localizedDescription",
      document.localizedDescription,
      document.description,
      true,
    )
  }

  const checkNested = (
    items: unknown,
    arrayPath: string,
    fields: Array<[string, string, boolean?]>,
  ) => {
    if (!Array.isArray(items)) return
    for (const item of items) {
      if (!isObject(item) || !isNonBlank(item._key)) continue
      for (const [localized, legacy, required] of fields) {
        check(
          `${arrayPath}[${item._key}].${localized}`,
          item[localized],
          item[legacy],
          required,
        )
      }
    }
  }
  if (["groupsPage", "roomsPage", "usefulInfoPage"].includes(type)) {
    if (Array.isArray(document.sections)) {
      for (const section of document.sections) {
        if (!isObject(section) || !isNonBlank(section._key)) continue
        const sectionPath = `sections[${section._key}]`
        // Section titles can be supplied in English even when the legacy
        // Norwegian title was never authored (for example the `adkomst`
        // block). If a Norwegian source exists, `check` still requires its
        // English counterpart; otherwise this optional label is complete.
        check(
          `${sectionPath}.localizedTitle`,
          section.localizedTitle,
          section.title,
        )
        check(
          `${sectionPath}.localizedBody`,
          section.localizedBody,
          section.body,
        )
        if (section._type === "infoAddressBlock") {
          check(
            `${sectionPath}.localizedHeading`,
            section.localizedHeading,
            section.heading,
            true,
          )
          check(
            `${sectionPath}.localizedAddress`,
            section.localizedAddress,
            section.address,
          )
        }
        if (section._type === "infoAccordionBlock") {
          check(
            `${sectionPath}.localizedHeading`,
            section.localizedHeading,
            section.heading,
            true,
          )
          check(
            `${sectionPath}.localizedIntro`,
            section.localizedIntro,
            section.intro,
          )
          checkNested(section.items, `${sectionPath}.items`, [
            ["localizedTitle", "title", true],
            ["localizedBody", "body"],
          ])
        }
      }
    }
  }
  if (type === "groupsPage") {
    checkNested(document.faq, "faq", [
      ["localizedQuestion", "question", true],
      ["localizedAnswer", "answer", true],
    ])
  }
  if (type === "room") {
    checkNested(document.images, "images", [
      ["localizedAlt", "alt"],
      ["localizedCaption", "caption"],
    ])
  }
  if (type === "kontaktPage" && Array.isArray(document.contactGroups)) {
    for (const group of document.contactGroups) {
      if (!isObject(group) || !isNonBlank(group._key)) continue
      const groupPath = `contactGroups[${group._key}]`
      check(`${groupPath}.localizedTitle`, group.localizedTitle, group.title)
      if (Array.isArray(group.persons)) {
        for (const person of group.persons) {
          if (!isObject(person) || !isNonBlank(person._key)) continue
          const personPath = `${groupPath}.persons[${person._key}]`
          check(
            `${personPath}.localizedName`,
            person.localizedName,
            person.name,
          )
          check(
            `${personPath}.localizedRole`,
            person.localizedRole,
            person.rolle,
          )
        }
      }
    }
  }
  if (type === "footer") {
    checkNested(document.socialLinks, "socialLinks", [
      ["localizedLabel", "label"],
    ])
  }
  if (type === "navbar") {
    const walkNav = (items: unknown, path: string) => {
      if (!Array.isArray(items)) return
      for (const item of items) {
        if (!isObject(item) || !isNonBlank(item._key)) continue
        const itemPath = `${path}[${item._key}]`
        if (item._type === "navGroup") {
          check(
            `${itemPath}.localizedGroupLabel`,
            item.localizedGroupLabel,
            item.groupLabel,
          )
          walkNav(item.items, `${itemPath}.items`)
        } else {
          check(`${itemPath}.localizedLabel`, item.localizedLabel, item.label)
          walkNav(item.children, `${itemPath}.children`)
        }
      }
    }
    walkNav(document.items, "items")
  }
  if (type === "sponsorsPage") {
    for (const sponsor of Array.isArray(document.sponsors)
      ? document.sponsors
      : []) {
      if (!isObject(sponsor) || !isNonBlank(sponsor._key)) continue
      const sponsorPath = `sponsors[${sponsor._key}]`
      check(
        `${sponsorPath}.localizedTitle`,
        sponsor.localizedTitle,
        sponsor.title,
        true,
      )
      check(
        `${sponsorPath}.localizedDescription`,
        sponsor.localizedDescription,
        sponsor.description,
      )
      const logo = isObject(sponsor.logo) ? sponsor.logo : undefined
      check(
        `${sponsorPath}.localizedLogoAlt`,
        sponsor.localizedLogoAlt,
        logo?.alt ?? sponsor.title,
      )
    }
  }
  if (type === "studentGroup") {
    checkNested(document.links, "links", [
      ["localizedCustomLabel", "customLabel"],
    ])
  }
  if (type === "roomsPage") {
    checkNested(document.floorPlans, "floorPlans", [
      ["localizedTitle", "title"],
    ])
  }
  if (type === "homePage" && isObject(document.primaryCta)) {
    check(
      "primaryCta.localizedLabel",
      document.primaryCta.localizedLabel,
      document.primaryCta.label,
    )
  }
  if (type === "roomsPage" && isObject(document.bookingLink)) {
    check(
      "bookingLink.localizedLabel",
      document.bookingLink.localizedLabel,
      document.bookingLink.label,
    )
  }
  if (type === "linkInBio") {
    for (const item of Array.isArray(document.links) ? document.links : []) {
      if (!isObject(item) || !isNonBlank(item._key) || !isObject(item.link))
        continue
      check(
        `links[${item._key}].link.localizedLabel`,
        item.link.localizedLabel,
        item.link.label,
      )
    }
  }
  return missing
}

/**
 * Find populated localized arrays that still lack an English counterpart.
 * This path-aware walk deliberately keys off known localized field names and
 * their sibling legacy source rather than treating every semantic `name`
 * property in arbitrary nested objects as a translation field.
 */
export function missingEnglishLocalizedFields(
  document: Record<string, unknown>,
): string[] {
  const missing = new Set<string>()
  const legacyByLocalized = new Map<string, string[]>()
  for (const [legacy, localized] of Object.entries(LEGACY_TO_LOCALIZED)) {
    const fields = legacyByLocalized.get(localized) ?? []
    fields.push(legacy)
    legacyByLocalized.set(localized, fields)
  }

  const walk = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      for (const [index, item] of value.entries()) {
        walk(item, `${path}[${index}]`)
      }
      return
    }
    if (!isObject(value)) return
    for (const [key, child] of Object.entries(value)) {
      const childPath = path ? `${path}.${key}` : key
      if (key.startsWith("localized") && Array.isArray(child)) {
        const { items } = normalizeLocalized(child, childPath)
        const hasNb = items.some(
          item => item.language === "nb" && hasValue(item.value),
        )
        const hasEn = items.some(
          item => item.language === "en" && hasValue(item.value),
        )
        const hasLegacy = (legacyByLocalized.get(key) ?? []).some(legacy =>
          hasValue(value[legacy]),
        )
        if ((hasNb || hasLegacy) && !hasEn) missing.add(`${childPath}.en`)
      }
      walk(child, childPath)
    }
  }
  walk(document, "")
  return [...missing].sort()
}

/** Completeness used by custom publish/approval actions. */
export function missingPublicLocalizedFields(
  document: Record<string, unknown>,
): string[] {
  const structuralIssues = findI18nIssues(document, {
    includeLegacy: false,
  })
    .filter(issue => issue.kind === "duplicate" || issue.kind === "conflict")
    .map(issue => issue.path)
  return [
    ...new Set([
      ...missingCanonicalFields(document),
      ...missingEnglishLocalizedFields(document),
      ...structuralIssues,
    ]),
  ].sort()
}
