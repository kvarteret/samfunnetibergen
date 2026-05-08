"use client"

import { CalendarPlus } from "lucide-react"
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
}

const EventsPageHeader = ({ backLabel }: EventsPageHeaderProps) => (
    <header className="space-y-5">
        <Link
            className="inline-flex text-sm uppercase tracking-[0.18em] underline underline-offset-4"
            href="/"
        >
            {backLabel}
        </Link>
        <h1 className="font-heading text-4xl">Dette skjer på Kvarteret</h1>
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
    emptyLabel,
    errorLabel,
    facebookLabel,
    filterAllLabel,
    filterMoreLabel,
    filterOrganizerLabel,
    filterTypeLabel,
    hasError,
    locale,
    ticketsLabel,
}: EventsContentProps) {
    return (
        <div className="flex flex-col gap-10">
            <EventsPageHeader backLabel={backLabel} />

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

            {/* ── Hint: submit event ──────────────────────────────────────────── */}
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
