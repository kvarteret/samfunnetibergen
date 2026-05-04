/* eslint-disable @next/next/no-img-element */
import { CalendarDays, ExternalLink, MapPin, Ticket } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import {
    countEventFilters,
    filterEvents,
    formatEventTimeRange,
    getEventDescriptionPreview,
    getPrimaryTaxonomyGroups,
    getPublicEvents,
    getTaxonomyGroupLabel,
    groupEventsByTaxonomy,
    parseEventFilters,
    type EventFilters,
} from "@/lib/events"
import type { EventDetail, EventTaxonomy } from "@/lib/kvarteret-personal-api"

export const revalidate = 60

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export async function generateMetadata({ params }: PageProps<"/[locale]/arrangementer">) {
    const locale = await resolvePageLocale(params)
    const t = await getTranslations({ locale, namespace: "Metadata" })

    return {
        title: t("eventsTitle"),
        description: t("eventsDescription"),
    }
}

function EventCard({
    event,
    facebookLabel,
    locale,
    ticketsLabel,
}: {
    event: EventDetail
    facebookLabel: string
    locale: AppLocale
    ticketsLabel: string
}) {
    const preview = getEventDescriptionPreview(event.description)
    const taxonomy = [
        event.event_type?.name,
        event.organizer_groups.map(group => group.name).join(", "),
    ]
        .filter(Boolean)
        .join(" / ")
    const room = event.room?.name ?? event.room_text

    return (
        <Card className="overflow-hidden bg-card py-0">
            {event.image_url ? (
                <img
                    alt={event.image_caption || event.title}
                    className="aspect-[16/9] w-full object-cover"
                    loading="lazy"
                    src={event.image_url}
                />
            ) : null}
            <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-foreground/65">
                        {taxonomy ? <span>{taxonomy}</span> : null}
                        {event.price ? <span>{event.price}</span> : null}
                    </div>
                    <h2 className="font-heading text-2xl leading-tight">{event.title}</h2>
                </div>

                <div className="space-y-2 text-sm leading-6 text-foreground/75">
                    <p className="flex gap-2">
                        <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <span>{formatEventTimeRange(event, locale)}</span>
                    </p>
                    {room ? (
                        <p className="flex gap-2">
                            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <span>{room}</span>
                        </p>
                    ) : null}
                </div>

                {preview ? <p className="text-sm leading-6 text-foreground/80">{preview}</p> : null}

                <div className="mt-auto flex flex-wrap gap-3 pt-2">
                    {event.ticket_url ? (
                        <Button asChild size="sm">
                            <a href={event.ticket_url} rel="noreferrer" target="_blank">
                                <Ticket aria-hidden="true" />
                                {ticketsLabel}
                            </a>
                        </Button>
                    ) : null}
                    {event.facebook_url ? (
                        <Button asChild size="sm" variant="neutral">
                            <a href={event.facebook_url} rel="noreferrer" target="_blank">
                                <ExternalLink aria-hidden="true" />
                                {facebookLabel}
                            </a>
                        </Button>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    )
}

const toggleFilterValue = (values: string[], value: string): string[] =>
    values.includes(value) ? values.filter(item => item !== value) : [...values, value]

const buildEventsHref = (locale: AppLocale, filters: EventFilters): string => {
    const params = new URLSearchParams()

    if (filters.taxonomyGroup) {
        params.set("taxonomy", filters.taxonomyGroup)
    }

    for (const eventTypeId of filters.eventTypeIds) {
        params.append("type", eventTypeId)
    }

    for (const organizerGroupId of filters.organizerGroupIds) {
        params.append("organizer", organizerGroupId)
    }

    const query = params.toString()
    return `/${locale}/arrangementer${query ? `?${query}` : ""}`
}

function FilterLink({
    href,
    isActive,
    label,
}: {
    href: string
    isActive: boolean
    label: string
}) {
    return (
        <a
            className={`inline-flex min-h-11 items-center justify-center border-2 border-border px-4 py-2 font-bold transition-colors ${
                isActive
                    ? "bg-foreground text-background"
                    : "bg-muted text-foreground/80 hover:bg-card"
            }`}
            href={href}
        >
            {label}
        </a>
    )
}

async function EventsFilters({
    filters,
    locale,
    resultCount,
    taxonomy,
}: {
    filters: EventFilters
    locale: AppLocale
    resultCount: number
    taxonomy: EventTaxonomy
}) {
    const activeFilterCount = countEventFilters(filters)
    const t = await getTranslations({ locale, namespace: "EventsPage" })

    return (
        <div className="space-y-6 border-y-2 border-border py-6">
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <FilterLink
                        href={buildEventsHref(locale, {
                            eventTypeIds: [],
                            organizerGroupIds: [],
                            taxonomyGroup: null,
                        })}
                        isActive={activeFilterCount === 0}
                        label={t("filterAll")}
                    />
                    {getPrimaryTaxonomyGroups(taxonomy).map(groupName => (
                        <FilterLink
                            href={buildEventsHref(locale, {
                                eventTypeIds: [],
                                organizerGroupIds: filters.organizerGroupIds,
                                taxonomyGroup:
                                    filters.taxonomyGroup === groupName ? null : groupName,
                            })}
                            isActive={
                                filters.taxonomyGroup === groupName &&
                                filters.eventTypeIds.length === 0
                            }
                            key={groupName}
                            label={getTaxonomyGroupLabel(groupName, locale)}
                        />
                    ))}
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/65">
                    {t("filterResultCount", { count: resultCount })}
                </p>
            </div>

            <details className="group">
                <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.18em] text-foreground underline underline-offset-4">
                    {t("filterMore")}
                    {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </summary>
                <div className="mt-6 space-y-8">
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/65">
                            {t("filterType")}
                        </h2>
                        <div className="space-y-5">
                            {taxonomy.event_type_groups.map(group => (
                                <div className="space-y-2" key={group.name}>
                                    <h3 className="font-heading text-2xl">
                                        {getTaxonomyGroupLabel(group.name, locale)}
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {group.event_types.map(eventType => (
                                            <FilterLink
                                                href={buildEventsHref(locale, {
                                                    ...filters,
                                                    eventTypeIds: toggleFilterValue(
                                                        filters.eventTypeIds,
                                                        eventType.id,
                                                    ),
                                                })}
                                                isActive={filters.eventTypeIds.includes(
                                                    eventType.id,
                                                )}
                                                key={eventType.id}
                                                label={eventType.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/65">
                            {t("filterOrganizer")}
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {taxonomy.organizer_groups.map(group => (
                                <FilterLink
                                    href={buildEventsHref(locale, {
                                        ...filters,
                                        organizerGroupIds: toggleFilterValue(
                                            filters.organizerGroupIds,
                                            group.id,
                                        ),
                                    })}
                                    isActive={filters.organizerGroupIds.includes(group.id)}
                                    key={group.id}
                                    label={group.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </details>
        </div>
    )
}

export default async function EventsPage({
    params,
    searchParams,
}: PageProps<"/[locale]/arrangementer"> & {
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: "EventsPage" })
    const resolvedSearchParams = (await searchParams) ?? {}
    const result = await getPublicEvents(locale)
    const filters = parseEventFilters(resolvedSearchParams)
    const filteredEvents = result.ok ? filterEvents(result.events, filters) : []
    const sections = result.ok ? groupEventsByTaxonomy(filteredEvents, result.taxonomy, locale) : []

    return (
        <div className="flex flex-col gap-10">
            <header className="space-y-5">
                <Link
                    className="inline-flex text-sm uppercase tracking-[0.18em] underline underline-offset-4"
                    href="/"
                >
                    {t("back")}
                </Link>
                <div className="space-y-4">
                    <p className="inline-flex border-2 border-border bg-destructive px-4 py-2 text-sm uppercase tracking-[0.22em] text-destructive-foreground shadow-shadow">
                        {t("eyebrow")}
                    </p>
                    <h1 className="font-heading text-5xl leading-none sm:text-7xl">{t("title")}</h1>
                    <p className="max-w-3xl text-base leading-8 text-foreground/80 sm:text-lg">
                        {t("description")}
                    </p>
                </div>
            </header>

            {!result.ok ? (
                <Card className="bg-card">
                    <CardContent className="p-6">
                        <p className="text-sm leading-6 text-foreground/75">{t("error")}</p>
                    </CardContent>
                </Card>
            ) : null}

            {result.ok ? (
                <EventsFilters
                    filters={filters}
                    locale={locale}
                    resultCount={filteredEvents.length}
                    taxonomy={result.taxonomy}
                />
            ) : null}

            {result.ok && sections.length === 0 ? (
                <Card className="bg-card">
                    <CardContent className="p-6">
                        <p className="text-sm leading-6 text-foreground/75">{t("empty")}</p>
                    </CardContent>
                </Card>
            ) : null}

            <div className="space-y-12">
                {sections.map(section => (
                    <section className="space-y-5" key={section.key}>
                        <h2 className="font-heading text-3xl leading-tight sm:text-4xl">
                            {section.title}
                        </h2>
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {section.events.map(event => (
                                <EventCard
                                    event={event}
                                    facebookLabel={t("facebook")}
                                    key={event.id}
                                    locale={locale}
                                    ticketsLabel={t("tickets")}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}
