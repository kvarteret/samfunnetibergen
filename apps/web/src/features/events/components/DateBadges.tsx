import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

export interface DateBadgeEntry {
  _key: string
  startDate: string
}

const MAX_VISIBLE_BADGES = 3

interface DateBadgesProps {
  dates: DateBadgeEntry[]
  primaryIndex: number
  size?: "default" | "small"
}

export function DateBadges({
  dates,
  primaryIndex,
  size = "default",
}: DateBadgesProps) {
  const locale = useLocale()
  const t = useTranslations("EventCard")
  const otherDates = dates.filter((_, i) => i !== primaryIndex)
  if (otherDates.length === 0) return null

  const visible = otherDates.slice(0, MAX_VISIBLE_BADGES)
  const overflow = otherDates.length - MAX_VISIBLE_BADGES

  return (
    <fieldset
      className={cn("flex flex-wrap", size === "small" ? "gap-2" : "gap-1.5")}
      aria-label={t("otherDates")}
    >
      {visible.map(d => (
        <span
          key={d._key}
          className={cn(
            "rounded-base border-0 bg-accent font-heading text-accent-foreground",
            size === "small" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-sm",
          )}
        >
          {new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nb-NO", {
            day: "numeric",
            month: "short",
          }).format(new Date(`${d.startDate}T00:00:00`))}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "rounded-base border-0 bg-accent font-heading text-accent-foreground",
            size === "small" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-sm",
          )}
        >
          {overflow >= 9 ? "9+" : `+${overflow}`}
        </span>
      )}
    </fieldset>
  )
}
