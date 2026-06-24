"use client"

import { useEffect, useState } from "react"

/** August 10, 2026 at 12:00 CEST (UTC+2) */
const DEADLINE_MS = 1786356000 * 1000

const DISMISS_KEY = "countdown-dismissed-2026"

function calcTimeLeft(now: number) {
  const diff = DEADLINE_MS - now
  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { dager: days, timer: hours, minutter: minutes, seconds }
}

export function CountdownOverlay() {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof calcTimeLeft>>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check dismissal
    if (localStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true)
      return
    }

    // Check deadline
    if (Date.now() >= DEADLINE_MS) return

    // Lock body scroll
    document.body.style.overflow = "hidden"

    function tick() {
      const t = calcTimeLeft(Date.now())
      if (!t) {
        setTimeLeft(null)
        return
      }
      setTimeLeft(t)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => {
      clearInterval(id)
      document.body.style.overflow = ""
    }
  }, [])

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1")
    setDismissed(true)
  }

  if (dismissed || !timeLeft) return null

  return (
    <div
      onClick={handleDismiss}
      className="fixed inset-0 z-[99999] flex select-none flex-col items-center justify-center gap-4 bg-black text-[#FFE4B5]"
    >
      <div className="text-center">
        <p className="font-hegval-display text-7xl font-light tracking-wide sm:text-8xl md:text-9xl">
          {timeLeft.dager}
          <span className="ml-3 text-2xl sm:text-3xl md:text-4xl">dager</span>
        </p>
        <p className="mt-2 text-3xl font-light tracking-wide sm:text-4xl md:text-5xl">
          {timeLeft.timer}
          <span className="ml-2 text-xl sm:text-2xl md:text-3xl">timer</span>
        </p>
        <p className="mt-2 text-3xl font-light tracking-wide sm:text-4xl md:text-5xl">
          {timeLeft.minutter}
          <span className="ml-2 text-xl sm:text-2xl md:text-3xl">
            minutter
          </span>
        </p>
        <p className="mt-2 text-3xl font-light tracking-wide sm:text-4xl md:text-5xl">
          {timeLeft.seconds}
          <span className="ml-2 text-xl sm:text-2xl md:text-3xl">sekunder</span>
        </p>
      </div>

    </div>
  )
}
