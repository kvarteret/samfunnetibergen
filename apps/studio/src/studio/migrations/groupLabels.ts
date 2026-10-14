export const GROUP_LABEL_ITEM_TYPE =
  "internationalizedArrayStudentGroupLabelValueValue"

type LabelItem = {
  _key?: string
  _type?: string
  language?: string
  value?: unknown
}

export type GroupLabelsDocument = {
  slug?: { current?: string }
  labels?: string[]
  localizedLabels?: LabelItem[]
}

const englishLabels: Record<string, string> = {
  Bar: "Bar",
  Drift: "Operation",
  Kultur: "Culture",
  Kunnskap: "Knowledge",
}

// Restore the bar team's legacy tag and use the communications department's
// existing category for its subgroups; E-tjenesten operates internal systems.
const missingLabelsBySlug: Record<string, string[]> = {
  "skjenke-gruppen": ["Bar"],
  "e-tjenesten": ["Drift"],
  foto: ["Drift"],
  grafisk: ["Drift"],
  some: ["Drift"],
}

function readLabels(value: unknown): string[] {
  if (Array.isArray(value)) return [...new Set(value.flatMap(readLabels))]
  if (value && typeof value === "object" && "value" in value) {
    return readLabels(value.value)
  }
  return typeof value === "string"
    ? [
        ...new Set(
          value
            .split(/\r?\n/)
            .map(label => label.trim())
            .filter(Boolean),
        ),
      ]
    : []
}

/** Repair types and empty translations without replacing editorial values. */
export function buildGroupLabelsPatch(document: GroupLabelsDocument) {
  const current = document.localizedLabels ?? []
  const languages = current.map(item => item.language)
  if (new Set(languages).size !== languages.length) {
    throw new Error("Duplicate label languages need editorial review")
  }
  const norwegian = readLabels(
    current.find(item => item.language === "nb")?.value,
  )
  const legacy = readLabels(document.labels)
  const source = norwegian.length
    ? norwegian
    : legacy.length
      ? legacy
      : (missingLabelsBySlug[document.slug?.current ?? ""] ?? [])
  const translated = source.map(label => englishLabels[label]).filter(Boolean)
  const defaults: Record<string, string> = {
    nb: source.join("\n"),
    en: translated.length === source.length ? translated.join("\n") : "",
  }
  const repaired = current.map(item => {
    const labels = readLabels(item.value)
    const value = labels.length
      ? labels.join("\n")
      : defaults[item.language ?? ""]
    if (!value) throw new Error(`Cannot infer ${item.language} labels`)
    if (!item._key)
      throw new Error("Label item without a key needs editorial review")
    return { ...item, _type: GROUP_LABEL_ITEM_TYPE, value }
  })
  for (const language of ["nb", "en"]) {
    if (repaired.some(item => item.language === language)) continue
    const value = defaults[language]
    if (!value) throw new Error(`Cannot infer ${language} labels`)
    repaired.push({
      _key: `localizedLabels-${language}`,
      _type: GROUP_LABEL_ITEM_TYPE,
      language,
      value,
    })
  }
  return JSON.stringify(current) === JSON.stringify(repaired)
    ? {}
    : { localizedLabels: repaired }
}
