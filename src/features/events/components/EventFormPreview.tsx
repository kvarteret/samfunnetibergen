"use client";

import { EventCard, type EventSummary } from "./EventCard";

interface EventListPreviewProps {
  event: EventSummary;
}

export function EventFormPreview({ event }: EventListPreviewProps) {
  return (
    <div aria-hidden className="sticky top-8 hidden space-y-3 xl:block">
      <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/50">
        Forhåndsvisning
      </p>
      <div className="pointer-events-none select-none">
        <EventCard
          event={event}
          facebookLabel="Facebook"
          ticketsLabel="Billetter"
        />
      </div>
      <p className="text-center text-xs text-foreground/40">
        Slik vil arrangementet se ut i listen
      </p>
    </div>
  );
}
