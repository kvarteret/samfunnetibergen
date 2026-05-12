import { CalendarPlus, ExternalLink, Ticket } from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, resolvePageLocale } from "@/lib/app-locale"
import { PortableTextContent } from "@/lib/portable-text-components"
import { fetchArrangementBySlug, fetchSiteMetadata } from "@/lib/sanity/queries"

type Arrangement = NonNullable<Awaited<ReturnType<typeof fetchArrangementBySlug>>>

type EventPageProps = {
    params: Promise<{ event: string; locale: string }>
}

function formatDate(dateStr: string, locale: AppLocale): string {
    void locale

    return new Intl.DateTimeFormat("nb-NO", {
        dateStyle: "long",
        timeZone: "Europe/Oslo",
    }).format(new Date(`${dateStr}T00:00:00`))
}

function googleCalendarUrl(a: Arrangement): string | null {
    const firstDate = a.dates?.[0]
    if (!firstDate?.startDate) return null

    const d = firstDate.startDate.replace(/-/g, "")
    const start = firstDate.startTime ? `${d}T${firstDate.startTime.replace(":", "")}00` : d
    const end = firstDate.endTime
        ? `${d}T${firstDate.endTime.replace(":", "")}00`
        : firstDate.startTime
          ? `${d}T${firstDate.startTime.replace(":", "")}00`
          : d

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: a.title ?? "",
        dates: `${start}/${end}`,
        location: a.room?.title ?? a.roomText ?? "Samfunnet i Bergen",
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function formatPrices(a: Arrangement): string | null {
    if (a.isFree) return "Gratis"
    const parts: string[] = []
    if (a.priceOrdinar != null) parts.push(`Ord. ${a.priceOrdinar} kr`)
    if (a.priceStudent != null) parts.push(`Stud. ${a.priceStudent} kr`)
    if (a.priceMedlem != null) parts.push(`Medl. ${a.priceMedlem} kr`)
    return parts.length > 0 ? parts.join(" / ") : null
}

export async function generateMetadata({ params }: EventPageProps) {
    const resolvedParams = await params
    const [arrangement, siteMetadata] = await Promise.all([
        fetchArrangementBySlug(resolvedParams.event),
        fetchSiteMetadata(resolvedParams.locale as AppLocale, { stega: false }),
    ])

    if (!arrangement) return {}
    const title = `${arrangement.seoTitle ?? arrangement.title} | Samfunnet i Bergen`
    const description =
        arrangement.seoDescription ??
        arrangement.openGraphDescription ??
        siteMetadata?.defaultSeoDescription ??
        undefined
    const openGraphTitle = arrangement.openGraphTitle ?? arrangement.title
    const openGraphImage =
        arrangement.openGraphImageUrl ??
        arrangement.imageUrl ??
        siteMetadata?.defaultOpenGraphImageUrl

    return {
        title,
        description,
        openGraph: {
            title: openGraphTitle,
            description,
            images: openGraphImage ? [{ url: openGraphImage }] : undefined,
            siteName: siteMetadata?.siteName ?? "Samfunnet i Bergen",
            type: "article",
        },
    }
}

export default async function EventPage({ params }: EventPageProps) {
    const resolvedParams = await params
    const locale = (await resolvePageLocale(
        Promise.resolve({ locale: resolvedParams.locale }),
    )) as AppLocale
    activateRequestLocale(locale)

    const [arrangement, t] = await Promise.all([
        fetchArrangementBySlug(resolvedParams.event),
        getTranslations({ locale, namespace: "EventPage" }),
    ])

    if (!arrangement) notFound()

    const roomTitle = arrangement.room?.title ?? arrangement.roomText
    const roomSlug = arrangement.room?.slug
    const roomFloor = arrangement.room?.floor
    const roomImageUrl = arrangement.room?.imageUrl
    const organizer = arrangement.organizerGroup?.name ?? arrangement.organizerText
    const taxonomy = arrangement.eventType?.name
    const price = formatPrices(arrangement)
    const gcalUrl = googleCalendarUrl(arrangement)

    return (
        <article className="flex w-full flex-col gap-8">
            {/* Hero */}
            <header className="grid gap-6 lg:grid-cols-[clamp(19rem,20%,23rem)_minmax(0,1fr)]">
                <div className="flex h-full flex-col justify-evenly">
                    {taxonomy && (
                        <p className="w-fit bg-primary px-3 py-1.5 text-sm font-heading text-primary-foreground">
                            {taxonomy}
                        </p>
                    )}
                    <h1 className="wrap-break-word font-heading text-4xl leading-none text-foreground">
                        {arrangement.title}
                    </h1>
                    {arrangement.ticketUrl && (
                        <Button asChild className="w-fit" size="default">
                            <a href={arrangement.ticketUrl} rel="noreferrer" target="_blank">
                                <Ticket aria-hidden="true" />
                                {t("tickets")}
                            </a>
                        </Button>
                    )}
                </div>

                <div className="border-2 border-border bg-muted shadow-shadow">
                    {arrangement.imageUrl ? (
                        <div className="relative aspect-[16/10] max-h-[28rem] lg:aspect-[16/9]">
                            <Image
                                alt={arrangement.imageCaption ?? arrangement.title}
                                className="object-cover"
                                fill
                                priority
                                sizes="(max-width: 1024px) 100vw, 80vw"
                                src={arrangement.imageUrl}
                            />
                        </div>
                    ) : (
                        <div className="flex aspect-[16/10] max-h-[28rem] items-center justify-center p-8 text-center lg:aspect-[16/9]">
                            <p className="max-w-md font-heading text-4xl leading-tight text-foreground/50">
                                {arrangement.title}
                            </p>
                        </div>
                    )}
                </div>
            </header>

            {/* Schedule + Meta */}
            <div className="grid gap-8 lg:grid-cols-[clamp(19rem,20%,23rem)_minmax(0,1fr)]">
                {/* Meta sidebar */}
                <aside className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                    <div className="space-y-3">
                        <p className="font-heading text-sm uppercase tracking-[0.18em] text-foreground">
                            {t("price")}
                        </p>
                        <p className="text-lg leading-6 text-foreground">{price ?? "-"}</p>
                    </div>
                    {organizer && (
                        <div className="space-y-3">
                            <p className="font-heading text-sm uppercase tracking-[0.18em] text-foreground">
                                {t("organizer")}
                            </p>
                            <p className="text-lg leading-6 text-foreground">{organizer}</p>
                        </div>
                    )}
                </aside>

                {/* Schedule */}
                <section>
                    <div className="grid grid-cols-[1.3fr_0.6fr_1fr] gap-3 font-heading text-xs uppercase tracking-[0.18em] text-foreground sm:gap-4 sm:text-sm">
                        <p>{t("date")}</p>
                        <p>{t("time")}</p>
                        <p>{t("place")}</p>
                    </div>
                    {(arrangement.dates ?? []).map(
                        (d: NonNullable<Arrangement["dates"]>[number]) => (
                            <div
                                className="grid grid-cols-[1.3fr_0.6fr_1fr] gap-3 px-0 py-4 text-lg leading-tight text-foreground sm:gap-4 sm:text-xl"
                                key={d._key}
                            >
                                <p>{formatDate(d.startDate, locale)}</p>
                                <p>
                                    {d.startTime
                                        ? d.endTime
                                            ? `${d.startTime}–${d.endTime}`
                                            : d.startTime
                                        : "-"}
                                </p>
                                <p>
                                    {roomSlug ? (
                                        <span className="group relative inline-block">
                                            <Link
                                                href={`/rom/${roomSlug}`}
                                                className="hover:underline hover:underline-offset-4"
                                            >
                                                {roomTitle}
                                            </Link>
                                            {(roomImageUrl != null || roomFloor != null) && (
                                                <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-44 flex-col overflow-hidden rounded border border-border bg-popover shadow-md group-hover:flex">
                                                    {roomImageUrl && (
                                                        <span className="relative block aspect-[4/3] w-full">
                                                            <Image
                                                                src={roomImageUrl}
                                                                alt={roomTitle ?? ""}
                                                                fill
                                                                className="object-cover"
                                                                sizes="176px"
                                                            />
                                                        </span>
                                                    )}
                                                    {roomFloor != null && (
                                                        <span className="px-2 py-1 text-xs text-muted-foreground">
                                                            {roomFloor}. etasje
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </span>
                                    ) : (
                                        (roomTitle ?? "-")
                                    )}
                                </p>
                            </div>
                        ),
                    )}
                </section>
            </div>

            {/* Description */}
            <section className="grid gap-6 lg:grid-cols-[clamp(19rem,20%,23rem)_minmax(0,1fr)]">
                <div className="space-y-4">
                    {arrangement.facebookUrl && (
                        <Button asChild variant="neutral">
                            <a href={arrangement.facebookUrl} rel="noreferrer" target="_blank">
                                <ExternalLink aria-hidden="true" />
                                {t("facebook")}
                            </a>
                        </Button>
                    )}
                    {gcalUrl && (
                        <Button asChild variant="neutral">
                            <a href={gcalUrl} rel="noreferrer" target="_blank">
                                <CalendarPlus aria-hidden="true" />
                                {t("addToGoogleCalendar")}
                            </a>
                        </Button>
                    )}
                    <Button asChild variant="neutral">
                        <a href={`/api/ical/${arrangement.slug}`} download>
                            <CalendarPlus aria-hidden="true" />
                            {t("addToCalendar")}
                        </a>
                    </Button>
                </div>
                <div className="space-y-5 border-l-2 border-foreground/60 pl-6 text-lg leading-8 text-foreground/85 max-lg:border-l-0 max-lg:pl-0">
                    {arrangement.description?.length ? (
                        <PortableTextContent value={arrangement.description} />
                    ) : (
                        <p>-</p>
                    )}
                </div>
            </section>
        </article>
    )
}
