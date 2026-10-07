import { cn } from "@/lib/utils"
import type { ScreenPromotion } from "../domain/schedule"
import { ScreenEventImage } from "./ScreenEventImage"

export function PromotedEvents({ events }: { events: ScreenPromotion[] }) {
  return (
    <section
      className={cn(
        "shrink-0 bg-background px-[6cqw] py-[2.5cqw] text-foreground",
        events.length === 3 ? "min-h-[44cqw]" : "min-h-[29cqw]",
      )}
      aria-label="Snart"
    >
      <h2 className="mb-[2cqw] text-[2.5cqw] font-heading">Snart</h2>
      <div
        className={cn(
          "grid gap-[3cqw]",
          events.length === 3 ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {events.map(event => (
          <article
            className={cn(
              "grid items-start gap-[1.5cqw]",
              events.length === 3
                ? "grid-cols-1"
                : "grid-cols-[17cqw_minmax(0,1fr)]",
            )}
            key={event.id}
          >
            <ScreenEventImage
              imageFrame={event.imageFrame}
              imageUrl={event.imageUrl}
              variant="promoted"
            />
            <div className="min-w-0">
              <p className="mb-[0.7cqw] text-[1.8cqw] font-semibold">
                <time dateTime={event.date}>{event.dateLabel}</time>
              </p>
              <h3 className="line-clamp-4 text-[2.4cqw] font-heading leading-[1.15] tracking-[-0.02em] [overflow-wrap:anywhere]">
                {event.title}
              </h3>
              {event.room && (
                <p className="mt-[0.8cqw] truncate text-[1.6cqw]">
                  {event.room}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
