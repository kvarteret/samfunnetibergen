"use client"

import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "./radio-group"

export type DateAvailability = "available" | "unavailable"

interface DateScrollerProps {
  dates: string[]
  selectedDate: string
  today: string
  getDateAvailability: (date: string) => DateAvailability
  onChange: (date: string) => void
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

export function DateScroller({
  dates,
  selectedDate,
  today,
  getDateAvailability,
  onChange,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: DateScrollerProps) {
  return (
    <div
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid || undefined}
      className="overflow-x-auto focus-brutal"
      id={id}
      tabIndex={-1}
    >
      <RadioGroup
        className="flex min-w-max gap-1.5 pb-1"
        onValueChange={onChange}
        value={selectedDate}
      >
        {dates.map(date => {
          const availability = getDateAvailability(date)
          const selected = date === selectedDate
          const parsedDate = new Date(date)
          const weekday = parsedDate.toLocaleDateString("nb-NO", {
            weekday: "short",
          })
          const month = parsedDate
            .toLocaleDateString("nb-NO", { month: "short" })
            .replace(".", "")

          return (
            <RadioGroupItem
              className={cn(
                "flex min-h-11 min-w-13 shrink-0 flex-col items-center gap-0.5 px-2.5 py-2",
                availability === "unavailable" &&
                  "border-border/30 text-foreground-muted",
                availability === "available" &&
                  !selected &&
                  date === today &&
                  "border-primary/50",
              )}
              disabled={availability === "unavailable"}
              key={date}
              size="none"
              value={date}
            >
              <span className="text-sm uppercase tracking-widest">
                {weekday}
              </span>
              <span className="text-base font-heading leading-none">
                {parsedDate.getDate()}
              </span>
              <span className="text-sm">{month}</span>
            </RadioGroupItem>
          )
        })}
      </RadioGroup>
    </div>
  )
}
