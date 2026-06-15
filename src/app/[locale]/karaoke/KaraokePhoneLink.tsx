"use client"

import { Phone } from "lucide-react"
import posthog from "posthog-js"

export function KaraokePhoneLink() {
  return (
    <a
      className="flex items-center gap-2 font-heading text-primary hover:underline underline-offset-4 transition-colors focus-brutal"
      href="tel:40626601"
      onClick={() => posthog.capture("karaoke_phone_link_clicked")}
    >
      <Phone className="size-4 shrink-0" aria-hidden />
      406 26 601
    </a>
  )
}
