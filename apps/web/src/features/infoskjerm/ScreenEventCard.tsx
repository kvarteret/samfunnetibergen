import { MapPin } from "lucide-react"
import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"
import { ScreenEventImage } from "./ScreenEventImage"
import { isScreenEventExpired, type ScreenEvent } from "./schedule"

export function ScreenEventCard({
  event,
  now,
  pageSize,
}: {
  event: ScreenEvent
  now: Date
  pageSize: number
}) {
  const expired = isScreenEventExpired(event, now)
  const tagClass = cn(
    "border-0 px-[0.8cqw] py-[0.4cqw] font-sans text-[1.7cqw] font-base leading-[1.2] normal-case tracking-normal",
    expired && "bg-neutral-200 text-neutral-500",
  )

  return (
    <li
      className={cn(
        "grid min-h-0 items-start py-[2cqw]",
        pageSize === 1
          ? "grid-cols-[13cqw_minmax(0,1fr)] content-center gap-[3cqw]"
          : pageSize === 2
            ? "grid-cols-[13cqw_minmax(0,1fr)_30cqw] content-center gap-[2cqw]"
            : "grid-cols-[13cqw_minmax(0,1fr)_24cqw] gap-[2cqw]",
        expired && "text-neutral-500",
      )}
      data-expired={expired}
    >
      <div className="grid self-start gap-[0.8cqw] pt-[0.1cqw] font-mono text-[3.8cqw] font-medium leading-[1.2]">
        <span>{event.startTime ?? "Tid kommer"}</span>
        {event.endTime && (
          <span className="text-[2.1cqw] font-normal">– {event.endTime}</span>
        )}
      </div>
      <div className="min-w-0">
        <h2
          className={cn(
            "font-heading leading-[1.13] tracking-[-0.025em] [overflow-wrap:anywhere]",
            pageSize <= 2
              ? "line-clamp-4 text-[4.8cqw]"
              : "line-clamp-3 text-[4.2cqw]",
          )}
        >
          {event.title}
        </h2>
        <div className="mt-[1cqw] flex flex-wrap gap-[0.5cqw] empty:hidden">
          {expired && (
            <Tag variant="accent" className={tagClass}>
              Avsluttet
            </Tag>
          )}
          {event.category && (
            <Tag variant="accent" className={tagClass}>
              {event.category}
            </Tag>
          )}
          {event.cancelled ? (
            <Tag
              variant="accent"
              className={cn(
                tagClass,
                !expired && "bg-primary text-primary-foreground",
              )}
            >
              Avlyst
            </Tag>
          ) : event.isFree ? (
            <Tag variant="accent" className={tagClass}>
              Gratis
            </Tag>
          ) : null}
        </div>
        {event.room && (
          <p className="mt-[1cqw] flex items-center gap-[0.6cqw] text-[2.1cqw] leading-[1.3]">
            <MapPin aria-hidden className="size-[2cqw] shrink-0" />
            <span className="min-w-0 line-clamp-1">{event.room}</span>
            {event.floor != null && (
              <span className="shrink-0 font-medium">
                {event.floor}. etasje
              </span>
            )}
          </p>
        )}
        {!event.room && event.floor != null && (
          <p className="mt-[0.5cqw] text-[2.1cqw] leading-[1.3]">
            {event.floor}. etasje
          </p>
        )}
        {event.organizer && (
          <p className="mt-[0.5cqw] line-clamp-1 text-[1.8cqw] leading-[1.3] opacity-75">
            {event.organizer}
          </p>
        )}
      </div>
      <ScreenEventImage
        imageUrl={event.imageUrl}
        variant="daily"
        pageSize={pageSize}
        expired={expired}
      />
    </li>
  )
}
