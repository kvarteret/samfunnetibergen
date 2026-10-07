import { cn } from "@/lib/utils"

/** Small key under the calendar and the get-in/get-out track. */
export function CalendarLegend({
  items,
}: {
  items: { swatch: string; label: string }[]
}) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground-muted">
      {items.map(item => (
        <li key={item.label} className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn(
              "relative inline-block size-4 shrink-0 rounded",
              item.swatch,
            )}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
