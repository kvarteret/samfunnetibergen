"use client"

import { EventCard, type EventSummary } from "./EventCard"

interface EventFormPreviewProps {
  event: EventSummary
}

export function EventFormPreview({ event }: EventFormPreviewProps) {
  return (
    <div aria-hidden className="sticky top-8 hidden space-y-3 xl:block">
      <p className="font-heading uppercase tracking-widest text-foreground-muted">
        Forhåndsvisning
      </p>
      <div className="pointer-events-none select-none">
        <EventCard event={event} />
      </div>
      <p className="text-center text-sm text-foreground-muted">
        Slik vil arrangementet se ut i listen
      </p>
    </div>
  )
}
