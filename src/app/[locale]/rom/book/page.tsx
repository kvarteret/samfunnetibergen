import { CalendarCheck } from "lucide-react"

import { BookingForm, type BookingRoom } from "@/features/booking"
import { Link } from "@/i18n/navigation"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { fetchBookableRooms, fetchHouseHours } from "@/lib/sanity/fetch"

export const revalidate = 300

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export async function generateMetadata() {
  return {
    title: "Book rom | Samfunnet i Bergen",
    description:
      "Send en bookingforespørsel for rom på Det Akademiske Kvarter. Fyll ut skjemaet, så behandler vi forespørselen din.",
  }
}

export default async function BookRoomPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)

  const [bookableRooms, houseHours] = await Promise.all([
    fetchBookableRooms(),
    fetchHouseHours(),
  ])
  const rooms: BookingRoom[] = bookableRooms.map(room => ({
    title: room.title,
    slug: room.slug,
    summary: room.summary,
    capacityStanding: room.capacityStanding,
    capacitySeated: room.capacitySeated,
    crescatRoomId: room.crescatRoomId,
    openingHours: room.openingHours ?? null,
    image: room.image
      ? {
          assetUrl: room.image.assetUrl,
          alt: room.image.alt,
        }
      : null,
  }))

  return (
    <article className="flex w-full flex-col gap-10">
      <header className="space-y-4">
        <Link
          className="inline-flex font-heading uppercase tracking-widest underline underline-offset-4 hover:text-foreground transition-colors focus-brutal"
          href="/rom"
        >
          ← Rom
        </Link>

        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary flex items-center justify-center shrink-0">
            <CalendarCheck
              className="size-5 text-primary-foreground"
              aria-hidden
            />
          </div>
          <p className="font-heading uppercase tracking-widest">Booking</p>
        </div>
        <h1 className="font-heading text-4xl leading-tight text-foreground lg:text-5xl">
          Book rom
        </h1>
        <p className="max-w-xl text-lg leading-7 text-foreground-muted">
          Fyll ut skjemaet under, så behandler vi forespørselen din så fort vi
          ser den. En booking er en forespørsel og bekreftes av oss på e-post.
        </p>
      </header>

      <BookingForm
        closedDates={houseHours?.houseClosedDates ?? []}
        openingHours={houseHours?.operationsManagerHours ?? null}
        rooms={rooms}
      />
    </article>
  )
}
