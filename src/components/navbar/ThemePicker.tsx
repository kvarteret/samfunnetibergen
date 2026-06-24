"use client"

import { Check } from "lucide-react"
import { useSyncExternalStore } from "react"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  isTheme,
  THEME_STORAGE_KEY,
  type ThemeName,
  themeOptions,
} from "@/lib/theme-preference"
import { cn } from "@/lib/utils"

function subscribe(onStoreChange: () => void) {
  window.addEventListener("theme-preference-change", onStoreChange)
  window.addEventListener("storage", onStoreChange)

  return () => {
    window.removeEventListener("theme-preference-change", onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

function getSnapshot(): ThemeName {
  const theme = document.documentElement.dataset.theme
  return isTheme(theme) ? theme : "hs"
}

function setTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {}
  window.dispatchEvent(new Event("theme-preference-change"))
}

export function ThemeChoices({ className }: { className?: string }) {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    (): ThemeName => "hs",
  )

  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="sr-only">Velg tema</legend>
      <p className="font-heading uppercase tracking-widest">Tema</p>
      <RadioGroup<ThemeName>
        className="grid grid-cols-3 gap-2"
        name="theme"
        onValueChange={setTheme}
        value={theme}
      >
        {themeOptions.map(option => (
          <RadioGroupItem
            className="relative flex cursor-pointer flex-col items-center gap-2 p-2 text-center font-heading text-sm"
            key={option.value}
            size="none"
            value={option.value}
          >
            <ThemeSwatch theme={option.value} />
            <span>{option.label}</span>
            {theme === option.value && (
              <Check aria-hidden className="absolute top-1 right-1 size-3" />
            )}
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </fieldset>
  )
}

function ThemeSwatch({ theme }: { theme: ThemeName }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block h-8 w-full border border-border/40",
        theme === "hs" && "bg-[#eb3b3b]",
        theme === "skyss" && "bg-[#f59e0b]",
        theme === "dan" && "bg-[#2f6b4f]",
      )}
    />
  )
}