"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  createWheelSpinSound,
  isWheelSpinSoundSupported,
  type WheelSpinSound,
} from "./wheel-spin-sound"

export const WHEEL_SOUND_STORAGE_KEY = "samfunnet-valgomat-sound"

const MUTED_VALUE = "off"

export type WheelSpinSoundControls = {
  /** Whether the visitor has turned the spin sound off. */
  muted: boolean
  /** False in browsers without Web Audio, so the toggle can hide itself. */
  supported: boolean
  toggleMuted: () => void
  start: (durationMs: number) => void
  celebrate: () => void
  stop: () => void
}

function readStoredMuted(): boolean {
  try {
    return window.localStorage.getItem(WHEEL_SOUND_STORAGE_KEY) === MUTED_VALUE
  } catch {
    return false
  }
}

function writeStoredMuted(muted: boolean): void {
  try {
    if (muted) {
      window.localStorage.setItem(WHEEL_SOUND_STORAGE_KEY, MUTED_VALUE)
    } else {
      window.localStorage.removeItem(WHEEL_SOUND_STORAGE_KEY)
    }
  } catch {
    // Storage can be blocked (private mode); the choice still holds for the
    // rest of this visit, it just is not remembered.
  }
}

/**
 * Owns the quiz's spin sound: one lazily created audio engine, a persisted
 * mute preference, and lifecycle cleanup. Sound is opt-out, matching the
 * "click RULL" gesture that browsers require before audio can play at all.
 */
export function useWheelSpinSound(): WheelSpinSoundControls {
  const soundRef = useRef<WheelSpinSound | null>(null)
  const mutedRef = useRef(false)
  const disposedRef = useRef(false)
  const [muted, setMuted] = useState(false)
  // Assume support until mount so the server and client first render agree;
  // the effect corrects it for browsers without Web Audio.
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    // React 19 re-runs effects in development; recover instead of staying dead.
    disposedRef.current = false
    setSupported(isWheelSpinSoundSupported())
    const stored = readStoredMuted()
    mutedRef.current = stored
    setMuted(stored)

    return () => {
      disposedRef.current = true
      soundRef.current?.dispose()
      soundRef.current = null
    }
  }, [])

  const getSound = useCallback((): WheelSpinSound => {
    soundRef.current ??= createWheelSpinSound()
    return soundRef.current
  }, [])

  const start = useCallback(
    (durationMs: number) => {
      if (mutedRef.current || disposedRef.current) return
      getSound().start(durationMs)
    },
    [getSound],
  )

  const celebrate = useCallback(() => {
    if (mutedRef.current || disposedRef.current) return
    getSound().celebrate()
  }, [getSound])

  const stop = useCallback(() => {
    soundRef.current?.stop()
  }, [])

  const toggleMuted = useCallback(() => {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    writeStoredMuted(next)
    if (next) soundRef.current?.stop()
  }, [])

  return { muted, supported, toggleMuted, start, celebrate, stop }
}
