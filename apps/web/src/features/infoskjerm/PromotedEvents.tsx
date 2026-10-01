import styles from "./InfoScreen.module.css"
import { ScreenEventImage } from "./ScreenEventImage"
import type { ScreenPromotion } from "./schedule"

export function PromotedEvents({ events }: { events: ScreenPromotion[] }) {
  return (
    <section className={styles.promotions} aria-label="Snart">
      <h2>Snart</h2>
      <div className={styles.promotionGrid}>
        {events.map(event => (
          <article className={styles.promotion} key={event.id}>
            <ScreenEventImage imageUrl={event.imageUrl} variant="promoted" />
            <div className={styles.promotionBody}>
              <p className={styles.promotionDate}>
                <time dateTime={event.date}>{event.dateLabel}</time>
              </p>
              <h3>{event.title}</h3>
              {event.room && (
                <p className={styles.promotionRoom}>{event.room}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
