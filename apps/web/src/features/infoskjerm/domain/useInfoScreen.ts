import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { watchScreenDeployment } from "./deployment"
import {
  EVENTS_PER_SCREEN,
  getScreenDate,
  REFRESH_INTERVAL_MS,
  type ScreenEvent,
  type ScreenInfoOnlyEvent,
  selectInfoOnlyEvents,
  selectScreenWindow,
} from "./schedule"

export function useInfoScreen({
  date,
  events,
  infoOnlyEvents,
  initialNow,
  hasPromotions,
}: {
  date: string
  events: ScreenEvent[]
  infoOnlyEvents: ScreenInfoOnlyEvent[]
  initialNow: string
  hasPromotions: boolean
}) {
  const router = useRouter()
  const [now, setNow] = useState(() => new Date(initialNow))
  const { visibleEvents, laterCount } = selectScreenWindow(
    events,
    now,
    hasPromotions ? 3 : EVENTS_PER_SCREEN,
  )

  const currentInfoOnlyEvents = selectInfoOnlyEvents(infoOnlyEvents, now)

  useEffect(
    () =>
      watchScreenDeployment(document.documentElement.dataset.dplId, () =>
        window.location.reload(),
      ),
    [],
  )

  useEffect(() => {
    let currentDate = date
    let currentHour = Math.floor(Date.parse(initialNow) / REFRESH_INTERVAL_MS)
    const tick = () => {
      const nextNow = new Date()
      setNow(nextNow)
      const nextDate = getScreenDate(nextNow)
      const nextHour = Math.floor(nextNow.getTime() / REFRESH_INTERVAL_MS)
      if (nextDate !== currentDate || nextHour !== currentHour) {
        currentDate = nextDate
        currentHour = nextHour
        router.refresh()
      }
    }
    tick()
    const clock = window.setInterval(tick, 1_000)
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        tick()
        router.refresh()
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.clearInterval(clock)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [date, initialNow, router])

  return { now, visibleEvents, laterCount, currentInfoOnlyEvents }
}
