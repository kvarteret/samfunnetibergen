import Image from "next/image"
import Link from "next/link"
import { RRule } from "rrule"

import { Button } from "@/components/ui/button"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchPublishedArrangements, fetchSiteMetadata } from "@/lib/sanity/queries"
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

type SanityArrangement = Awaited<ReturnType<typeof fetchPublishedArrangements>>[number]

type DateEntry = {
    _key: string
    startDate: string
    startTime?: string | null
    endTime?: string | null
}

const MONTH_NAMES_NB = [
    "jan",
    "feb",
    "mar",
    "apr",
    "mai",
    "jun",
    "jul",
    "aug",
    "sep",
    "okt",
    "nov",
    "des",
]

function formatShortDate(dateStr: string): string {
    const d = new Date(`${dateStr}T00:00:00`)
    return `${d.getDate()}. ${MONTH_NAMES_NB[d.getMonth()]}`
}

function getRecurringLabel(rrule: string | null | undefined): string {
    if (!rrule) return "Gjentagende"
    const freq = rrule.match(/FREQ=(\w+)/)?.[1]?.toUpperCase()
    if (freq === "DAILY") return "Hver dag"
    if (freq === "WEEKLY") return "Hver uke"
    if (freq === "MONTHLY") return "Hver måned"
    return "Gjentagende"
}

function getUpcomingDates(arrangement: SanityArrangement): DateEntry[] {
    const todayStr = new Date().toISOString().split("T")[0]!
    const seed = arrangement.dates?.[0]

    if (arrangement.isRecurring && arrangement.rrule && seed) {
        try {
            const rule = new RRule({
                ...RRule.parseString(arrangement.rrule),
                dtstart: new Date(`${seed.startDate}T12:00:00Z`),
            })
            const ceiling = new Date(
                new Date().getFullYear() + 1,
                new Date().getMonth(),
                new Date().getDate(),
            )
            return rule
                .between(new Date(), ceiling, true)
                .slice(0, 5)
                .map((d, i) => ({
                    _key: `rrule-${i}`,
                    startDate: d.toISOString().split("T")[0]!,
                    startTime: seed.startTime ?? null,
                    endTime: seed.endTime ?? null,
                }))
        } catch {
            // fall through
        }
    }

    const dates = (arrangement.dates ?? []) as DateEntry[]
    const future = dates.filter(d => d.startDate >= todayStr)
    return future.length > 0 ? future : dates
}

export default async function Home({ params }: PageProps<"/[locale]">) {
    const locale = (await resolvePageLocale(params)) as AppLocale
    activateRequestLocale(locale)

    const [arrangements, volunteerStats] = await Promise.all([
        fetchPublishedArrangements(),
        fetchVolunteerStats(),
    ])
    const visibleArrangements = (arrangements ?? []).slice(0, 4)

    return (
        <div className="flex flex-col gap-12 pb-12">
            <HomeHero locale={locale} />
            <HomeEvents arrangements={visibleArrangements} locale={locale} />
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
                    <EventPreviewCard
                        arrangement={arrangement}
                        key={arrangement._id}
                        locale={locale}
                    />
                ))}
            </div>
        </section>
    )
}

interface EventPreviewCardProps {
    arrangement: SanityArrangement
    locale: AppLocale
}

function EventPreviewCard({ arrangement, locale }: EventPreviewCardProps) {
    const href = `/${locale}/arrangementer/${arrangement.slug}`
    const upcomingDates = getUpcomingDates(arrangement)
    const primaryDate = upcomingDates[0]
    const otherDates = upcomingDates.slice(1)
    const typeLabel = arrangement.eventType?.name ?? ""
    const dateLabel = primaryDate ? formatShortDate(primaryDate.startDate) : ""

    return (
        <Link className="group flex flex-col gap-2" href={href}>
            <div className="relative aspect-[4/3] w-full overflow-hidden border-2 border-border bg-muted">
                {arrangement.imageUrl && (
                    <Image
                        alt={arrangement.imageCaption ?? arrangement.title}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        src={arrangement.imageUrl}
                        unoptimized={arrangement.imageUrl.startsWith("blob:")}
                    />
                )}
            </div>
            <div className="flex justify-between text-[11px] uppercase tracking-[0.12em] text-foreground/50">
                <span>{typeLabel}</span>
                <span className="shrink-0">{dateLabel}</span>
            </div>
            <p className="font-heading text-lg leading-snug group-hover:underline group-hover:underline-offset-4">
                {arrangement.title}
            </p>
            {arrangement.isRecurring && (
                <RecurrenceChips dates={otherDates} rrule={arrangement.rrule} />
            )}
        </Link>
    )
}

function RecurrenceChips({ dates, rrule }: { dates: DateEntry[]; rrule?: string | null }) {
    const visible = dates.slice(0, 2)
    const overflow = dates.length - 2
    const overflowLabel = overflow >= 9 ? "9+" : `+${overflow}`

    return (
        <div className="mt-1 space-y-1">
            <span className="text-[10px] uppercase tracking-[0.12em] text-foreground/40">
                {getRecurringLabel(rrule)}
            </span>
            {visible.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {visible.map(d => (
                        <span
                            className="border border-border px-1.5 py-0 text-[10px] text-foreground/50"
                            key={d._key}
                        >
                            {formatShortDate(d.startDate)}
                        </span>
                    ))}
                    {overflow > 0 && (
                        <span className="border border-border px-1.5 py-0 text-[10px] text-foreground/50">
                            {overflowLabel}
                        </span>
                    )}
                </div>
            )}
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
