export type LocalizedItem<T> = { _key: string; language: string; value: T }

export type GroupDocument = {
  _id: string
  _type: "groupsPage" | "studentGroup"
  name?: string
  summary?: string
  body?: unknown[]
  eyebrow?: string
  title?: string
  description?: string
  localizedName?: LocalizedItem<string>[]
  localizedSummary?: LocalizedItem<string>[]
  localizedBody?: LocalizedItem<unknown[]>[]
  localizedEyebrow?: LocalizedItem<string>[]
  localizedTitle?: LocalizedItem<string>[]
  localizedDescription?: LocalizedItem<string>[]
  sections?: Array<{
    _key: string
    title?: string
    body?: unknown[]
    localizedTitle?: LocalizedItem<string>[]
    localizedBody?: LocalizedItem<unknown[]>[]
  }>
  faq?: Array<{
    _key: string
    question?: string
    answer?: string[]
    localizedQuestion?: LocalizedItem<string>[]
    localizedAnswer?: LocalizedItem<string>[]
  }>
}

function seed<T>(
  current: LocalizedItem<T>[] | undefined,
  field: string,
  value: T | undefined,
) {
  if (value == null) {
    return {}
  }
  const norwegian = current?.find(item => item.language === "nb")
  if (norwegian) {
    if (norwegian.value != null) return {}
    return {
      [field]: current?.map(item =>
        item === norwegian ? { ...item, value } : item,
      ),
    }
  }
  return {
    [field]: [
      ...(current ?? []),
      { _key: `nb-${field}`, language: "nb", value },
    ],
  }
}

export function buildGroupLocalePatch(document: GroupDocument) {
  if (document._type === "studentGroup") {
    return {
      ...seed(document.localizedName, "localizedName", document.name),
      ...seed(document.localizedSummary, "localizedSummary", document.summary),
      ...seed(document.localizedBody, "localizedBody", document.body),
    }
  }

  const patch: Record<string, unknown> = {
    ...seed(document.localizedEyebrow, "localizedEyebrow", document.eyebrow),
    ...seed(document.localizedTitle, "localizedTitle", document.title),
    ...seed(
      document.localizedDescription,
      "localizedDescription",
      document.description,
    ),
  }

  for (const section of document.sections ?? []) {
    const title = seed(
      section.localizedTitle,
      "localizedTitle",
      section.title,
    ).localizedTitle
    const body = seed(
      section.localizedBody,
      "localizedBody",
      section.body,
    ).localizedBody
    if (title) {
      patch[`sections[_key == "${section._key}"].localizedTitle`] = title
    }
    if (body) {
      patch[`sections[_key == "${section._key}"].localizedBody`] = body
    }
  }

  for (const item of document.faq ?? []) {
    const question = seed(
      item.localizedQuestion,
      "localizedQuestion",
      item.question,
    ).localizedQuestion
    const answer = seed(
      item.localizedAnswer,
      "localizedAnswer",
      item.answer?.join("\n"),
    ).localizedAnswer
    if (question) {
      patch[`faq[_key == "${item._key}"].localizedQuestion`] = question
    }
    if (answer) {
      patch[`faq[_key == "${item._key}"].localizedAnswer`] = answer
    }
  }

  return patch
}

export function mergeGroupLocalePatches(
  ...patches: Array<Record<string, unknown>>
) {
  const merged: Record<string, unknown> = {}
  for (const patch of patches) {
    for (const [field, value] of Object.entries(patch)) {
      const current = merged[field]
      if (Array.isArray(current) && Array.isArray(value)) {
        merged[field] = [
          ...current,
          ...value.filter(
            next =>
              !current.some(
                existing =>
                  typeof existing === "object" &&
                  existing !== null &&
                  typeof next === "object" &&
                  next !== null &&
                  "language" in existing &&
                  "language" in next &&
                  existing.language === next.language,
              ),
          ),
        ]
      } else {
        merged[field] = value
      }
    }
  }
  return merged
}

export type PublishedGroupLocaleDocument = {
  _id: string
  _type: "groupsPage" | "studentGroup"
  localizedName?: LocalizedItem<string>[]
  localizedSummary?: LocalizedItem<string>[]
  localizedBody?: LocalizedItem<unknown[]>[]
  localizedTitle?: LocalizedItem<string>[]
  localizedDescription?: LocalizedItem<string>[]
  sections?: Array<{
    _key: string
    title?: string
    body?: unknown[]
    localizedTitle?: LocalizedItem<string>[]
    localizedBody?: LocalizedItem<unknown[]>[]
  }>
  faq?: Array<{
    _key: string
    localizedQuestion?: LocalizedItem<string>[]
    localizedAnswer?: LocalizedItem<string>[]
  }>
}

export function findMissingEnglishGroupFields(
  document: PublishedGroupLocaleDocument,
) {
  const missing: string[] = []
  const hasEnglish = (items?: LocalizedItem<unknown>[]) =>
    items?.some(item => item.language === "en" && item.value != null)

  if (document._type === "studentGroup") {
    if (!hasEnglish(document.localizedName)) missing.push("localizedName.en")
    if (!hasEnglish(document.localizedSummary)) {
      missing.push("localizedSummary.en")
    }
    if (!hasEnglish(document.localizedBody)) missing.push("localizedBody.en")
    return missing
  }

  if (!hasEnglish(document.localizedTitle)) missing.push("localizedTitle.en")
  if (!hasEnglish(document.localizedDescription)) {
    missing.push("localizedDescription.en")
  }
  for (const section of document.sections ?? []) {
    if (section.title && !hasEnglish(section.localizedTitle)) {
      missing.push(`sections[${section._key}].localizedTitle.en`)
    }
    if (section.body && !hasEnglish(section.localizedBody)) {
      missing.push(`sections[${section._key}].localizedBody.en`)
    }
  }
  for (const item of document.faq ?? []) {
    if (!hasEnglish(item.localizedQuestion)) {
      missing.push(`faq[${item._key}].localizedQuestion.en`)
    }
    if (!hasEnglish(item.localizedAnswer)) {
      missing.push(`faq[${item._key}].localizedAnswer.en`)
    }
  }
  return missing
}
