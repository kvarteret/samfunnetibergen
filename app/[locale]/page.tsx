import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
        title: siteMetadata?.homeTitle ?? "Studentersamfunnet i Bergen",
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
        <div className="flex flex-col gap-8 pb-12">
            <div className="h-42 bg-gray-200 my-2 w-full" />

            <p className="text-center">
                Studentersamfunnet i Bergen er byens eldste allmenne studentorganisasjon og
                Vestlandets største politisk uavhengige forum for samfunns- og kulturdebatt. Vi er
                byens studentkulturhus og holder til på Det akademiske Kvarter. Med over 100
                frivillige og en rik historie driver vi med ett mål for øyet: &quot;Å samle
                studenter og byen forøvrig til tiltak som kan fremme samhold, åndsdannelse og
                interesse for allmennkulturelle spørsmål.&quot;
            </p>

            <Button className="bg-destructive w-32 m-auto" size="lg" asChild>
                <Link href={`/${locale}/blifrivillig`}>BLI FRIVILLIG</Link>
            </Button>

            <HomeEvents events={visibleEvents} locale={locale} />

            {volunteerStats && <VolunteerStatsSection stats={volunteerStats} />}
        </div>
    )
}

function VolunteerStatsSection({ stats }: { stats: VolunteerStats }) {
    return (
        <div className="space-y-4">
            <Card className="flex flex-row justify-between bg-destructive p-2">
                <p>FRIVILLIGE</p>
            </Card>
            <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-border bg-card p-6 text-center">
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
        </div>
    )
}

interface HomeEventsProps {
    events: EventDetail[]
    locale: AppLocale
}

function RecurrenceChips({
    occurrences,
    locale,
}: {
    occurrences: EventDetail[]
    locale: AppLocale
}) {
    if (!occurrences.length) return null
    const visible = occurrences.slice(0, 2)
    const overflow = occurrences.length - 2
    const overflowLabel = overflow >= 9 ? "9+" : `+${overflow}`
    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {visible.map(o => (
                <span
                    key={o.id}
                    className="border border-border px-1.5 py-0 text-[10px] text-foreground/50"
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
    )
}

function HomeEvents({ events, locale }: HomeEventsProps) {
    return (
        <div className="space-y-4">
            <Card className="flex flex-row justify-between bg-destructive p-2">
                <p>ARRANGEMENTER</p>
                <Link href={`/${locale}/arrangementer`}>SE MER</Link>
            </Card>
            <div className="flex w-full gap-4">
                {events.map(event => (
                    <Link
                        className="flex-1"
                        href={`/${locale}/arrangementer/${event.slug}`}
                        key={event.id}
                    >
                        <Card className="relative h-24 overflow-hidden bg-gray-200">
                            {event.image_url && (
                                <Image
                                    alt={event.title}
                                    className="object-cover"
                                    fill
                                    src={event.image_url}
                                />
                            )}
                        </Card>
                        <div className="flex justify-between pt-2 text-xs">
                            <p>{event.event_type?.name ?? ""}</p>
                            <p>{formatEventDate(event, locale)}</p>
                        </div>
                        <p className="text-lg">{event.title}</p>
                        {event.occurrences && event.occurrences.length > 0 && (
                            <RecurrenceChips occurrences={event.occurrences} locale={locale} />
                        )}
                    </Link>
                ))}
            </div>
        </div>
    )
}
