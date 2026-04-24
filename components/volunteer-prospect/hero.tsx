"use client"

import { CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export function VolunteerProspectHero({
    badge,
    description,
    eventsLinkLabel,
    fusionDescription,
}: {
    badge: string
    description: string
    eventsLinkLabel: string
    fusionDescription: React.ReactNode
}) {
    return (
        <>
            <div className="inline-flex border-2 border-border bg-destructive px-5 py-3 text-lg uppercase tracking-[0.28em] text-destructive-foreground shadow-shadow">
                {badge}
            </div>

            <div className="space-y-5">
                <p className="max-w-4xl text-base leading-8 text-foreground/85 sm:text-lg">
                    {description}
                </p>
                <div className="max-w-4xl text-base leading-8 text-foreground/85 sm:text-lg">
                    {fusionDescription}
                </div>
            </div>

            <div>
                <Button asChild variant="neutral">
                    <Link href="/arrangementer">
                        <CalendarDays aria-hidden="true" />
                        {eventsLinkLabel}
                    </Link>
                </Button>
            </div>
        </>
    )
}
