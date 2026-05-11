import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { collapseRecurringEvents, type EventDetail, getPublicEvents } from "@/lib/events"
import { fetchSiteMetadata } from "@/lib/sanity/queries"
import type { VolunteerStats } from "@/lib/volunteer-stats"
import { fetchVolunteerStats } from "@/lib/volunteer-stats"

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
    const locale = await resolvePageLocale(params)
    const siteMetadata = await fetchSiteMetadata(locale, { stega: false })
    return {
        title: siteMetadata?.homeTitle ?? "Samfunnet i Bergen",
        description:
            siteMetadata?.homeDescription ??
            "Studenthuset i Bergen — over 1500 arrangementer i året, driftet av frivillige studenter.",
    }
}

const formatEventDate = (event: EventDetail, locale: AppLocale): string => (
    void locale,
    new Intl.DateTimeFormat("nb-NO", {
        day: "numeric",
        month: "long",
        timeZone: "Europe/Oslo",
    }).format(new Date(event.starts_at))
)

export default async function Home({ params }: PageProps<"/[locale]">) {
    const locale = (await resolvePageLocale(params)) as AppLocale
    activateRequestLocale(locale)

    const [eventsResult, volunteerStats] = await Promise.all([
        getPublicEvents(locale),
        fetchVolunteerStats(),
    ])
    const visibleEvents = eventsResult.ok
        ? collapseRecurringEvents(eventsResult.events).slice(0, 4)
        : []

    return (
        <div className="flex flex-col gap-12 pb-12">
            <HomeHero locale={locale} />
            <HomeEvents events={visibleEvents} locale={locale} />
            {volunteerStats && <VolunteerStatsSection stats={volunteerStats} />}
        </div>
    )
}

// ─── HomeHero ─────────────────────────────────────────────────────────────────

function HomeHero({ locale }: { locale: AppLocale }) {
    return (
        <section className="border-b-2 border-border pb-10 pt-2">
            <p className="mb-5 font-heading text-xs uppercase tracking-[0.18em] text-foreground/50">
                Studentenes hus i Bergen
            </p>
            <h1 className="mb-8 font-heading text-3xl leading-tight sm:text-4xl">
                Samfunnet i Bergen
            </h1>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-10">
                <p className="max-w-2xl text-base leading-relaxed text-foreground/75">
                    Byens eldste allmenne studentorganisasjon og Vestlandets største politisk
                    uavhengige forum for samfunns- og kulturdebatt. Med over 100 frivillige driver
                    vi studentkulturhuset på Det akademiske Kvarter.
                </p>
                <Button asChild size="lg" className="self-start shrink-0">
                    <Link href={`/${locale}/blifrivillig`}>Bli frivillig</Link>
                </Button>
            </div>
        </section>
    )
}

// ─── HomeEvents ───────────────────────────────────────────────────────────────

interface HomeEventsProps {
    events: EventDetail[]
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
                    <EventPreviewCard event={event} key={event.id} locale={locale} />
                ))}
            </div>
        </section>
    )
}

interface EventPreviewCardProps {
    event: EventDetail
    locale: AppLocale
}

function EventPreviewCard({ event, locale }: EventPreviewCardProps) {
    const href = `/${locale}/arrangementer/${event.slug}`
    const date = formatEventDate(event, locale)
    const typeLabel = event.event_type?.name ?? ""

    return (
        <Link className="group flex flex-col gap-2" href={href}>
            <div className="relative aspect-[4/3] w-full overflow-hidden border-2 border-border bg-muted">
                {event.image_url && (
                    <Image
                        alt={event.title}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        src={event.image_url}
                    />
                )}
            </div>
            <div className="flex justify-between text-[11px] uppercase tracking-[0.12em] text-foreground/50">
                <span>{typeLabel}</span>
                <span className="shrink-0">{date}</span>
            </div>
            <p className="font-heading text-lg leading-snug group-hover:underline group-hover:underline-offset-4">
                {event.title}
            </p>
            {event.occurrences && event.occurrences.length > 0 && (
                <RecurrenceChips
                    intervalDays={event.recurring_interval_days}
                    locale={locale}
                    occurrences={event.occurrences}
                />
            )}
        </Link>
    )
}

function getRecurringLabel(intervalDays: number | null | undefined): string {
    if (intervalDays === 1) return "Hver dag"
    if (intervalDays === 7) return "Hver uke"
    if (intervalDays != null && intervalDays >= 28 && intervalDays <= 31) return "Hver måned"
    return "Gjentagende"
}

function RecurrenceChips({
    occurrences,
    intervalDays,
    locale,
}: {
    occurrences: EventDetail[]
    intervalDays?: number | null
    locale: AppLocale
}) {
    if (!occurrences.length) return null
    const visible = occurrences.slice(0, 2)
    const overflow = occurrences.length - 2
    const overflowLabel = overflow >= 9 ? "9+" : `+${overflow}`
    return (
        <div className="mt-1 space-y-1">
            <span className="text-[10px] uppercase tracking-[0.12em] text-foreground/40">
                {getRecurringLabel(intervalDays)}
            </span>
            <div className="flex flex-wrap gap-1">
                {visible.map(o => (
                    <span
                        className="border border-border px-1.5 py-0 text-[10px] text-foreground/50"
                        key={o.id}
                    >
                        {formatEventDate(o, locale)}
                    </span>
                ))}
                {overflow > 0 && (
                    <span className="border border-border px-1.5 py-0 text-[10px] text-foreground/50">
                        {overflowLabel}
                    </span>
                )}
            </div>
        </div>
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
