import type { AppLocale } from "@/i18n/routing"

const localeOrder: AppLocale[] = ["nb", "en"]

export function resolveRequestLocale(
    requestedLocale: string | null | undefined,
): AppLocale {
    if (!requestedLocale) {
        return "en"
    }

    const normalizedRequestedLocale = requestedLocale.toLowerCase()

    for (const locale of localeOrder) {
        if (normalizedRequestedLocale === locale) {
            return locale
        }

        if (normalizedRequestedLocale.startsWith(`${locale}-`)) {
            return locale
        }
    }

    if (normalizedRequestedLocale.includes("en")) {
        return "en"
    }

    return "en"
}
