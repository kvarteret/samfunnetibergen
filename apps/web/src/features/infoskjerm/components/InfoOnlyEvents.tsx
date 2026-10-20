import type { ScreenInfoOnlyEvent } from "../domain/schedule"

export function InfoOnlyEvents({ events }: { events: ScreenInfoOnlyEvent[] }) {
  if (events.length === 0) return null

  return (
    <section
      className="shrink-0 px-[6cqw] pb-[2cqw] text-[2.6cqw] leading-[1.3]"
      aria-label="Nå på huset"
    >
      <ul className="m-0 grid list-none gap-[1cqw] border-y-[0.3cqw] border-foreground p-0 py-[1.5cqw]">
        {events.map(event => (
          <li key={event.id} className="flex min-w-0 items-baseline gap-[2cqw]">
            <span className="shrink-0 font-mono font-medium tabular-nums">
              {event.startTime}
            </span>
            <span className="min-w-0 flex-1 truncate font-heading">
              {event.title}
            </span>
            {(event.room || event.floor != null) && (
              <span className="shrink-0 text-[2.1cqw]">
                {event.room}
                {event.room && event.floor != null && " · "}
                {event.floor != null && `${event.floor}. etasje`}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
