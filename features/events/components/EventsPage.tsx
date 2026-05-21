import { CalendarDays, CalendarPlus } from "lucide-react"

import { ArrangementsProvider } from "@/features/events/context/ArrangementsContext"
import type { PublishedArrangement } from "@/features/events/domain/arrangementUtils"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { ArrangementsFilters } from "./ArrangementsFilters"
import { ArrangementsSections } from "./ArrangementsSections"

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://samfunnetibergen.no").trim()
const ICAL_URL = `${BASE_URL}/api/ical`
const WEBCAL_URL = ICAL_URL.replace(/^https?:/, "webcal:")

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
                    <h1 className="font-heading text-4xl">{title}</h1>
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

                <a
                    className="inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground"
                    href={WEBCAL_URL}
                >
                    <CalendarDays className="size-4" aria-hidden />
                    Lagre arrangementskalender
                </a>

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
