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
    const { sections } = useEvents()

    if (sections.length === 0) {
        return (
            <Card className="bg-card">
                <CardContent className="p-6">
                    <p className="text-sm leading-6 text-foreground/75">{emptyLabel}</p>
                </CardContent>
            </Card>
        )
    }

    return (
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
                                facebookLabel={facebookLabel}
                                key={event.id}
                                locale={locale}
                                ticketsLabel={ticketsLabel}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}
