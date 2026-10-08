import "server-only"

import { getTranslations } from "next-intl/server"

import type { AppLocale } from "@/i18n/routing"
import { type CardDateLabels, formatWeekday } from "../domain/dates"

/** Localized labels for the date line, recurrence and programme size on cards. */
export async function getCardDateLabels(
  locale: AppLocale,
): Promise<CardDateLabels> {
  const t = await getTranslations({ locale, namespace: "EventCard" })
  const weekdayName = new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : "nb-NO",
    { timeZone: "Europe/Oslo", weekday: "long" },
  )

  return {
    today: t("today"),
    tomorrow: t("tomorrow"),
    weekday: date => formatWeekday(date, locale),
    weekdayName: date => weekdayName.format(date),
    weeklyDate: weekday => {
      const plural = locale === "nb" ? `${weekday}er` : `${weekday}s`
      return plural.charAt(0).toLocaleUpperCase(locale) + plural.slice(1)
    },
    days: count => t("runDays", { count }),
    events: count => t("programmeEvents", { count }),
    recurring: {
      daily: t("recurringDaily"),
      weekly: t("recurringWeekly"),
      monthly: t("recurringMonthly"),
      generic: t("recurringGeneric"),
      weeklyOn: weekday => t("recurringWeeklyOn", { weekday }),
    },
  }
}
