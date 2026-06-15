"use client"

import { HelpCircle, Mail } from "lucide-react"
import posthog from "posthog-js"
import { useState } from "react"

export function ValgomatenInfobox() {
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    if (clicked) return
    posthog.capture("valgomaten_clicked")
    setClicked(true)
  }

  return (
    <aside
      className="panel space-y-4 border-2 border-primary/40 bg-primary/5"
    >
      {!clicked ? (
        <button
          className="w-full text-left space-y-3 cursor-pointer hover:bg-primary/5 transition-colors rounded-lg p-1 -m-1 group"
          onClick={handleClick}
          type="button"
        >
          <div className="flex items-start gap-3">
            <HelpCircle
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-primary"
            />
            <div className="space-y-2">
              <p className="font-heading text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
                Usikker på hva du bør velge?
              </p>
              <p className="inline-flex items-center gap-2 font-heading text-sm uppercase tracking-widest text-primary underline underline-offset-4">
                Ta Valgomaten
              </p>
            </div>
          </div>
        </button>
      ) : (
        <div className="space-y-3">
          <p className="font-heading text-lg leading-tight text-foreground">
            Valgomaten er ikke ferdig ennå :(
          </p>
          <p className="leading-7 text-foreground">
            Ta kontakt med{" "}
            <a
              className="underline underline-offset-4 hover:text-primary focus-brutal"
              href="mailto:frivillig@samfunnetibergen.no"
            >
              frivillig@samfunnetibergen.no
            </a>{" "}
            for å høre mer om hva som kan passe deg!
          </p>
        </div>
      )}
    </aside>
  )
}
