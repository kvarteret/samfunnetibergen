import { DoorClosed, DoorOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getScreenRoomHours,
  type ScreenRoomHours,
} from "../domain/opening-hours"

export function ScreenOpeningHours({
  roomHours,
  now,
}: {
  roomHours: ScreenRoomHours
  now: Date
}) {
  return (
    <dl
      className="mt-[2cqw] grid grid-cols-2 items-start gap-[3cqw] text-[2cqw] leading-[1.4]"
      aria-label="Åpningstider i dag"
    >
      {getScreenRoomHours(roomHours, now).map(room => (
        <div
          key={room.slug}
          data-open={room.isOpen}
          className="flex flex-col items-start gap-[0.5cqw] text-foreground"
        >
          <dt className="flex items-center gap-[0.8cqw]">
            <span
              role="img"
              aria-label={room.isOpen ? "Åpent" : "Stengt"}
              title={room.isOpen ? "Åpent" : "Stengt"}
              className={cn(
                "grid size-[3.4cqw] shrink-0 place-items-center rounded p-[0.6cqw]",
                room.isOpen
                  ? "bg-[var(--green-700)] text-white"
                  : "bg-foreground/10 text-foreground",
              )}
            >
              {room.isOpen ? (
                <DoorOpen aria-hidden className="size-full" strokeWidth={2.5} />
              ) : (
                <DoorClosed
                  aria-hidden
                  className="size-full"
                  strokeWidth={2.5}
                />
              )}
            </span>
            <span className="text-[2.4cqw] font-semibold leading-[1.2] [font-family:var(--font-fraunces)]">
              {room.title}
            </span>
          </dt>
          <dd className="font-semibold tabular-nums">{room.label}</dd>
        </div>
      ))}
    </dl>
  )
}
