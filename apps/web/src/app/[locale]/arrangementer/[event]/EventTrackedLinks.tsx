"use client"

import { ExternalLink, Ticket } from "lucide-react"
import posthog from "posthog-js"
import { Button } from "@/components/ui/button"

interface EventTicketButtonProps {
  ticketUrl: string
  label: string
  eventTitle: string
  eventSlug: string
}

export function EventTicketButton({
  ticketUrl,
  label,
  eventTitle,
  eventSlug,
}: EventTicketButtonProps) {
  return (
    <Button
      className="w-fit"
      render={<a href={ticketUrl} rel="noreferrer" target="_blank" />}
      size="default"
      onClick={() => {
        posthog.capture("ticket_link_clicked", {
          event_title: eventTitle,
          event_slug: eventSlug,
          ticket_url: ticketUrl,
        })
      }}
    >
      <Ticket aria-hidden="true" />
      {label}
    </Button>
  )
}

interface EventFacebookButtonProps {
  facebookUrl: string
  label: string
  eventTitle: string
  eventSlug: string
}

export function EventFacebookButton({
  facebookUrl,
  label,
  eventTitle,
  eventSlug,
}: EventFacebookButtonProps) {
  return (
    <Button
      render={<a href={facebookUrl} rel="noreferrer" target="_blank" />}
      variant="neutral"
      onClick={() => {
        posthog.capture("facebook_event_link_clicked", {
          event_title: eventTitle,
          event_slug: eventSlug,
          facebook_url: facebookUrl,
        })
      }}
    >
      <ExternalLink aria-hidden="true" />
      {label}
    </Button>
  )
}
