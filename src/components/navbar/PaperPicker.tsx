"use client"

import { Check, ChevronDown } from "lucide-react"
import { useSyncExternalStore } from "react"

import {
  isPaperStyle,
  PAPER_STORAGE_KEY,
  type PaperStyle,
  paperOptions,
} from "@/lib/paper-preference"
import { cn } from "@/lib/utils"

function subscribe(onStoreChange: () => void) {
  window.addEventListener("paper-preference-change", onStoreChange)
  window.addEventListener("storage", onStoreChange)

  return () => {
    window.removeEventListener("paper-preference-change", onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

function getSnapshot(): PaperStyle {
  const paper = document.documentElement.dataset.paper
  return isPaperStyle(paper) ? paper : "grid"
}

function setPaperStyle(paper: PaperStyle) {
  document.documentElement.dataset.paper = paper
  try {
    localStorage.setItem(PAPER_STORAGE_KEY, paper)
  } catch {}
  window.dispatchEvent(new Event("paper-preference-change"))
}

export function PaperMenuSection({ mobile = false }: { mobile?: boolean }) {
  const paper = useSyncExternalStore(subscribe, getSnapshot, () => "grid")

  return (
    <details className="group/paper border-t-2 border-border/30">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between font-heading text-foreground focus-brutal",
          mobile ? "px-10 py-4 " : "px-2 py-2 ",
        )}
      >
        Enda mer
        <ChevronDown
          aria-hidden
          className="size-[1em] group-open/paper:rotate-180"
          strokeWidth={1.75}
        />
      </summary>
      <fieldset
        className={cn(
          "space-y-2 border-t-2 border-border/30",
          mobile ? "px-10 py-4" : "px-2 py-3",
        )}
      >
        <legend className="sr-only">Velg papir</legend>
        <p className="font-heading uppercase tracking-widest text-foreground-muted">
          Velg papir
        </p>
        <div className="grid grid-cols-3 gap-2">
          {paperOptions.map(option => (
            <label
              className={cn(
                "relative flex cursor-pointer flex-col items-center gap-2 border-2 border-border bg-background p-2 text-center font-heading text-sm focus-within-brutal",
                paper === option.value && "bg-primary text-primary-foreground",
              )}
              key={option.value}
            >
              <input
                checked={paper === option.value}
                className="sr-only"
                name={mobile ? "mobile-paper" : "desktop-paper"}
                onChange={() => setPaperStyle(option.value)}
                type="radio"
                value={option.value}
              />
              <PaperSwatch paper={option.value} />
              <span>{option.label}</span>
              {paper === option.value && (
                <Check aria-hidden className="absolute top-1 right-1 size-3" />
              )}
            </label>
          ))}
        </div>
      </fieldset>
    </details>
  )
}

function PaperSwatch({ paper }: { paper: PaperStyle }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block h-8 w-full border border-border/40 bg-paper",
        paper === "grid" && "paper-swatch-grid",
        paper === "dots" && "paper-swatch-dots",
        paper === "ruled" && "paper-swatch-ruled",
      )}
    />
  )
}
