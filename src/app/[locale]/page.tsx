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
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      images: openGraphImage ? [{ url: openGraphImage }] : undefined,
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
      <HomeEvents
        events={visibleEvents}
        labels={eventCardLabels}
        locale={locale}
      />
      <HomeBookingBanner
        body={homeT("bookingBannerBody")}
        cta={homeT("bookingBannerCta")}
        eyebrow={homeT("bookingBannerEyebrow")}
        heading1={homeT("bookingBannerHeading1")}
        heading2={homeT("bookingBannerHeading2")}
        sticker={homeT("bookingBannerSticker")}
      />
      <HomeBarPreviews
        houseClosedDates={barPreviews?.houseClosedDates}
        locale={locale}
        rooms={barPreviews?.rooms ?? []}
      />
      <HomeGrupperBanner
        body={homeT("grupperBannerBody")}
        cta={homeT("grupperBannerCta")}
        eyebrow={homeT("grupperBannerEyebrow")}
        heading1={homeT("grupperBannerHeading1")}
        heading2={homeT("grupperBannerHeading2")}
      />
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
    <section className="grid items-center gap-8 pb-12 pt-2 lg:grid-cols-[minmax(0,0.85fr)_minmax(380px,1.15fr)] lg:gap-14">
      <div className="flex flex-col gap-6">
        {homePage?.title && (
          <h1 className="font-heading text-3xl leading-tight sm:text-4xl">
            {homePage.title}
          </h1>
        )}
        {homePage?.description?.split(/\n{2,}/).map(paragraph => (
          <p
            className="max-w-2xl text-base leading-relaxed text-foreground-muted"
            key={paragraph}
          >
            {paragraph}
          </p>
        ))}
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
          {ctaHref && homePage?.primaryCta?.label ? (
            <>
              <Button asChild size="lg" className="shrink-0">
                <Link href={ctaHref}>{homePage.primaryCta.label}</Link>
              </Button>
              <Link
                className="group inline-flex items-center gap-1.5 font-heading text-base uppercase tracking-widest underline-offset-4 hover:underline focus-brutal"
                href={`/${locale}/arrangementer`}
              >
                Se arrangementer
                <ArrowRight className="size-4 transition-transform duration-base ease-out group-hover:translate-x-1" />
              </Link>
            </>
          ) : (
            <Button asChild size="lg" className="group shrink-0">
              <Link href={`/${locale}/arrangementer`}>
                Se arrangementer
                <ArrowRight className="size-4 transition-transform duration-base ease-out group-hover:translate-x-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>
      <Image
        alt="Illustrasjon av Det Akademiske Kvarter"
        className="order-first mx-auto h-auto w-full max-w-sm lg:order-none lg:mr-0 lg:max-w-none"
        height={986}
        priority
        sizes="(min-width: 1024px) 45vw, 100vw"
        src="/kvarteret-logo.svg"
        width={1595}
      />
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
      <div className="flex items-center justify-between border-b-2 border-border pb-2">
        <p className="font-heading text-base uppercase tracking-widest text-foreground-muted">
          Arrangementer
        </p>
        <Link
          className="group inline-flex items-center gap-1.5 font-heading text-base uppercase tracking-widest underline underline-offset-4 focus-brutal"
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
