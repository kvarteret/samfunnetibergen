"use client"

import { Popover } from "@base-ui/react/popover"
import { ChevronDown } from "lucide-react"
import { useMemo } from "react"
import {
  type ClosedDate,
  formatOpeningDate,
  formatOpeningHoursTime,
  type OpeningHours,
  isoDate,
  openingHoursDaySummaries,
  openingHoursStatusAt,
  type VacationMode,
} from "@/lib/opening-hours"
import { cn } from "@/lib/utils"
import { useCurrentTime } from "@/lib/use-current-time"

type NavbarOpenStatusProps = {
  openingHours?: OpeningHours | null
  closedDates?: ClosedDate[] | null
  vacationMode?: VacationMode | null
  initialNow: string
}

const DAY_COUNT = 7

export function NavbarOpenStatus({
  openingHours,
  closedDates,
  vacationMode,
  initialNow,
}: NavbarOpenStatusProps) {
  const now = useCurrentTime(initialNow)

  const status = useMemo(
    () => openingHoursStatusAt(now, openingHours, closedDates, vacationMode),
    [now, openingHours, closedDates, vacationMode],
  )
  const days = useMemo(
    () =>
      openingHoursDaySummaries(
        now,
        DAY_COUNT,
        openingHours,
        closedDates,
        vacationMode,
      ),
    [now, openingHours, closedDates, vacationMode],
  )

  const detail = status.isOpen
    ? status.currentRange
      ? `Stenger kl. ${formatOpeningHoursTime(status.currentRange.endMin)}`
      : null
    : status.nextRange
      ? `Åpner ${formatNextOpening(now, status.nextDate, status.nextRange.startMin)}`
      : "Ingen åpningstid funnet"

  return (
    <Popover.Root>
      <Popover.Trigger className="group flex min-w-0 max-w-[min(28rem,calc(100vw-10rem))] cursor-pointer items-center gap-1.5 py-2 text-left font-heading text-sm focus-brutal">
        <span
          className={cn(
            "shrink-0 font-heading",
            status.isOpen ? "text-success" : "text-destructive",
          )}
        >
          {status.isOpen ? "Åpent" : "Stengt"}
        </span>
        {detail ? (
          <>
            <span aria-hidden="true" className="shrink-0 text-foreground-muted">
              ·
            </span>
            <span className="min-w-0 truncate text-foreground-muted">
              {detail}
            </span>
          </>
        ) : null}
        <ChevronDown
          aria-hidden
          className="size-3.5 shrink-0 text-foreground-muted transition-transform group-data-popup-open:rotate-180"
          strokeWidth={1.75}
        />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          align="start"
          className="z-50"
          collisionPadding={16}
          sideOffset={12}
        >
          <Popover.Popup className="w-[min(24rem,var(--available-width),calc(100vw-2rem))] max-w-[calc(100vw-2rem)] border-2 border-border bg-card p-4 shadow-shadow outline-none sm:p-5">
            <p className="sr-only">Åpningstider</p>
            <dl className="space-y-1.5">
              {days.map((day, index) => (
                <div
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] gap-4 font-heading text-base leading-tight sm:gap-6",
                    index === 0 ? "text-foreground" : "text-foreground-muted",
                  )}
                  key={day.date}
                >
                  <dt
                    className={cn(
                      "min-w-0 truncate",
                      index === 0 && "font-bold",
                    )}
                  >
                    {day.dayLabel}
                  </dt>
                  <dd
                    className={cn(
                      "tabular-nums",
                      index === 0 && "font-bold",
                      day.ranges.length === 0 && "text-foreground-muted",
                    )}
                  >
                    {formatRanges(day.ranges)}
                  </dd>
                </div>
              ))}
            </dl>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function formatNextOpening(
  now: Date,
  nextDate: string | undefined,
  nextStartMin: number,
) {
  const time = formatOpeningHoursTime(nextStartMin)
  const today = isoDate(now)
  if (!nextDate || nextDate === today) return `kl. ${time}`
  if (daysBetween(today, nextDate) > 7) return formatOpeningDate(nextDate)
  return `${weekdayLabel(nextDate)} kl. ${time}`
}

function formatRanges(ranges: Array<{ startMin: number; endMin: number }>) {
  if (!ranges.length) return "Stengt"
  return ranges
    .map(
      range =>
        `${formatOpeningHoursTime(range.startMin)}–${formatOpeningHoursTime(range.endMin)}`,
    )
    .join(", ")
}

function weekdayLabel(dateStr: string) {
  const labels = [
    "søndag",
    "mandag",
    "tirsdag",
    "onsdag",
    "torsdag",
    "fredag",
    "lørdag",
  ]
  return labels[new Date(`${dateStr}T00:00:00`).getDay()]
}

function daysBetween(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00`).getTime()
  const to = new Date(`${toDate}T00:00:00`).getTime()
  return Math.round((to - from) / 86_400_000)
}
