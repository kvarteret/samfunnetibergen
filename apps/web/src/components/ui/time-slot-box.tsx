"use client"

import { Popover } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

export type TimeSlotAvailability = "available" | "unavailable"

export interface TimeSlotBoxOption {
  value: string
  label: string
  availability: TimeSlotAvailability
}

interface TimeSlotBoxProps {
  label: string
  value: string
  options: TimeSlotBoxOption[]
  onChange: (value: string) => void
  id?: string
  className?: string
}

// A time display that doubles as a picker: clicking it opens a grid of
// 15-minute slots colored by availability (green = selectable, neutral
// diagonal stripes = already booked and disabled). Reused for the
// get-in/get-out boxes, which stay in sync with the range slider since both
// write through the same start/end change handlers.
export function TimeSlotBox({
  label,
  value,
  options,
  onChange,
  id,
  className,
}: TimeSlotBoxProps) {
  return (
    <Popover.Root>
      <div className={cn("space-y-1.5", className)}>
        <p className="font-heading text-xs uppercase tracking-widest text-foreground-muted">
          {label}
        </p>
        <Popover.Trigger
          className="w-full cursor-pointer border-2 border-border bg-card px-3 py-2 text-left font-mono text-lg tabular-nums text-foreground transition-colors hover:border-primary focus-brutal"
          id={id}
        >
          {value || "--:--"}
        </Popover.Trigger>
      </div>
      <Popover.Portal>
        <Popover.Positioner className="z-[100]" sideOffset={8}>
          <Popover.Popup className="max-h-72 w-56 overflow-y-auto panel shadow-shadow p-2">
            <div className="grid grid-cols-3 gap-1.5">
              {options.map(opt => (
                <Popover.Close
                  className={cn(
                    "border-2 px-2 py-1.5 text-center font-mono text-sm tabular-nums transition-colors",
                    opt.availability === "available"
                      ? "cursor-pointer border-success/40 bg-success/10 text-foreground hover:border-success hover:bg-success/20"
                      : "unavailable-slot cursor-not-allowed",
                    opt.value === value &&
                      opt.availability === "available" &&
                      "border-primary bg-primary/15",
                  )}
                  data-availability={opt.availability}
                  disabled={opt.availability === "unavailable"}
                  key={opt.value}
                  onClick={() => onChange(opt.value)}
                >
                  {opt.label}
                </Popover.Close>
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
