"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface HorizontalScrollRowProps {
  children: React.ReactNode
  className?: string
  fadeClassName?: string
}

export function HorizontalScrollRow({
  children,
  className,
  fadeClassName,
}: HorizontalScrollRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const row = rowRef.current
    if (!row) return

    function handleWheel(event: WheelEvent) {
      if (!row || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

      event.preventDefault()
      window.scrollBy({ top: event.deltaY })
    }

    row.addEventListener("wheel", handleWheel, { passive: false })
    return () => row.removeEventListener("wheel", handleWheel)
  }, [])

  return (
    <div className="relative">
      <div
        className={cn("flex overflow-x-auto scrollbar-hide", className)}
        ref={rowRef}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-primary to-transparent sm:w-24",
          fadeClassName,
        )}
      />
    </div>
  )
}
