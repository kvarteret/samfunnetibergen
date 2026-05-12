import Link from "next/link"

import { Button } from "@/components/ui/button"
import type { VolunteerStats } from "@/features/blifrivillig/stats"
import { fetchVolunteerStats } from "@/features/blifrivillig/stats"
import { type ArrangementSummary, EventCard } from "@/features/events/components/ArrangementCard"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import {
    fetchHomePageContent,
    fetchPublishedArrangements,
    fetchSiteMetadata,
} from "@/lib/sanity/fetch"

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
        "Samfunnet i Bergen"
    const description =
        homePage?.seoDescription ??
        siteMetadata?.defaultSeoDescription ??
        homePage?.description ??
        "Studenthuset i Bergen — over 1500 arrangementer i året, driftet av frivillige studenter."
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

type SanityArrangement = Awaited<ReturnType<typeof fetchPublishedArrangements>>[number]
type SanityArrangementDate = NonNullable<SanityArrangement["dates"]>[number]

const FALLBACK_HOME_DESCRIPTION =
    "Samfunnen er en fusjon av Kvarteret og Samfunnet i Bergen. Vi holder til på samme plass som alltid, i det samme bygget kalt Det Akademiske Kvarter. Som student i Bergen er det å bli frivillig på Samfunnet en fantastisk måte å sette ditt preg på studentlivet.\n\nSamfunnet i Bergen er studenthuset i Bergen og er et av Norges mest aktive kulturhus. Hvert år arrangeres det over 1500 arrangementer og alt blir driftet av frivillige studenter. Vi har tre barer som alle er frivilligdrevet samt utallige grupper for å dekke alle studenters behov. Samfunnet er et samlingssted for alle Bergens studenter om det er for morgenkaffen eller kveldsfesting!"

function localizeHref(href: string | null | undefined, locale: AppLocale) {
    if (!href) return `/${locale}`
    if (!href.startsWith("/")) return href
    return href === "/" ? `/${locale}` : `/${locale}${href}`
}

function toArrangementSummary(arrangement: SanityArrangement): ArrangementSummary {
    return {
        _id: arrangement._id,
        title: arrangement.title,
        slug: arrangement.slug,
        isRecurring: arrangement.isRecurring ?? undefined,
        rrule: arrangement.rrule ?? null,
        dates: (arrangement.dates ?? []).map((d: SanityArrangementDate) => ({
            _key: d._key,
            startDate: d.startDate,
            startTime: d.startTime ?? null,
            endTime: d.endTime ?? null,
        })),
        isFree: arrangement.isFree ?? undefined,
        priceOrdinar: arrangement.priceOrdinar ?? null,
        priceStudent: arrangement.priceStudent ?? null,
        priceMedlem: arrangement.priceMedlem ?? null,
        ticketUrl: arrangement.ticketUrl ?? null,
        facebookUrl: arrangement.facebookUrl ?? null,
        imageUrl: arrangement.imageUrl ?? null,
        imageCaption: arrangement.imageCaption ?? null,
        room: arrangement.room
            ? {
                  _id: arrangement.room._id,
                  title: arrangement.room.title,
                  slug: arrangement.room.slug,
                  floor: arrangement.room.floor ?? null,
                  imageUrl: arrangement.room.imageUrl ?? null,
              }
            : null,
        roomText: arrangement.roomText ?? null,
        organizerGroup: arrangement.organizerGroup
            ? {
                  _id: arrangement.organizerGroup._id,
                  name: arrangement.organizerGroup.name,
                  slug: arrangement.organizerGroup.slug,
              }
            : null,
        organizerText: arrangement.organizerText ?? null,
        eventType: arrangement.eventType
            ? {
                  _id: arrangement.eventType._id,
                  name: arrangement.eventType.name,
                  taxonomyGroup: arrangement.eventType.taxonomyGroup
                      ? {
                            _id: arrangement.eventType.taxonomyGroup._id,
                            name: arrangement.eventType.taxonomyGroup.name,
                        }
                      : null,
              }
            : null,
    }
}

export default async function Home({ params }: PageProps<"/[locale]">) {
    const locale = (await resolvePageLocale(params)) as AppLocale
    activateRequestLocale(locale)

    const [homePage, arrangements, volunteerStats] = await Promise.all([
        fetchHomePageContent(locale),
        fetchPublishedArrangements(),
        fetchVolunteerStats(),
    ])
    const visibleArrangements = (arrangements ?? []).slice(0, 4)

    return (
        <div className="flex flex-col gap-12 pb-12">
            <HomeHero homePage={homePage} locale={locale} />
            <HomeEvents arrangements={visibleArrangements} locale={locale} />
            {volunteerStats && <VolunteerStatsSection stats={volunteerStats} />}
        </div>
    )
}

// ─── HomeHero ─────────────────────────────────────────────────────────────────

type HomePage = Awaited<ReturnType<typeof fetchHomePageContent>>

function HomeHero({ homePage, locale }: { homePage: HomePage; locale: AppLocale }) {
    const ctaHref = localizeHref(homePage?.primaryCta?.href ?? "/blifrivillig", locale)
    const ctaLabel = homePage?.primaryCta?.label ?? "Bli frivillig"

    return (
        <section className="border-b-2 border-border pb-10 pt-2">
            <p className="mb-5 font-heading text-xs uppercase tracking-[0.18em] text-foreground/50">
                {homePage?.eyebrow ?? "Studentenes hus i Bergen"}
            </p>
            <h1 className="mb-8 font-heading text-3xl leading-tight sm:text-4xl">
                {homePage?.title ?? "Samfunnet i Bergen"}
            </h1>
            <div className="flex flex-col gap-6">
                {(homePage?.description ?? FALLBACK_HOME_DESCRIPTION)
                    .split(/\n{2,}/)
                    .map(paragraph => (
                        <p
                            className="max-w-2xl text-base leading-relaxed text-foreground/75"
                            key={paragraph}
                        >
                            {paragraph}
                        </p>
                    ))}
                <Button asChild size="lg" className="self-start shrink-0">
                    <Link href={ctaHref}>{ctaLabel}</Link>
                </Button>
            </div>
        </section>
    )
}

// ─── HomeEvents ───────────────────────────────────────────────────────────────

interface HomeEventsProps {
    arrangements: SanityArrangement[]
    locale: AppLocale
}

function HomeEvents({ arrangements, locale }: HomeEventsProps) {
    if (!arrangements.length) return null

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
                {arrangements.map(arrangement => (
                    <EventCard
                        arrangement={toArrangementSummary(arrangement)}
                        facebookLabel="Facebook"
                        key={arrangement._id}
                        locale={locale}
                        showActions={false}
                        showRoom={false}
                        size="small"
                        ticketsLabel="Billetter"
                        variant="transparent"
                    />
                ))}
            </div>
        </section>
    )
}

// ─── VolunteerStatsSection ────────────────────────────────────────────────────

function VolunteerStatsSection({ stats }: { stats: VolunteerStats }) {
    return (
        <section className="space-y-4">
            <p className="border-b-2 border-border pb-2 font-heading text-xs uppercase tracking-[0.18em] text-foreground/50">
                Frivillige
            </p>
            <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-border bg-card p-6 text-center">
                    <p className="font-heading text-xs uppercase tracking-widest text-foreground/50">
                        over
                    </p>
                    <p className="font-heading text-4xl text-foreground">
                        {Math.round(stats.totalVolunteers / 1000) + " tusen"}
                    </p>
                    <p className="mt-1 text-sm text-foreground/60">frivillige siden 1995</p>
                </div>
                <div className="border-2 border-border bg-card p-6 text-center">
                    <p className="font-heading text-4xl text-foreground">
                        {stats.currentSemesterVolunteers.toLocaleString("nb-NO")}
                    </p>
                    <p className="mt-1 text-sm text-foreground/60">frivillige dette semesteret</p>
                </div>
            </div>
        </section>
    )
}
