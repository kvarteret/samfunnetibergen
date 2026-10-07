"use client"

import { useSyncExternalStore } from "react"

export const PARTY_MODE_STORAGE_KEY = "samfunnet-partymodus"
const PARTY_MODE_EVENT = "party-mode-change"

export const partyMascots = ["pingvin", "pinnsvin"] as const
export type PartyMascot = (typeof partyMascots)[number]

export interface PartySettings {
  enabled: boolean
  // Both mascots follow the pointer on a leash.
  leash: boolean
  // The mascot steered with the keyboard, if any.
  control: PartyMascot | null
}

const defaultSettings: PartySettings = {
  enabled: false,
  leash: false,
  control: null,
}

// Kept in memory too, so the toggles still work when storage is blocked.
let settings: PartySettings | undefined

function isMascot(value: unknown): value is PartyMascot {
  return partyMascots.some(mascot => mascot === value)
}

function readStoredSettings(): PartySettings {
  try {
    const raw = localStorage.getItem(PARTY_MODE_STORAGE_KEY)
    if (!raw) return defaultSettings
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return defaultSettings
    const stored = parsed as Record<string, unknown>
    return {
      enabled: stored.enabled === true,
      leash: stored.leash === true,
      control: isMascot(stored.control) ? stored.control : null,
    }
  } catch {
    return defaultSettings
  }
}

function subscribe(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PARTY_MODE_STORAGE_KEY) return
    settings = readStoredSettings()
    onStoreChange()
  }
  window.addEventListener(PARTY_MODE_EVENT, onStoreChange)
  window.addEventListener("storage", onStorage)

  return () => {
    window.removeEventListener(PARTY_MODE_EVENT, onStoreChange)
    window.removeEventListener("storage", onStorage)
  }
}

function getSnapshot() {
  settings ??= readStoredSettings()
  return settings
}

export function updatePartySettings(patch: Partial<PartySettings>) {
  settings = { ...getSnapshot(), ...patch }
  try {
    if (settings.enabled) {
      localStorage.setItem(PARTY_MODE_STORAGE_KEY, JSON.stringify(settings))
    } else {
      localStorage.removeItem(PARTY_MODE_STORAGE_KEY)
    }
  } catch {}
  window.dispatchEvent(new Event(PARTY_MODE_EVENT))
}

export function usePartySettings() {
  return useSyncExternalStore(subscribe, getSnapshot, () => defaultSettings)
}
