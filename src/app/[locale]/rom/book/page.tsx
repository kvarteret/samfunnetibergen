import {
  ArrowRight,
  CalendarCheck,
  Headphones,
  UtensilsCrossed,
} from "lucide-react"

import { HowToBookSection } from "@/components/how-to-book-section"
import { LeietiderSection } from "@/components/leietider-section"
import { BookingForm } from "@/features/booking"
import { fetchBookableRoomsForBooker } from "@/features/booking/actions/bookable-rooms"
import { Link } from "@/i18n/navigation"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { PortableTextContent } from "@/lib/portable-text-components"
import type { EditorialSection } from "@/lib/sanity/fetch"
import {
  fetchHouseHours,
  fetchPageBySlug,
  fetchRoomsPageContent,
} from "@/lib/sanity/fetch"

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

function QuestionsSection({ section }: { section: EditorialSection }) {
  return (
    <div className="space-y-3 panel max-w-2xl">
      {section.title ? (
        <h2 className="font-heading text-xl leading-tight text-foreground">
          {section.title}
        </h2>
      ) : null}
      <div>
        <PortableTextContent value={section.body} />
      </div>
    </div>
  )
}

const SERVICES = [
  {
    icon: Headphones,
    title: "Silent Disco",
    description:
      "Tre kanaler, DJs og lyssetting for en hel fest. Tilgjengelig i Teglverket, Tivoli og Storelogen.",
    href: "/silent-disco",
  },
  {
    icon: UtensilsCrossed,
    title: "Catering",
    description:
      "Kvarterets kjøkken skreddersyr mat etter ønske – fra tapas til storselskap.",
    href: "/catering",
  },
] as const

function ServicesSection() {
  return (
    <section aria-labelledby="services-heading">
      <h2
        className="mb-5 font-heading text-2xl text-foreground"
        id="services-heading"
      >
        Tillegg og tjenester
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {SERVICES.map(({ icon: Icon, title, description, href }) => (
          <Link
            className="group flex flex-col gap-4 panel shadow-shadow transition-transform hover:-translate-y-1"
            href={href}
            key={href}
          >
            <Icon aria-hidden className="size-6 text-primary" />
            <div className="space-y-1.5">
              <h3 className="font-heading text-xl text-foreground">{title}</h3>
              <p>{description}</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-2 font-heading text-foreground group-hover:underline group-hover:underline-offset-4">
              Les mer
              <ArrowRight aria-hidden className="size-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default async function BookRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ room?: string }>
}) {
  const locale = await resolvePageLocale(params)
  const { room: roomParam } = await searchParams
  const preselectedRoomId = roomParam ? Number(roomParam) : undefined
  activateRequestLocale(locale)

  const [
    initialRooms,
    houseHours,
    roomsPageContent,
    termsPage,
    cancellationPage,
  ] = await Promise.all([
    fetchBookableRoomsForBooker("ekstern"),
    fetchHouseHours(),
    fetchRoomsPageContent(),
    fetchPageBySlug("leie-av-lokaler"),
    fetchPageBySlug("avbestillingsvilkar"),
  ])

  const howToSection = roomsPageContent?.sections?.find(
    s => s.title === "Slik booker du",
  )
  const leietiderSection = roomsPageContent?.sections?.find(
    s => s.title === "Leietider",
  )
  const questionsSection = roomsPageContent?.sections?.find(
    s => s.title === "Spørsmål og vilkår",
  )

  return (
    <article className="flex w-full flex-col gap-10">
      <header className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="space-y-4">
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
              Fyll ut skjemaet under, så behandler vi forespørselen din så fort
              vi ser den. En booking er en forespørsel og bekreftes av oss på
              e-post.
            </p>
            <Link
              className="group inline-flex items-center gap-1.5 font-heading underline-offset-4 hover:underline focus-brutal"
              href="/rom"
            >
              Se alle rom
              <ArrowRight className="size-4 transition-transform duration-base ease-out group-hover:translate-x-1" />
            </Link>
          </div>
          <LeietiderSection
            className="lg:max-w-xs lg:justify-self-end"
            section={leietiderSection}
          />
        </div>
      </header>

      <HowToBookSection section={howToSection} />

      <BookingForm
        cancellationTermsContent={cancellationPage?.content ?? null}
        closedDates={houseHours?.houseClosedDates ?? []}
        initialRoomId={preselectedRoomId}
        initialRooms={initialRooms}
        openingHours={houseHours?.operationsManagerHours ?? null}
        vacationMode={houseHours?.vacationMode}
        rentalTermsContent={termsPage?.content ?? null}
      />

      {questionsSection ? (
        <QuestionsSection section={questionsSection} />
      ) : null}

      <ServicesSection />
    </article>
  )
}
