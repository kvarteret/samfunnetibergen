type LocalizedValue = {
  _key: string
  language: "nb" | "en"
  value: string
}

export const initialEnglishHomePageContent = {
  eyebrow: "Studentersamfunnet in Bergen",
  title: "Welcome to Western Norway's largest student cultural centre",
  description:
    "Studentersamfunnet in Bergen is the city's oldest general student organisation and Western Norway's largest student cultural centre.\n\nWith hundreds of volunteers and a rich history, Samfunnet works to fill the house with a broad cultural programme that promotes community, personal growth and interest in cultural questions.",
  primaryCta: "Become a volunteer",
} as const

function addEnglish<T extends string>(
  current: LocalizedValue[] | undefined,
  field: string,
  value: T,
) {
  if (current?.some(item => item.language === "en" && item.value != null)) {
    return {}
  }
  return {
    [field]: [
      ...(current ?? []),
      { _key: `en-${field}`, language: "en", value },
    ],
  }
}

export function buildHomePageLocalePatch(document: {
  localizedEyebrow?: LocalizedValue[]
  localizedTitle?: LocalizedValue[]
  localizedDescription?: LocalizedValue[]
  primaryCta?: { localizedLabel?: LocalizedValue[] }
}) {
  return {
    ...addEnglish(
      document.localizedEyebrow,
      "localizedEyebrow",
      initialEnglishHomePageContent.eyebrow,
    ),
    ...addEnglish(
      document.localizedTitle,
      "localizedTitle",
      initialEnglishHomePageContent.title,
    ),
    ...addEnglish(
      document.localizedDescription,
      "localizedDescription",
      initialEnglishHomePageContent.description,
    ),
    ...addEnglish(
      document.primaryCta?.localizedLabel,
      "primaryCta.localizedLabel",
      initialEnglishHomePageContent.primaryCta,
    ),
  }
}
