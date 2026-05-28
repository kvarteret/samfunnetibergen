import Link from "next/link"

import { Button } from "@/components/ui/button"
import { EventCard, type EventSummary } from "@/features/events/components/ArrangementCard"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchHomePageContent, fetchPublishedEvents, fetchSiteMetadata } from "@/lib/sanity/fetch"

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
    const openGraphTitle = homePage?.openGraphTitle ?? siteMetadata?.defaultOpenGraphTitle ?? title
    const openGraphDescription =
        homePage?.openGraphDescription ?? siteMetadata?.defaultOpenGraphDescription ?? description
    const openGraphImage = homePage?.openGraphImageUrl ?? siteMetadata?.defaultOpenGraphImageUrl
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

function toEventSummary(event: SanityEvent): EventSummary {
    return {
        _id: event._id,
        title: event.title,
        slug: event.slug,
        isRecurring: event.isRecurring ?? undefined,
        rrule: event.rrule ?? null,
        dates: (event.dates ?? []).map((d: SanityEventDate) => ({
            _key: d._key,
            startDate: d.startDate,
            startTime: d.startTime ?? null,
            endTime: d.endTime ?? null,
        })),
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

    const [homePage, events] = await Promise.all([
        fetchHomePageContent(locale),
        fetchPublishedEvents(),
    ])
    const visibleEvents = (events ?? []).slice(0, 4)

    return (
        <div className="flex flex-col gap-12 pb-12">
            <HomeHero homePage={homePage} locale={locale} />
            <HomeEvents events={visibleEvents} locale={locale} />
        </div>
    )
}

// ─── HomeHero ─────────────────────────────────────────────────────────────────

type HomePage = Awaited<ReturnType<typeof fetchHomePageContent>>

function HomeHero({ homePage, locale }: { homePage: HomePage; locale: AppLocale }) {
    const ctaHref = homePage?.primaryCta?.href
        ? localizeHref(homePage.primaryCta.href, locale)
        : null

    return (
        <section className="pb-10 pt-2">
            {homePage?.eyebrow && (
                <p className="mb-5 font-heading text-xs uppercase tracking-[0.18em] text-foreground/50">
                    {homePage.eyebrow}
                </p>
            )}
            {homePage?.title && (
                <h1 className="mb-8 font-heading text-3xl leading-tight sm:text-4xl">
                    {homePage.title}
                </h1>
            )}
            <div className="flex flex-col gap-6">
                {homePage?.description
                    ?.split(/\n{2,}/)
                    .map(paragraph => (
                        <p
                            className="max-w-2xl text-base leading-relaxed text-foreground/75"
                            key={paragraph}
                        >
                            {paragraph}
                        </p>
                    ))}
                {ctaHref && homePage?.primaryCta?.label && (
                    <Button asChild size="lg" className="self-start shrink-0">
                        <Link href={ctaHref}>{homePage.primaryCta.label}</Link>
                    </Button>
                )}
            </div>
        </section>
    )
}

// ─── HomeEvents ───────────────────────────────────────────────────────────────

interface HomeEventsProps {
    events: SanityEvent[]
    locale: AppLocale
}

function HomeEvents({ events, locale }: HomeEventsProps) {
    if (!events.length) return null

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-border pb-2">
                <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/50">
                    Kommende arrangementer
                </p>
                <Link
                    className="text-xs uppercase tracking-[0.18em] underline underline-offset-4"
                    href={`/${locale}/arrangementer`}
                >
                    Se alle
                </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {events.map(event => (
                    <EventCard
                        event={toEventSummary(event)}
                        facebookLabel="Facebook"
                        key={event._id}
                        locale={locale}
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
