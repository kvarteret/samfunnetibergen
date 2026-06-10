"use client"

import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const dateButtonVariants = cva(
  "flex flex-col items-center gap-0.5 px-2.5 py-2 border-2 min-w-[52px] transition-colors shrink-0",
  {
    variants: {
      state: {
        selected: "bg-primary border-primary text-primary-foreground",
        available: "border-border hover:bg-muted cursor-pointer",
        unavailable: "border-border/30 text-foreground/25 cursor-not-allowed",
      },
      today: {
        true: "border-primary/50",
      },
    },
  },
)

export type DateState = "selected" | "available" | "unavailable"

interface DateScrollerProps {
  dates: string[]
  selectedDate: string
  today: string
  getDateState: (date: string) => DateState
  onChange: (date: string) => void
}

export function DateScroller({
  dates,
  today,
  getDateState,
  onChange,
}: DateScrollerProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1.5 pb-1 min-w-max">
        {dates.map(date => {
          const state = getDateState(date)
          const parsedDate = new Date(date)
          const weekday = parsedDate.toLocaleDateString("nb-NO", {
            weekday: "short",
          })
          const month = parsedDate
            .toLocaleDateString("nb-NO", { month: "short" })
            .replace(".", "")

          return (
            <button
              key={date}
              type="button"
              disabled={state === "unavailable"}
              onClick={() => onChange(date)}
              className={cn(
                dateButtonVariants({
                  state,
                  today:
                    state === "available" && date === today ? true : undefined,
                }),
              )}
            >
              <span className="text-[10px] uppercase tracking-widest">
                {weekday}
              </span>
              <span className="text-base font-heading leading-none">
                {parsedDate.getDate()}
              </span>
              <span className="text-[10px]">{month}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
