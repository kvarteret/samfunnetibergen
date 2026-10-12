import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { watchScreenDeployment } from "./deployment"
import {
  EVENTS_PER_SCREEN,
  getScreenDate,
  REFRESH_INTERVAL_MS,
  type ScreenEvent,
  selectScreenWindow,
} from "./schedule"

export function useInfoScreen({
  date,
  events,
  initialNow,
  hasPromotions,
}: {
  date: string
  events: ScreenEvent[]
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

  return { now, visibleEvents, laterCount }
}
