"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { EventsProvider } from "@/lib/events-context"
import { type EventDetail, type EventTaxonomy } from "@/lib/events-utils"
import { EventsFilters } from "./EventsFilters"
import { EventsSections } from "./EventsSections"

// ─── EventsPageHeader ─────────────────────────────────────────────────────────

interface EventsPageHeaderProps {
    backLabel: string
    description: string
    eyebrow: string
    title: string
}

const EventsPageHeader = ({ backLabel, description, eyebrow, title }: EventsPageHeaderProps) => (
    <header className="space-y-5">
        <Link
            className="inline-flex text-sm uppercase tracking-[0.18em] underline underline-offset-4"
            href="/"
        >
            {backLabel}
        </Link>
        <div className="space-y-4">
            <p className="inline-flex border-2 border-border bg-destructive px-4 py-2 text-sm uppercase tracking-[0.22em] text-destructive-foreground shadow-shadow">
                {eyebrow}
            </p>
            <h1 className="font-heading text-5xl leading-none sm:text-7xl">{title}</h1>
            <p className="max-w-3xl text-base leading-8 text-foreground/80 sm:text-lg">
                {description}
            </p>
        </div>
    </header>
)

// ─── EventsContent ────────────────────────────────────────────────────────────

interface EventsContentProps {
    backLabel: string
    description: string
    emptyLabel: string
    errorLabel: string
    eyebrow: string
    facebookLabel: string
    filterAllLabel: string
    filterMoreLabel: string
    filterOrganizerLabel: string
    filterTypeLabel: string
    hasError: boolean
    locale: AppLocale
    ticketsLabel: string
    title: string
}

function EventsContent({
    backLabel,
    description,
    emptyLabel,
    errorLabel,
    eyebrow,
    facebookLabel,
    filterAllLabel,
    filterMoreLabel,
    filterOrganizerLabel,
    filterTypeLabel,
    hasError,
    locale,
    ticketsLabel,
    title,
}: EventsContentProps) {
    return (
        <div className="flex flex-col gap-10">
            <EventsPageHeader
                backLabel={backLabel}
                description={description}
                eyebrow={eyebrow}
                title={title}
            />

            {hasError ? (
                <Card className="bg-card">
                    <CardContent className="p-6">
                        <p className="text-sm leading-6 text-foreground/75">{errorLabel}</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <EventsFilters
                        filterAllLabel={filterAllLabel}
                        filterMoreLabel={filterMoreLabel}
                        filterOrganizerLabel={filterOrganizerLabel}
                        filterTypeLabel={filterTypeLabel}
                        locale={locale}
                    />
                    <EventsSections
                        emptyLabel={emptyLabel}
                        facebookLabel={facebookLabel}
                        locale={locale}
                        ticketsLabel={ticketsLabel}
                    />
                </>
            )}
        </div>
    )
}

// ─── EventsPageClient (public) ────────────────────────────────────────────────

export interface EventsPageClientProps {
    backLabel: string
    description: string
    emptyLabel: string
    errorLabel: string
    eyebrow: string
    facebookLabel: string
    filterAllLabel: string
    filterMoreLabel: string
    filterOrganizerLabel: string
    filterTypeLabel: string
    hasError: boolean
    initialEvents: EventDetail[]
    initialSearchParams: Record<string, string | string[] | undefined>
    initialTaxonomy: EventTaxonomy
    locale: AppLocale
    ticketsLabel: string
    title: string
}

export function EventsPageClient({
    backLabel,
    description,
    emptyLabel,
    errorLabel,
    eyebrow,
    facebookLabel,
    filterAllLabel,
    filterMoreLabel,
    filterOrganizerLabel,
    filterTypeLabel,
    hasError,
    initialEvents,
    initialSearchParams,
    initialTaxonomy,
    locale,
    ticketsLabel,
    title,
}: EventsPageClientProps) {
    return (
        <EventsProvider
            initialEvents={initialEvents}
            initialSearchParams={initialSearchParams}
            initialTaxonomy={initialTaxonomy}
            locale={locale}
        >
            <EventsContent
                backLabel={backLabel}
                description={description}
                emptyLabel={emptyLabel}
                errorLabel={errorLabel}
                eyebrow={eyebrow}
                facebookLabel={facebookLabel}
                filterAllLabel={filterAllLabel}
                filterMoreLabel={filterMoreLabel}
                filterOrganizerLabel={filterOrganizerLabel}
                filterTypeLabel={filterTypeLabel}
                hasError={hasError}
                locale={locale}
                ticketsLabel={ticketsLabel}
                title={title}
            />
        </EventsProvider>
    )
}
