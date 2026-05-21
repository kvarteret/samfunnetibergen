import { CalendarDays, CalendarPlus } from "lucide-react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrangementsProvider } from "@/features/events/context/ArrangementsContext"
import type { PublishedArrangement } from "@/features/events/domain/arrangementUtils"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { ArrangementsFilters } from "./ArrangementsFilters"
import { ArrangementsSections } from "./ArrangementsSections"

export function EventsPage({
    arrangements,
    backLabel,
    emptyLabel,
    facebookLabel,
    filterAllLabel,
    filterMoreLabel,
    filterOrganizerLabel,
    filterTypeLabel,
    locale,
    searchParams,
    ticketsLabel,
    title,
}: {
    arrangements: PublishedArrangement[]
    backLabel: string
    emptyLabel: string
    facebookLabel: string
    filterAllLabel: string
    filterMoreLabel: string
    filterOrganizerLabel: string
    filterTypeLabel: string
    locale: AppLocale
    searchParams: Record<string, string | string[] | undefined>
    ticketsLabel: string
    title: string
}) {
    return (
        <ArrangementsProvider initialArrangements={arrangements} initialSearchParams={searchParams}>
            <div className="flex flex-col gap-10">
                <header className="space-y-5">
                    <Link
                        className="inline-flex text-sm uppercase tracking-[0.18em] underline underline-offset-4"
                        href="/"
                    >
                        {backLabel}
                    </Link>
                    <div className="flex items-center gap-4">
                        <h1 className="font-heading text-4xl">{title}</h1>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                                    <a
                                        aria-label="Abonner på kalender"
                                        className="text-foreground/40 transition-colors hover:text-foreground"
                                        href="/api/ical"
                                    >
                                        <CalendarDays className="size-5" aria-hidden />
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Abonner på arrangementer i din kalender</p>
                                    <p className="text-xs text-muted-foreground">
                                        Kopier lenken og legg til via «Legg til fra URL» i Google
                                        Kalender, Apple Kalender, eller Outlook
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </header>

                <ArrangementsFilters
                    filterAllLabel={filterAllLabel}
                    filterMoreLabel={filterMoreLabel}
                    filterOrganizerLabel={filterOrganizerLabel}
                    filterTypeLabel={filterTypeLabel}
                />

                <ArrangementsSections
                    emptyLabel={emptyLabel}
                    facebookLabel={facebookLabel}
                    locale={locale}
                    ticketsLabel={ticketsLabel}
                />

                <div className="flex flex-col gap-4 border-2 border-border bg-card p-5 sm:flex-row sm:items-center sm:gap-6">
                    <div className="flex size-10 shrink-0 items-center justify-center bg-primary">
                        <CalendarPlus className="size-5 text-primary-foreground" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-heading text-sm leading-snug text-foreground">
                            Arrangerer du eller din organisasjon noe på Samfunnet?
                        </p>
                        <p className="mt-0.5 text-sm text-foreground/60">
                            Legg til arrangementet i listen — det gjennomgås av PR-gruppen og
                            publiseres innen 1–3 virkedager.
                        </p>
                    </div>
                    <Link
                        className="btn-brutal inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-2 border-border bg-primary px-4 py-2.5 font-heading text-sm text-primary-foreground"
                        href="/arrangementer/ny"
                    >
                        Legg til i listen
                    </Link>
                </div>
            </div>
        </ArrangementsProvider>
    )
}
