"use client"

import { type ReactNode, useEffect, useState } from "react"

import { cn } from "@/lib/utils"

/**
 * A slim bottom bar for phones that repeats the ticket button once the hero's
 * button (`targetId`) has scrolled above the viewport.
 */
export function StickyTicketBar({
  targetId,
  summary,
  children,
}: {
  targetId: string
  summary: string
  children: ReactNode
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [targetId])

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-background/95 px-4 py-3 backdrop-blur transition-transform duration-200 lg:hidden",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate font-heading tabular-nums">{summary}</p>
        {children}
      </div>
    </div>
  )
}
