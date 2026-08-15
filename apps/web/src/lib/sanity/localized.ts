import type { AppLocale } from "@/i18n/routing"

export const SUPPORTED_LOCALES = ["nb", "en"] as const
export const DEFAULT_LOCALE: AppLocale = "nb"

export type LocalizedValue<T> = {
  language?: string | null
  value?: T | null
}

/** A translation is absent when it is null, undefined, or an empty string. */
export function hasLocalizedValue<T>(value: T | null | undefined): value is T {
  return value != null && (typeof value !== "string" || value.trim().length > 0)
}

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/**
 * Resolve a localized Sanity field without making the page responsible for
 * knowing how the field is stored. The legacy value is kept as the last
 * fallback while existing documents are migrated.
 */
export function resolveLocalizedValue<T>(
  values: readonly LocalizedValue<T>[] | null | undefined,
  locale: string,
  baseLocale: string = DEFAULT_LOCALE,
  legacyValue?: T | null,
): T | null {
  const localized = values?.find(
    item => item?.language === locale && hasLocalizedValue(item.value),
  )?.value
  if (hasLocalizedValue(localized)) return localized

  const base = values?.find(
    item => item?.language === baseLocale && hasLocalizedValue(item.value),
  )?.value
  if (hasLocalizedValue(base)) return base

  return hasLocalizedValue(legacyValue) ? legacyValue : null
}

// `value != ""` deliberately excludes empty strings: GROQ coalesce treats an
// empty string as a value and would otherwise suppress the base-language
// fallback. The same predicate is safe for arrays/objects used by rich text.
export const localizedField = (
  field: string,
  legacyField = field,
  fallback = "null",
) =>
  `coalesce(${field}[language == $locale && defined(value) && value != ""][0].value, ${field}[language == "${DEFAULT_LOCALE}" && defined(value) && value != ""][0].value, ${legacyField}, ${fallback})`

/** GROQ predicate used by audits to define a real translation consistently. */
export const localizedValuePredicate =
  'defined(value) && (value != "" || value == false || value == 0)'
