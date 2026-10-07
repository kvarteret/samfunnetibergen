"use client"

import { useSyncExternalStore } from "react"

export const PARTY_MODE_STORAGE_KEY = "samfunnet-partymodus"
const PARTY_MODE_EVENT = "party-mode-change"

// Kept in memory too, so the toggle still works when storage is blocked.
let partyMode: boolean | undefined

function readStoredPartyMode() {
  try {
    return localStorage.getItem(PARTY_MODE_STORAGE_KEY) === "on"
  } catch {
    return false
  }
}

function subscribe(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PARTY_MODE_STORAGE_KEY) return
    partyMode = readStoredPartyMode()
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
  partyMode ??= readStoredPartyMode()
  return partyMode
}

export function setPartyMode(enabled: boolean) {
  partyMode = enabled
  try {
    if (enabled) localStorage.setItem(PARTY_MODE_STORAGE_KEY, "on")
    else localStorage.removeItem(PARTY_MODE_STORAGE_KEY)
  } catch {}
  window.dispatchEvent(new Event(PARTY_MODE_EVENT))
}

export function usePartyMode() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
