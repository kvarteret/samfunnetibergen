import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["nb", "en"],
  defaultLocale: "nb",
  localeCookie: true,
})

export type AppLocale = (typeof routing.locales)[number]
