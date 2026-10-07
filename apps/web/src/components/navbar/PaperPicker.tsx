"use client"

import { Collapsible } from "@base-ui/react/collapsible"
import { NavigationMenu } from "@base-ui/react/navigation-menu"
import { Check, ChevronDown, ChevronLeft, PartyPopper } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useRef, useSyncExternalStore } from "react"
import { CheckboxSquare } from "@/components/ui/checkbox-field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { ToggleOption } from "@/components/ui/toggle-option"
import {
  isPaperStyle,
  PAPER_STORAGE_KEY,
  type PaperStyle,
  paperOptions,
} from "@/lib/paper-preference"
import {
  type PartyMascot,
  updatePartySettings,
  usePartySettings,
} from "@/lib/party-mode"
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
  const t = useTranslations("Navigation")
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
      <Collapsible.Trigger className="group flex min-h-11 w-full cursor-pointer items-center justify-between px-10 py-2.5 font-heading text-foreground focus-brutal">
        {t("moreSettings")}
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
        <PartyModeChoice className="border-t-2 border-border/30 px-10 py-4" />
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

function DesktopPaperMenu({ paper }: { paper: PaperStyle }) {
  const t = useTranslations("Navigation")
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <NavigationMenu.Root closeDelay={100} delay={0} orientation="vertical">
      <NavigationMenu.List className="list-none border-t-2 border-border/30 p-3">
        <NavigationMenu.Item value="paper">
          <NavigationMenu.Trigger
            className="group flex w-full cursor-pointer items-center justify-between px-2 py-2 font-heading text-foreground hover:underline focus-brutal data-popup-open:underline"
            ref={triggerRef}
          >
            {t("moreSettings")}
            <ChevronLeft
              aria-hidden
              className="size-[1em] transition-transform group-data-popup-open:-translate-x-0.5"
              strokeWidth={1.75}
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="grid w-[34rem] grid-cols-2 divide-x-2 divide-border/30">
            <div className="space-y-4 p-4">
              <ThemeChoices />
              <PaperChoices
                className="border-t-2 border-border/30 pt-4"
                paper={paper}
              />
            </div>
            <PartyModeChoice className="p-4" />
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          align="start"
          alignOffset={-12}
          anchor={triggerRef}
          className="z-50 outline-none before:absolute before:top-0 before:right-full before:h-full before:w-3 before:content-[''] data-side-left:before:right-auto data-side-left:before:left-full"
          collisionAvoidance={{
            align: "shift",
            fallbackAxisSide: "none",
            side: "shift",
          }}
          collisionPadding={12}
          side="left"
          sideOffset={12}
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
  const t = useTranslations("Navigation")

  const labels = {
    grid: t("paperGrid"),
    dots: t("paperDots"),
    ruled: t("paperRuled"),
    none: t("paperBlank"),
  } satisfies Record<PaperStyle, string>

  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="sr-only">{t("choosePaper")}</legend>
      <p className="font-heading uppercase tracking-widest">
        {t("choosePaper")}
      </p>
      <RadioGroup<PaperStyle>
        className="grid grid-cols-2 gap-2"
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
            <span>{labels[option.value]}</span>
            {paper === option.value && (
              <Check aria-hidden className="absolute top-1 right-1 size-3" />
            )}
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </fieldset>
  )
}

function PartyModeChoice({ className }: { className?: string }) {
  const t = useTranslations("Navigation")
  const party = usePartySettings()
  const controlLabelId = useId()

  const controlOptions: { value: PartyMascot | "none"; label: string }[] = [
    { value: "none", label: t("partyControlOff") },
    { value: "pingvin", label: t("partyPenguin") },
    { value: "pinnsvin", label: t("partyHedgehog") },
  ]

  return (
    <fieldset className={cn("space-y-3", className)}>
      <legend className="sr-only">{t("partyMode")}</legend>
      <p className="font-heading uppercase tracking-widest">{t("partyMode")}</p>
      <ToggleOption
        checked={party.enabled}
        icon={PartyPopper}
        label={t("partyEnable")}
        onChange={enabled => updatePartySettings({ enabled })}
      />
      {party.enabled ? (
        <>
          <label className="flex cursor-pointer items-center gap-3 px-1 py-1 font-heading">
            <CheckboxSquare
              checked={party.leash}
              onChange={leash => updatePartySettings({ leash })}
            />
            {t("partyLeash")}
          </label>
          <div className="space-y-2 border-t-2 border-border/30 pt-3">
            <p className="font-heading text-sm" id={controlLabelId}>
              {t("partyControl")}
            </p>
            <SegmentedControl<PartyMascot | "none">
              aria-labelledby={controlLabelId}
              onValueChange={value =>
                updatePartySettings({
                  control: value === "none" ? null : value,
                })
              }
              options={controlOptions}
              value={party.control ?? "none"}
            />
            {party.control && (
              <p className="text-foreground-muted text-sm">
                {t("partyControlHint")}
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="text-foreground-muted text-sm">{t("partyDescription")}</p>
      )}
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
