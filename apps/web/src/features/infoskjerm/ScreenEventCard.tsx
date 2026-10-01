import { MapPin } from "lucide-react"
import styles from "./InfoScreen.module.css"
import { ScreenEventImage } from "./ScreenEventImage"
import { isScreenEventExpired, type ScreenEvent } from "./schedule"

export function ScreenEventCard({
  event,
  now,
}: {
  event: ScreenEvent
  now: Date
}) {
  const expired = isScreenEventExpired(event, now)

  return (
    <li className={styles.event} data-expired={expired}>
      <div className={styles.eventTime}>
        <span>{event.startTime ?? "Tid kommer"}</span>
        {event.endTime && (
          <span className={styles.endTime}>– {event.endTime}</span>
        )}
      </div>
      <div className={styles.eventBody}>
        <h2>{event.title}</h2>
        <div className={styles.tags}>
          {expired && <span>Avsluttet</span>}
          {event.category && <span>{event.category}</span>}
          {event.cancelled ? (
            <span className={styles.cancelled}>Avlyst</span>
          ) : event.isFree ? (
            <span>Gratis</span>
          ) : null}
        </div>
        {event.room && (
          <p className={styles.room}>
            <MapPin aria-hidden />
            <span className={styles.roomName}>{event.room}</span>
            {event.floor != null && (
              <span className={styles.floorLabel}>{event.floor}. etasje</span>
            )}
          </p>
        )}
        {!event.room && event.floor != null && (
          <p className={styles.floor}>{event.floor}. etasje</p>
        )}
        {event.organizer && (
          <p className={styles.organizer}>{event.organizer}</p>
        )}
      </div>
      <ScreenEventImage imageUrl={event.imageUrl} variant="daily" />
    </li>
  )
}
