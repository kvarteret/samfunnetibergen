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
              className="grid size-[2.8cqw] shrink-0 place-items-center"
            >
              <svg
                aria-hidden
                className="size-full"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d={
                    room.isOpen
                      ? "M4 4 11 2v20l-7-2V4Zm4 7v2h1.5v-2H8ZM11 3h8v17h2v2h-8v-2h4V5h-6V3Z"
                      : "M6 2h12v18h3v2H3v-2h3V2Zm8 9v2h2v-2h-2Z"
                  }
                />
              </svg>
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
