import { ExternalLink, Ticket } from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, resolvePageLocale } from "@/lib/app-locale"
import { PortableTextContent } from "@/lib/portable-text-components"
import { fetchArrangementBySlug } from "@/lib/sanity/queries"

type Arrangement = NonNullable<Awaited<ReturnType<typeof fetchArrangementBySlug>>>

type EventPageProps = {
    params: Promise<{ event: string; locale: string }>
}

function formatDate(dateStr: string, locale: AppLocale): string {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nb-NO", {
        dateStyle: "long",
        timeZone: "Europe/Oslo",
    }).format(new Date(`${dateStr}T00:00:00`))
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
    const arrangement = await fetchArrangementBySlug(resolvedParams.event)

    if (!arrangement) return {}

    return {
        title: `${arrangement.title} | Samfunnet i Bergen`,
        openGraph: {
            title: arrangement.title,
            images: arrangement.imageUrl ? [{ url: arrangement.imageUrl }] : undefined,
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

    const primaryDate = arrangement.dates?.[0]
    const room = arrangement.room?.title ?? arrangement.roomText
    const organizer = arrangement.organizerGroup?.name ?? arrangement.organizerText
    const taxonomy = arrangement.eventType?.name
    const price = formatPrices(arrangement)

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
                                <p>{room ?? "-"}</p>
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
