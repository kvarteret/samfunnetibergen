import { cn } from "@/lib/utils"

export interface DateBadgeEntry {
  _key: string
  startDate: string
}

const MAX_VISIBLE_BADGES = 3

const MONTH_NAMES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "mai",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "des",
]

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  const day = d.getDate()
  const month = MONTH_NAMES[d.getMonth()]
  return `${day}. ${month}`
}

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
  const otherDates = dates.filter((_, i) => i !== primaryIndex)
  if (otherDates.length === 0) return null

  const visible = otherDates.slice(0, MAX_VISIBLE_BADGES)
  const overflow = otherDates.length - MAX_VISIBLE_BADGES

  return (
    <div
      className={cn("flex flex-wrap", size === "small" ? "gap-2" : "gap-1.5")}
      aria-label="Andre datoer"
    >
      {visible.map(d => (
        <span
          key={d._key}
          className={cn(
            "border border-border font-heading text-foreground-muted bg-muted",
            size === "small" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-sm",
          )}
        >
          {formatShortDate(d.startDate)}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "border border-border font-heading text-foreground-muted bg-muted",
            size === "small" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-sm",
          )}
        >
          {overflow >= 9 ? "9+" : `+${overflow}`}
        </span>
      )}
    </div>
  )
}
