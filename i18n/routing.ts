import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
    locales: ["nb"],
    defaultLocale: "nb",
    localeCookie: false,
})

export type AppLocale = (typeof routing.locales)[number]
