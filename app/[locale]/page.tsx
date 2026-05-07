import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { type EventDetail, getPublicEvents } from "@/lib/events"
import { fetchSiteMetadata } from "@/lib/sanity/queries"
import { getLaunchGroups, type LaunchGroupContent } from "@/lib/volunteer-launch-content"

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

const formatEventDate = (event: EventDetail, locale: AppLocale): string =>
    new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nb-NO", {
        day: "numeric",
        month: "long",
        timeZone: "Europe/Oslo",
    }).format(new Date(event.starts_at))

function HomeGroups({ groups, locale }: { groups: LaunchGroupContent[]; locale: AppLocale }) {
    return (
        <div className="space-y-4">
            <Card className="bg-destructive p-2 flex flex-row justify-between">
                <p>GRUPPER</p>
                <Link href={`/${locale}/grupper`}>SE MER</Link>
            </Card>
            <div className="grid grid-cols-3 gap-4">
                {groups.map(group => (
                    <Link
                        className="flex flex-col gap-1"
                        key={group.slug}
                        href={`/${locale}/grupper/${group.slug}`}
                    >
                        <Card className="h-24 bg-gray-200 overflow-hidden relative">
                            {group.imageUrl && (
                                <Image
                                    src={group.imageUrl}
                                    alt={group.name ?? ""}
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </Card>
                        <p className="font-bold">{group.name}</p>
                        <p className="text-xs lg:text-base">{group.lead}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}

function HomeEvents({ events, locale }: { events: EventDetail[]; locale: AppLocale }) {
    return (
        <div className="space-y-4">
            <Card className="bg-destructive p-2 flex flex-row justify-between">
                <p>ARRANGEMENTER</p>
                <Link href={`/${locale}/arrangementer`}>SE MER</Link>
            </Card>
            <div className="flex w-full gap-4">
                {events.map(event => (
                    <Link
                        key={event.id}
                        className="flex-1"
                        href={`/${locale}/arrangementer/${event.slug}`}
                    >
                        <Card className="h-24 bg-gray-200 overflow-hidden relative">
                            {event.image_url && (
                                <Image
                                    src={event.image_url}
                                    alt={event.title}
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </Card>
                        <div className="flex justify-between pt-2 text-xs">
                            <p>{event.event_type?.name ?? ""}</p>
                            <p>{formatEventDate(event, locale)}</p>
                        </div>
                        <p className="text-lg">{event.title}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default async function Home({ params }: PageProps<"/[locale]">) {
    const locale = (await resolvePageLocale(params)) as AppLocale
    activateRequestLocale(locale)

    const [groups, eventsResult] = await Promise.all([
        getLaunchGroups(locale),
        getPublicEvents(locale),
    ])
    const visibleEvents = eventsResult.ok ? eventsResult.events.slice(0, 4) : []

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
            <HomeGroups groups={groups} locale={locale} />
        </div>
    )
}
