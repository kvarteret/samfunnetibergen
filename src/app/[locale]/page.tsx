import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"
import {
  EventCard,
  type EventDateEntry,
  type EventSummary,
} from "@/features/events"
import {
  computeAllDates,
  formatPrimaryDate,
  getRecurringLabel,
} from "@/features/events/domain/dates"
import type { AppLocale } from "@/i18n/routing"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import {
  fetchBarPreviews,
  fetchHomePageContent,
  fetchPublishedEvents,
  fetchSiteMetadata,
} from "@/lib/sanity/fetch"
import { HomeBarPreviews } from "./_components/HomeBarPreviews"
import { HomeBookingBanner } from "./_components/HomeBookingBanner"
import { HomeGrupperBanner } from "./_components/HomeGrupperBanner"
import { SlackFeedback } from "./_components/SlackFeedback"

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const locale = await resolvePageLocale(params)
  const [homePage, siteMetadata] = await Promise.all([
    fetchHomePageContent(locale, { stega: false }),
    fetchSiteMetadata(locale, { stega: false }),
  ])
  const title =
    homePage?.seoTitle ??
    siteMetadata?.defaultSeoTitle ??
    homePage?.title ??
    siteMetadata?.siteName ??
    undefined
  const description =
    homePage?.seoDescription ??
    siteMetadata?.defaultSeoDescription ??
    homePage?.description ??
    undefined
  const openGraphTitle =
    homePage?.openGraphTitle ?? siteMetadata?.defaultOpenGraphTitle ?? title
  const openGraphDescription =
    homePage?.openGraphDescription ??
    siteMetadata?.defaultOpenGraphDescription ??
    description
  const openGraphImage =
    homePage?.openGraphImageUrl ?? siteMetadata?.defaultOpenGraphImageUrl
  return {
    title,
    description,
    alternates: {
      canonical: homePage?.canonicalUrl ?? `/${locale}`,
    },
    robots: {
      index: !homePage?.noIndex,
      follow: !homePage?.noFollow,
    },
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      images: openGraphImage
        ? [
            {
              url: openGraphImage,
              alt: homePage?.openGraphImageAlt ?? undefined,
            },
          ]
        : undefined,
      siteName: siteMetadata?.siteName ?? "Samfunnet i Bergen",
    },
  }
}

type SanityEvent = Awaited<ReturnType<typeof fetchPublishedEvents>>[number]
type SanityEventDate = NonNullable<SanityEvent["dates"]>[number]

function localizeHref(href: string | null | undefined, locale: AppLocale) {
  if (!href) return `/${locale}`
  if (!href.startsWith("/")) return href
  return href === "/" ? `/${locale}` : `/${locale}${href}`
}

type EventCardLabels = {
  today: string
  tomorrow: string
  inNDays: (n: number) => string
  recurringDaily: string
  recurringWeekly: string
  recurringMonthly: string
  recurringGeneric: string
}

function toEventSummary(
  event: SanityEvent,
  labels?: EventCardLabels,
): EventSummary {
  const dates: EventDateEntry[] = (event.dates ?? []).map(
    (d: SanityEventDate) => ({
      _key: d._key,
      startDate: d.startDate,
      startTime: d.startTime ?? null,
      endTime: d.endTime ?? null,
    }),
  )

  const todayStr = new Date().toISOString().split("T")[0]!
  const resolvedDates = computeAllDates(dates, event.rrule, todayStr)

  const primaryDateLabels = labels
    ? {
        today: labels.today,
        tomorrow: labels.tomorrow,
        inNDays: labels.inNDays,
      }
    : undefined
  const primaryDate = resolvedDates[0]
  const primaryDateLabel =
    primaryDate && primaryDateLabels
      ? formatPrimaryDate(primaryDate, primaryDateLabels)
      : null
  const recurringLabel =
    labels && event.isRecurring
      ? getRecurringLabel(event.rrule, {
          daily: labels.recurringDaily,
          weekly: labels.recurringWeekly,
          monthly: labels.recurringMonthly,
          generic: labels.recurringGeneric,
        })
      : null

  return {
    _id: event._id,
    title: event.title,
    slug: event.slug,
    isRecurring: event.isRecurring ?? undefined,
    rrule: event.rrule ?? null,
    dates,
    resolvedDates,
    recurringLabel,
    primaryDateLabel,
    isFree: event.isFree ?? undefined,
    priceOrdinar: event.priceOrdinar ?? null,
    priceStudent: event.priceStudent ?? null,
    priceMedlem: event.priceMedlem ?? null,
    ticketUrl: event.ticketUrl ?? null,
    facebookUrl: event.facebookUrl ?? null,
    imageUrl: event.imageUrl ?? null,
    imageCaption: event.imageCaption ?? null,
    room: event.room
      ? {
          _id: event.room._id,
          title: event.room.title,
          slug: event.room.slug,
          floor: event.room.floor ?? null,
          imageUrl: event.room.imageUrl ?? null,
        }
      : null,
    roomText: event.roomText ?? null,
    organizerGroup: event.organizerGroup
      ? {
          _id: event.organizerGroup._id,
          name: event.organizerGroup.name,
          slug: event.organizerGroup.slug,
        }
      : null,
    organizerText: event.organizerText ?? null,
    eventType: event.eventType
      ? {
          _id: event.eventType._id,
          name: event.eventType.name,
          taxonomyGroup: event.eventType.taxonomyGroup
            ? {
                _id: event.eventType.taxonomyGroup._id,
                name: event.eventType.taxonomyGroup.name,
              }
            : null,
        }
      : null,
  }
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = (await resolvePageLocale(params)) as AppLocale
  activateRequestLocale(locale)

  const [homePage, events, barPreviews, t, homeT] = await Promise.all([
    fetchHomePageContent(locale),
    fetchPublishedEvents(),
    fetchBarPreviews(),
    getTranslations({ locale, namespace: "EventCard" }),
    getTranslations({ locale, namespace: "HomePage" }),
  ])
  const visibleEvents = (events ?? []).slice(0, 3)

  const eventCardLabels: EventCardLabels = {
    today: t("today"),
    tomorrow: t("tomorrow"),
    inNDays: (n: number) => t("inNDays", { n }),
    recurringDaily: t("recurringDaily"),
    recurringWeekly: t("recurringWeekly"),
    recurringMonthly: t("recurringMonthly"),
    recurringGeneric: t("recurringGeneric"),
  }

  return (
    <div className="flex flex-col gap-12 pb-12">
      <HomeHero homePage={homePage} locale={locale} />
      <HomeUpdateNotice locale={locale} />
      <HomeEvents
        events={visibleEvents}
        labels={eventCardLabels}
        locale={locale}
      />
      <div className="hs:hidden">
        <HomeBookingBanner
          body={homeT("bookingBannerBody")}
          cta={homeT("bookingBannerCta")}
          eyebrow={homeT("bookingBannerEyebrow")}
          heading1={homeT("bookingBannerHeading1")}
          heading2={homeT("bookingBannerHeading2")}
        />
      </div>
      <HomeBarPreviews
        houseClosedDates={barPreviews?.houseClosedDates}
        locale={locale}
        rooms={barPreviews?.rooms ?? []}
      />
      <div className="hs:hidden">
        <HomeGrupperBanner
          body={homeT("grupperBannerBody")}
          cta={homeT("grupperBannerCta")}
          eyebrow={homeT("grupperBannerEyebrow")}
          heading1={homeT("grupperBannerHeading1")}
          heading2={homeT("grupperBannerHeading2")}
        />
      </div>

      <section className="hs:hidden">
        <Image
          alt=""
          className="hidden h-auto w-full md:block"
          height={288}
          priority={false}
          src="/images/studentersamfunnet-illustration.webp"
          width={866}
        />
        <Image
          alt=""
          className="mx-auto h-auto w-full md:hidden"
          height={500}
          priority={false}
          src="/images/studentersamfunnet-illustration-mobile.webp"
          width={500}
        />
      </section>
      <div className="hs:hidden">
        <SlackFeedback />
      </div>
    </div>
  )
}

// ─── HomeHero ─────────────────────────────────────────────────────────────────

type HomePage = Awaited<ReturnType<typeof fetchHomePageContent>>

function HomeHero({
  homePage,
  locale,
}: {
  homePage: HomePage
  locale: AppLocale
}) {
  const ctaHref = homePage?.primaryCta?.href
    ? localizeHref(homePage.primaryCta.href, locale)
    : null

  return (
    <section className="hs:bg-card hs:w-screen hs:[margin-left:calc(50%_-_50vw)] hs:-mt-10 hs:pt-10 hs:pb-10 lg:hs:pt-16 lg:hs:pb-16">
      <div className="grid items-center gap-8 pb-12 pt-2 lg:grid-cols-[minmax(0,0.85fr)_minmax(380px,1.15fr)] lg:gap-14 hs:mx-auto hs:w-full hs:max-w-7xl hs:px-6 hs:pt-0 hs:pb-0 hs:sm:px-10 hs:lg:px-14 dan:grid-cols-1 dan:text-center">
        <div className="flex flex-col gap-6">
          {homePage?.title && (
            <h1 className="font-heading text-4xl leading-tight sm:text-5xl dan:sm:text-6xl">
              {homePage.title}
            </h1>
          )}
          {homePage?.description?.split(/\n{2,}/).map(paragraph => (
            <p
              className="max-w-2xl leading-relaxed text-foreground-muted dan:mx-auto dan:text-center dan:italic"
              key={paragraph}
            >
              {paragraph}
            </p>
          ))}
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3 dan:justify-center">
            {ctaHref && homePage?.primaryCta?.label ? (
              <>
                <Button
                  className="shrink-0"
                  render={<Link href={ctaHref} />}
                  size="lg"
                >
                  {homePage.primaryCta.label}
                </Button>
                <Link
                  className="group inline-flex items-center gap-1.5 font-heading underline-offset-4 hover:underline focus-brutal"
                  href={`/${locale}/arrangementer`}
                >
                  Se hva som skjer
                  <ArrowRight className="size-4 transition-transform duration-base ease-out group-hover:translate-x-1" />
                </Link>
              </>
            ) : (
              <Button
                className="group shrink-0"
                render={<Link href={`/${locale}/arrangementer`} />}
                size="lg"
              >
                Se hva som skjer
                <ArrowRight className="size-4 transition-transform duration-base ease-out group-hover:translate-x-1" />
              </Button>
            )}
          </div>
        </div>
        <Image
          alt="Illustrasjon av Det Akademiske Kvarter"
          className="order-first mx-auto h-auto w-full max-w-sm lg:order-none lg:mr-0 lg:max-w-none dan:hidden"
          height={986}
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          src="/kvarteret-logo.svg"
          width={1595}
        />
      </div>
    </section>
  )
}

// ─── HomeUpdateNotice ─────────────────────────────────────────────────────────

// Temporary maintenance notice shown while the site is being finalized.
// Norwegian-only by intent; remove once the redesign content is in place.
function HomeUpdateNotice({ locale }: { locale: AppLocale }) {
  return (
    <section
      aria-label="Statusmelding"
      className="panel flex flex-col gap-2 rounded-base sm:flex-row sm:items-center sm:justify-between sm:gap-6"
    >
      <p className="text-foreground-muted">
        Vi oppdaterer våre nettsider. Finner du ikke det du leter etter?
      </p>
      <Link
        className="group inline-flex shrink-0 items-center gap-1.5 font-heading text-foreground underline underline-offset-4 focus-brutal"
        href={`/${locale}/kontakt`}
      >
        Kontakt oss
        <ArrowRight className="size-4 transition-transform duration-base ease-out group-hover:translate-x-1" />
      </Link>
    </section>
  )
}

// ─── HomeEvents ───────────────────────────────────────────────────────────────

interface HomeEventsProps {
  events: SanityEvent[]
  labels: EventCardLabels
  locale: AppLocale
}

function HomeEvents({ events, labels, locale }: HomeEventsProps) {
  if (!events.length) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between pb-2 dan:pb-4">
        <p className="font-heading text-xl text-foreground-muted dan:text-3xl dan:text-foreground dan:sm:text-4xl">
          Arrangementer
        </p>
        <Link
          className="group inline-flex items-center gap-1.5 font-heading underline underline-offset-4 focus-brutal"
          href={`/${locale}/arrangementer`}
        >
          Se alle
          <ArrowRight className="size-4 transition-transform duration-base ease-out group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map(event => (
          <EventCard
            event={toEventSummary(event, labels)}
            facebookLabel="Facebook"
            key={event._id}
            showActions={false}
            showRoom={false}
            size="small"
            ticketsLabel="Billetter"
            variant="default"
          />
        ))}
      </div>
    </section>
  )
}