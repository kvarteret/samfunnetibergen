"use client"

import { HelpCircle } from "lucide-react"
import posthog from "posthog-js"
import { useState } from "react"

export function ValgomatenInfobox() {
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    if (clicked) return
    posthog.capture("valgomaten_clicked")
    setClicked(true)
  }

  if (!clicked) {
    return (
      <aside className="panel border-l-4 border-l-primary interactive-brutal cursor-pointer">
        <button
          className="flex w-full items-start gap-4 text-left focus-brutal"
          onClick={handleClick}
          type="button"
        >
          <HelpCircle
            aria-hidden="true"
            className="mt-0.5 size-6 shrink-0 text-primary"
          />
          <div className="min-w-0 space-y-2">
            <p className="font-heading text-lg leading-tight text-foreground">
              Usikker på hva du bør velge?
            </p>
            <p className="font-heading text-sm uppercase tracking-widest text-primary">
              Ta Valgomaten
            </p>
          </div>
        </button>
      </aside>
    )
  }

  return (
    <aside className="panel border-l-4 border-l-primary space-y-3">
      <p className="font-heading text-lg leading-tight text-foreground">
        Valgomaten er ikke ferdig ennå :(
      </p>
      <p className="leading-7 text-foreground-muted">
        Ta kontakt med{" "}
        <a
          className="underline underline-offset-4 hover:text-primary focus-brutal"
          href="mailto:frivillig@samfunnetibergen.no"
        >
          frivillig@samfunnetibergen.no
        </a>{" "}
        for å høre mer om hva som kan passe deg!
      </p>
    </aside>
  )
}
