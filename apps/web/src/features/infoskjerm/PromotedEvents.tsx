import { ScreenEventImage } from "./ScreenEventImage"
import type { ScreenPromotion } from "./schedule"

export function PromotedEvents({ events }: { events: ScreenPromotion[] }) {
  return (
    <section
      className="paper-surface h-[29cqw] shrink-0 px-[6cqw] py-[2.5cqw] text-foreground"
      aria-label="Snart"
    >
      <h2 className="mb-[2cqw] text-[2.5cqw] font-heading">Snart</h2>
      <div className="grid grid-cols-2 gap-[3cqw]">
        {events.map(event => (
          <article
            className="grid grid-cols-[17cqw_minmax(0,1fr)] items-start gap-[1.5cqw]"
            key={event.id}
          >
            <ScreenEventImage imageUrl={event.imageUrl} variant="promoted" />
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
