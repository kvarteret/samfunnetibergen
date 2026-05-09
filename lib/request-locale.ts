import type { AppLocale } from "@/i18n/routing"

function normalizeLocaleToken(locale: string): AppLocale | null {
    const normalizedLocale = locale.trim().toLowerCase()

    if (!normalizedLocale) {
        return null
    }

    if (
        normalizedLocale === "nb" ||
        normalizedLocale === "nn" ||
        normalizedLocale === "no" ||
        normalizedLocale.startsWith("nb-") ||
        normalizedLocale.startsWith("nn-") ||
        normalizedLocale.startsWith("no-")
    ) {
        return "nb"
    }

    return null
}

export function resolveRequestLocale(requestedLocale: string | null | undefined): AppLocale {
    if (!requestedLocale) {
        return "nb"
    }

    const requestedLocales = requestedLocale
        .split(",")
        .map(part => part.split(";")[0]?.trim() ?? "")

    for (const locale of requestedLocales) {
        const normalizedLocale = normalizeLocaleToken(locale)
        if (normalizedLocale) {
            return normalizedLocale
        }
    }

    const normalizedRequestedLocale = normalizeLocaleToken(requestedLocale)
    if (normalizedRequestedLocale) {
        return normalizedRequestedLocale
    }

    const fallback = requestedLocale.toLowerCase()
    if (fallback.includes("no") || fallback.includes("nn") || fallback.includes("nb")) {
        return "nb"
    }

    return "nb"
}
