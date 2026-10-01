import { getScreenRoomHours, type ScreenRoomHours } from "./opening-hours"

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
          className="flex flex-col items-start gap-[0.5cqw] data-[open=true]:text-[var(--green-700)]"
        >
          <dt className="flex items-center gap-[0.8cqw]">
            {room.isOpen && (
              <span
                role="img"
                className="size-[0.9cqw] shrink-0 rounded-full bg-current"
                aria-label="Åpent"
              />
            )}
            {room.title}
          </dt>
          <dd className="font-semibold tabular-nums">{room.label}</dd>
        </div>
      ))}
    </dl>
  )
}
