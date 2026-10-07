"use client"

import { ExternalLink, Ticket } from "lucide-react"
import posthog from "posthog-js"
import { Button } from "@/components/ui/button"
import { entrySurface } from "@/lib/posthog/placement-entry"

interface EventTicketButtonProps {
  ticketUrl: string
  label: string
  /** Screen-reader hint that the shop opens in a new tab. */
  newTabLabel?: string
  eventId: string
  eventTitle: string
  eventSlug: string
}

export function EventTicketButton({
  ticketUrl,
  label,
  newTabLabel,
  eventId,
  eventTitle,
  eventSlug,
}: EventTicketButtonProps) {
  return (
    <Button
      className="w-fit"
      render={<a href={ticketUrl} rel="noreferrer" target="_blank" />}
      size="lg"
      variant="cta"
      onClick={() => {
        posthog.capture("ticket_link_clicked", {
          event_id: eventId,
          event_title: eventTitle,
          event_slug: eventSlug,
          ticket_url: ticketUrl,
          entry_surface: entrySurface([eventId, eventSlug]) ?? null,
        })
      }}
    >
      <Ticket aria-hidden="true" />
      {label}
      <ExternalLink aria-hidden="true" className="opacity-70" />
      {newTabLabel && <span className="sr-only"> ({newTabLabel})</span>}
    </Button>
  )
}

interface EventFacebookButtonProps {
  facebookUrl: string
  label: string
  eventId: string
  eventTitle: string
  eventSlug: string
}

export function EventFacebookButton({
  facebookUrl,
  label,
  eventId,
  eventTitle,
  eventSlug,
}: EventFacebookButtonProps) {
  return (
    <a
      className="inline-flex items-center gap-2 text-foreground-muted underline underline-offset-4 hover:text-foreground focus-brutal"
      href={facebookUrl}
      rel="noreferrer"
      target="_blank"
      onClick={() => {
        posthog.capture("facebook_event_link_clicked", {
          event_id: eventId,
          event_title: eventTitle,
          event_slug: eventSlug,
          facebook_url: facebookUrl,
          entry_surface: entrySurface([eventId, eventSlug]) ?? null,
        })
      }}
    >
      <ExternalLink aria-hidden="true" className="size-4" />
      {label}
    </a>
  )
}
