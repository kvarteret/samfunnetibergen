"use client"

import { useEffect, useState } from "react"

const DEFAULT_UPDATE_INTERVAL_MS = 60_000

/**
 * Keeps time-dependent client rendering hydration-safe.
 *
 * The serialized server timestamp is used for the first browser render, then
 * replaced with the browser clock immediately after hydration and on each tick.
 */
export function useCurrentTime(
  initialNow: string,
  updateIntervalMs = DEFAULT_UPDATE_INTERVAL_MS,
) {
  const [now, setNow] = useState(() => parseInitialNow(initialNow))

  useEffect(() => {
    const updateNow = () => setNow(new Date())
    updateNow()
    const interval = window.setInterval(updateNow, updateIntervalMs)
    return () => window.clearInterval(interval)
  }, [updateIntervalMs])

  return now
}

function parseInitialNow(initialNow: string) {
  const parsed = new Date(initialNow)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("initialNow must be a valid ISO timestamp")
  }
  return parsed
}
