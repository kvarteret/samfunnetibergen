"use client"

import { HelpCircle } from "lucide-react"
import posthog from "posthog-js"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export function ValgomatenInfobox() {
  const t = useTranslations("GroupsPage")
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
              {t("quizPrompt")}
            </p>
          </div>
          <Button onClick={handleClick} type="button" variant="default">
            {t("quizButton")}
          </Button>
        </>
      ) : (
        <div className="space-y-3">
          <p className="font-heading text-lg leading-tight text-foreground">
            {t("quizNotReady")}
          </p>
          <p className="leading-7 text-foreground">
            {t("quizContactBefore")}{" "}
            <a
              className="underline underline-offset-4 hover:text-primary focus-brutal"
              href="mailto:frivillig@samfunnetibergen.no"
            >
              frivillig@samfunnetibergen.no
            </a>{" "}
            {t("quizContactAfter")}
          </p>
        </div>
      )}
    </aside>
  )
}
