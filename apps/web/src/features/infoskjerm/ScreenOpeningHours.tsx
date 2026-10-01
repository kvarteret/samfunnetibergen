import styles from "./InfoScreen.module.css"
import { getScreenRoomHours, type ScreenRoomHours } from "./opening-hours"

export function ScreenOpeningHours({
  roomHours,
  now,
}: {
  roomHours: ScreenRoomHours
  now: Date
}) {
  return (
    <dl className={styles.openingHours} aria-label="Åpningstider i dag">
      {getScreenRoomHours(roomHours, now).map(room => (
        <div key={room.slug} data-open={room.isOpen}>
          <dt>
            {room.isOpen && (
              <span role="img" className={styles.openDot} aria-label="Åpent" />
            )}
            {room.title}
          </dt>
          <dd>{room.label}</dd>
        </div>
      ))}
    </dl>
  )
}
