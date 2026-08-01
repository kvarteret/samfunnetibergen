"use client"

import { HelpCircle } from "lucide-react"
import posthog from "posthog-js"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function ValgomatenInfobox() {
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    if (clicked) return
    posthog.capture("valgomaten_clicked")
    setClicked(true)
  }

  return (
    <aside className="panel space-y-4 border-2 border-primary/40 bg-primary/5">
      {!clicked ? (
        <>
          <div className="flex items-start gap-3">
            <HelpCircle
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-primary"
            />
            <p className="font-heading text-lg leading-tight text-foreground">
              Vil du bli frivillig, men er usikker på hva gruppe du bør velge?
            </p>
          </div>
          <Button onClick={handleClick} type="button" variant="default">
            Ta Valgomaten
          </Button>
        </>
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
