export type LocalizedValue<T> = {
  language?: string | null
  value?: T | null
}

/**
 * Resolve a localized Sanity field without making the page responsible for
 * knowing how the field is stored. The legacy value is kept as the last
 * fallback while existing documents are migrated.
 */
export function resolveLocalizedValue<T>(
  values: readonly LocalizedValue<T>[] | null | undefined,
  locale: string,
  baseLocale = "nb",
  legacyValue?: T | null,
): T | null {
  const localized = values?.find(
    item => item?.language === locale && item.value != null,
  )?.value
  if (localized != null) return localized

  const base = values?.find(
    item => item?.language === baseLocale && item.value != null,
  )?.value
  if (base != null) return base

  return legacyValue ?? null
}

export function localizedField(
  field: string,
  legacyField = field,
  fallback = "null",
) {
  return `coalesce(${field}[language == $locale][0].value, ${field}[language == "nb"][0].value, ${legacyField}, ${fallback})`
}
