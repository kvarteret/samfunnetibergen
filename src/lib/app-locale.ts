import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { type AppLocale, routing } from "@/i18n/routing";

export function getLocaleStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export function resolveAppLocale(locale: string): AppLocale {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return locale;
}

export async function resolvePageLocale(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  return resolveAppLocale(locale);
}

export function activateRequestLocale(locale: AppLocale) {
  setRequestLocale(locale);
  return locale;
}
