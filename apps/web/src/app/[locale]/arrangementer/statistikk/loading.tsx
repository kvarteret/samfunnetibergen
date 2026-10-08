import { surface } from "@/features/event-statistics/components/StatisticsLayout"
import { cn } from "@/lib/utils"

// Statistics are per viewer and checked against Personal on every request, so
// they cannot be prerendered. This boundary lets navigation commit at once and
// stream the report in, instead of holding the previous page until it is ready.
export default function StatisticsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Laster statistikk"
      className="flex w-full animate-pulse flex-col gap-16 pb-12 sm:gap-20"
      role="status"
    >
      <div className="flex flex-col gap-4">
        <div className="h-4 w-40 rounded-base bg-foreground/10" />
        <div className="h-14 w-full max-w-xl rounded-base bg-foreground/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div className={cn(surface, "h-32")} key={index} />
        ))}
      </div>
      <div className={cn(surface, "h-80")} />
    </div>
  )
}
