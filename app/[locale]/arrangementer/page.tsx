import { CalendarPlus } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import {
    fetchEventsPageContent,
    fetchPublishedArrangements,
    fetchSiteMetadata,
} from "@/lib/sanity/queries"
import { type ArrangementSummary, EventCard } from "./ArrangementCard"

type PublishedArrangement = Awaited<ReturnType<typeof fetchPublishedArrangements>>[number]

export const revalidate = 60

export function generateStaticParams() {
    return getLocaleStaticParams()
}

function toArrangementSummary(arrangement: PublishedArrangement): ArrangementSummary {
    return {
        _id: arrangement._id,
        title: arrangement.title,
        slug: arrangement.slug,
        isRecurring: arrangement.isRecurring ?? undefined,
        rrule: arrangement.rrule ?? null,
        dates: (arrangement.dates ?? []).map(d => ({
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

export async function generateMetadata({ params }: PageProps<"/[locale]/arrangementer">) {
    const locale = await resolvePageLocale(params)
    const [t, eventsPage, siteMetadata] = await Promise.all([
        getTranslations({ locale, namespace: "Metadata" }),
        fetchEventsPageContent(locale, { stega: false }),
        fetchSiteMetadata(locale, { stega: false }),
    ])
    const title = eventsPage?.seoTitle ?? t("eventsTitle")
    const description = eventsPage?.seoDescription ?? t("eventsDescription")
    const openGraphTitle = eventsPage?.openGraphTitle ?? title
    const openGraphDescription = eventsPage?.openGraphDescription ?? description
    const openGraphImage = eventsPage?.openGraphImageUrl ?? siteMetadata?.defaultOpenGraphImageUrl

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

export default async function EventsPage({ params }: PageProps<"/[locale]/arrangementer">) {
    const locale = (await resolvePageLocale(params)) as AppLocale
    activateRequestLocale(locale)

    const [t, eventsContent, arrangements] = await Promise.all([
        getTranslations({ locale, namespace: "EventsPage" }),
        fetchEventsPageContent(locale),
        fetchPublishedArrangements(),
    ])

    const title = eventsContent?.title ?? t("title")

    return (
        <div className="flex flex-col gap-10">
            <header className="space-y-5">
                <Link
                    className="inline-flex text-sm uppercase tracking-[0.18em] underline underline-offset-4"
                    href="/"
                >
                    {t("back")}
                </Link>
                <h1 className="font-heading text-4xl">{title}</h1>
            </header>

            {arrangements.length === 0 ? (
                <p className="text-sm leading-6 text-foreground/75">{t("empty")}</p>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {arrangements.map((arrangement: PublishedArrangement) => (
                        <EventCard
                            arrangement={toArrangementSummary(arrangement)}
                            facebookLabel={t("facebook")}
                            key={arrangement._id}
                            locale={locale}
                            ticketsLabel={t("tickets")}
                        />
                    ))}
                </div>
            )}

            <div className="border-2 border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="size-10 bg-primary flex items-center justify-center shrink-0">
                    <CalendarPlus className="size-5 text-primary-foreground" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm text-foreground leading-snug">
                        Arrangerer du eller din organisasjon noe på Samfunnet?
                    </p>
                    <p className="text-sm text-foreground/60 mt-0.5">
                        Legg til arrangementet i listen — det gjennomgås av PR-gruppen og publiseres
                        innen 1–3 virkedager.
                    </p>
                </div>
                <Link
                    href="/arrangementer/ny"
                    className="shrink-0 inline-flex items-center gap-2 border-2 border-border bg-primary px-4 py-2.5 text-sm font-heading text-primary-foreground btn-brutal whitespace-nowrap"
                >
                    Legg til i listen
                </Link>
            </div>
        </div>
    )
}
