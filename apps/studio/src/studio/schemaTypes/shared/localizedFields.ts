import { defineField } from "sanity"

export type LocalizedArrayValidationContext = {
  parent?: unknown
  document?: unknown
}

export type LocalizedArrayFieldOptions = Record<string, unknown> & {
  /** Require meaningful canonical values in both the base and English locale. */
  required?: boolean
}

function isMeaningful(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return value != null
}

/**
 * Shared field-level validation for Sanity's internationalized-array plugin.
 *
 * Required fields always need meaningful `nb` and `en` entries. Optional
 * fields may stay empty, but once a Norwegian source is present the
 * canonical pair must be complete. This deliberately permits an English-only
 * optional value for language-invariant content.
 */
export function validateLocalizedArray(
  value: unknown,
  options: {
    required?: boolean
  } = {},
): true | string {
  const values = Array.isArray(value) ? value : []
  const languages = new Set<string>()
  let hasNb = false
  let hasEn = false

  for (const item of values) {
    if (!item || typeof item !== "object") continue
    const language = (item as { language?: unknown }).language
    if (typeof language !== "string") continue
    if (languages.has(language)) return "Kun én verdi per språk"
    languages.add(language)
    const translated = (item as { value?: unknown }).value
    if (typeof translated === "string" && translated.trim() === "") {
      return "Tomme oversettelser må fjernes"
    }
    if (language === "nb" && isMeaningful(translated)) hasNb = true
    if (language === "en" && isMeaningful(translated)) hasEn = true
  }

  if (options.required) {
    if (!hasNb) return "Skriv inn en norsk verdi (nb)"
    if (!hasEn) return "Skriv inn en engelsk verdi (en)"
    return true
  }
  if (hasNb && !hasEn) {
    return "Legg til en engelsk verdi (en) før publisering"
  }
  return true
}

/**
 * Canonical field-level localization fields. The plugin stores one array item
 * per language (`{language, value}`); validation rejects duplicate/blank
 * entries while allowing a field to be intentionally language-invariant.
 */
export function localizedArrayField(
  name: string,
  title: string,
  type:
    | "internationalizedArrayString"
    | "internationalizedArrayText"
    | "internationalizedArrayPortableTextContent"
    | "internationalizedArrayStudentGroupLabelValue",
  options: LocalizedArrayFieldOptions = {},
) {
  const { required = false, ...fieldOptions } = options
  return defineField({
    ...fieldOptions,
    name,
    title,
    type,
    validation: (rule: any) => {
      const chain = required ? rule.required() : rule
      return chain.custom((value: unknown, context: unknown) =>
        validateLocalizedArray(value, {
          required,
        }),
      )
    },
  })
}
