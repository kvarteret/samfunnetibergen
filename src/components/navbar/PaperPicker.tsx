"use client"

import { Collapsible } from "@base-ui/react/collapsible"
import { NavigationMenu } from "@base-ui/react/navigation-menu"
import { Check, ChevronDown, ChevronRight } from "lucide-react"
import { useSyncExternalStore } from "react"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  isPaperStyle,
  PAPER_STORAGE_KEY,
  type PaperStyle,
  paperOptions,
} from "@/lib/paper-preference"
import { cn } from "@/lib/utils"
import { ThemeChoices } from "./ThemePicker"

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
  const paper = useSyncExternalStore(
    subscribe,
    getSnapshot,
    (): PaperStyle => "grid",
  )

  if (!mobile) {
    return <DesktopPaperMenu paper={paper} />
  }

  return (
    <Collapsible.Root className="border-t-2 border-border/30">
      <Collapsible.Trigger className="group flex w-full cursor-pointer items-center justify-between px-10 py-4 font-heading text-foreground focus-brutal">
        Enda mer
        <ChevronDown
          aria-hidden
          className="size-[1em] group-data-panel-open:rotate-180"
          strokeWidth={1.75}
        />
      </Collapsible.Trigger>
      <Collapsible.Panel>
        <ThemeChoices className="border-t-2 border-border/30 px-10 py-4" />
        <PaperChoices
          className="border-t-2 border-border/30 px-10 py-4"
          paper={paper}
        />
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

function DesktopPaperMenu({ paper }: { paper: PaperStyle }) {
  return (
    <NavigationMenu.Root closeDelay={100} delay={0} orientation="vertical">
      <NavigationMenu.List className="list-none border-t-2 border-border/30 p-3">
        <NavigationMenu.Item value="paper">
          <NavigationMenu.Trigger className="group flex w-full cursor-pointer items-center justify-between px-2 py-2 font-heading text-foreground hover:bg-accent focus-brutal data-popup-open:bg-accent">
            Enda mer
            <ChevronRight
              aria-hidden
              className="size-[1em] transition-transform group-data-popup-open:translate-x-0.5"
              strokeWidth={1.75}
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="w-72 space-y-4 p-3">
            <ThemeChoices />
            <PaperChoices
              className="border-t-2 border-border/30 pt-4"
              paper={paper}
            />
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          align="start"
          alignOffset={-12}
          className="z-50 outline-none before:absolute before:top-0 before:right-full before:h-full before:w-3 before:content-[''] data-side-left:before:right-auto data-side-left:before:left-full"
          collisionPadding={12}
          side="right"
          sideOffset={24}
        >
          <NavigationMenu.Popup className="relative border-2 border-border bg-card shadow-shadow outline-none">
            <NavigationMenu.Viewport className="relative h-[var(--popup-height)] w-[var(--popup-width)] overflow-hidden" />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  )
}

function PaperChoices({
  className,
  paper,
}: {
  className?: string
  paper: PaperStyle
}) {
  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="sr-only">Velg papir</legend>
      <p className="font-heading uppercase tracking-widest">Velg papir</p>
      <RadioGroup<PaperStyle>
        className="grid grid-cols-3 gap-2"
        name="paper"
        onValueChange={setPaperStyle}
        value={paper}
      >
        {paperOptions.map(option => (
          <RadioGroupItem
            className="relative flex cursor-pointer flex-col items-center gap-2 p-2 text-center font-heading text-sm"
            key={option.value}
            size="none"
            value={option.value}
          >
            <PaperSwatch paper={option.value} />
            <span>{option.label}</span>
            {paper === option.value && (
              <Check aria-hidden className="absolute top-1 right-1 size-3" />
            )}
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </fieldset>
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
