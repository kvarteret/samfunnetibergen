"use client"

import { useEffect, useRef, useState } from "react"

const COLLAPSE_SCROLL_Y = 48
const EXPAND_SCROLL_Y = 4

export function NavbarScrollShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const scrolledRef = useRef(false)

  useEffect(() => {
    let frameId: number | null = null

    const updateScrolled = () => {
      frameId = null
      const nextScrolled = scrolledRef.current
        ? window.scrollY > EXPAND_SCROLL_Y
        : window.scrollY > COLLAPSE_SCROLL_Y

      if (nextScrolled === scrolledRef.current) return

      scrolledRef.current = nextScrolled
      setScrolled(nextScrolled)
    }

    const scheduleUpdateScrolled = () => {
      if (frameId != null) return
      frameId = window.requestAnimationFrame(updateScrolled)
    }

    updateScrolled()
    window.addEventListener("scroll", scheduleUpdateScrolled, { passive: true })

    return () => {
      window.removeEventListener("scroll", scheduleUpdateScrolled)
      if (frameId != null) window.cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <header
      className="group/nav sticky top-0 z-30 bg-background"
      data-scrolled={scrolled ? "true" : undefined}
    >
      {children}
    </header>
  )
}
