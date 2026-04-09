import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
    locales: ["nb", "en"],
    defaultLocale: "en",
    localeCookie: false,
})

export type AppLocale = (typeof routing.locales)[number]
