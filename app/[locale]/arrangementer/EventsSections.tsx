"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { AppLocale } from "@/i18n/routing"
import { useEvents } from "@/lib/events-context"
import { EventCard } from "./EventCard"

export interface EventsSectionsProps {
    emptyLabel: string
    facebookLabel: string
    locale: AppLocale
    ticketsLabel: string
}

export function EventsSections({
    emptyLabel,
    facebookLabel,
    locale,
    ticketsLabel,
}: EventsSectionsProps) {
    const { filteredEvents } = useEvents()

    const sorted = [...filteredEvents].sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )

    if (sorted.length === 0) {
        return (
            <Card className="bg-card">
                <CardContent className="p-6">
                    <p className="text-sm leading-6 text-foreground/75">{emptyLabel}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sorted.map(event => (
                <EventCard
                    event={event}
                    facebookLabel={facebookLabel}
                    key={event.id}
                    locale={locale}
                    ticketsLabel={ticketsLabel}
                />
            ))}
        </div>
    )
}
