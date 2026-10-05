import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { watchScreenDeployment } from "./deployment"
import {
  EVENTS_PER_PAGE,
  getScreenDate,
  PAGE_DURATION_MS,
  REFRESH_INTERVAL_MS,
  type ScreenEvent,
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
  const [page, setPage] = useState(0)
  const eventsPerPage = hasPromotions ? 3 : EVENTS_PER_PAGE
  const pageCount = Math.max(1, Math.ceil(events.length / eventsPerPage))
  const currentPage = page % pageCount
  const pageIds = events
    .filter((_, index) => index % eventsPerPage === 0)
    .map(event => event.id)
  const visibleEvents = events.slice(
    currentPage * eventsPerPage,
    (currentPage + 1) * eventsPerPage,
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
    const tick = () => {
      const nextNow = new Date()
      setNow(nextNow)
      const nextDate = getScreenDate(nextNow)
      if (nextDate !== currentDate) {
        currentDate = nextDate
        router.refresh()
      }
    }
    tick()
    const clock = window.setInterval(tick, 1_000)
    const refresh = window.setInterval(
      () => router.refresh(),
      REFRESH_INTERVAL_MS,
    )
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        tick()
        router.refresh()
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.clearInterval(clock)
      window.clearInterval(refresh)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [date, router])

  useEffect(() => {
    if (pageCount <= 1) return
    const rotation = window.setInterval(
      () => setPage(page => (page + 1) % pageCount),
      PAGE_DURATION_MS,
    )
    return () => window.clearInterval(rotation)
  }, [pageCount])

  return { now, currentPage, pageCount, pageIds, visibleEvents, eventsPerPage }
}
