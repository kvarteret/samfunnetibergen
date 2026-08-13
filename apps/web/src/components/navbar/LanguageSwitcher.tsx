"use client"

import { useLocale, useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"

export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations("Navigation")
  const nextLocale = locale === "nb" ? "en" : "nb"

  return (
    <Link
      aria-label={locale === "nb" ? "Switch to English" : "Bytt til norsk"}
      className="px-2 py-1 font-heading text-sm uppercase tracking-widest text-foreground-muted underline underline-offset-4 hover:text-foreground focus-brutal"
      href={pathname}
      locale={nextLocale}
    >
      {nextLocale === "en" ? "EN" : "NO"}
      <span className="sr-only">{t("languageSwitch")}</span>
    </Link>
  )
}
