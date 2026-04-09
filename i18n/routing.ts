import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
    locales: ["nb", "en"],
    defaultLocale: "en",
})

export type AppLocale = (typeof routing.locales)[number]
