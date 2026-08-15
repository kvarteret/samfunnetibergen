import type { AppLocale } from "@/i18n/routing"

const NORWEGIAN_LANGUAGE = /^(?:nb|nn|no)(?:-|$)/i

/**
 * Pick the app locale from the browser's preferred language list.
 *
 * Norwegian language tags are deliberately grouped together because browsers
 * may report Bokmål, Nynorsk, or the general Norwegian tag.
 */
export function localeFromAcceptLanguage(
  acceptLanguage: string | null | undefined = null,
): AppLocale {
  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((entry, index) => {
      const [rawRange, ...parameters] = entry.trim().split(";")
      const range = rawRange?.trim().toLowerCase() ?? ""
      const qualityParameter = parameters.find(parameter =>
        parameter.trim().startsWith("q="),
      )
      const quality = qualityParameter
        ? Number(qualityParameter.trim().slice(2))
        : 1

      return {
        index,
        quality: Number.isFinite(quality) ? quality : 0,
        range,
      }
    })
    .filter(entry => entry.range && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)

  const primaryRange = preferred[0]?.range
  if (!primaryRange) return "nb"
  if (primaryRange && NORWEGIAN_LANGUAGE.test(primaryRange)) return "nb"
  return "en"
}
