import type { Metadata } from "next"
import { connection } from "next/server"
import { InfoScreen } from "@/features/infoskjerm/components/InfoScreen"
import { getScreenMessage } from "@/features/infoskjerm/domain/message"
import { fetchScreenEvents } from "@/features/infoskjerm/server/schedule"
import { fetchScreenWeather } from "@/features/infoskjerm/server/weather"
import { fetchFooter, fetchSiteLogo } from "@/lib/sanity/fetch"

export const metadata: Metadata = {
  title: "I dag på Kvarteret · Infoskjerm",
  robots: { index: false, follow: false },
}

export default async function InfoScreenPage({
  searchParams,
}: PageProps<"/infoskjerm">) {
  await connection()
  const { message } = await searchParams
  const footerMessage = getScreenMessage(message)
  const now = new Date()
  const [{ date, events, promotions }, logo, weather, footer] =
    await Promise.all([
      fetchScreenEvents(now),
      fetchSiteLogo({ stega: false }),
      fetchScreenWeather(now),
      fetchFooter("nb"),
    ])

  return (
    <InfoScreen
      key={date}
      date={date}
      events={events}
      promotions={promotions}
      initialNow={now.toISOString()}
      logo={logo}
      weather={weather}
      message={footerMessage}
      roomHours={
        footer
          ? {
              rooms: footer.roomHours ?? [],
              closedDates: footer.houseClosedDates,
              vacationMode: footer.vacationMode,
            }
          : null
      }
    />
  )
}
