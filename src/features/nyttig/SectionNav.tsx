"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import type { SectionNavItem } from "./SectionBlock"

interface SectionNavProps {
  items: SectionNavItem[]
  className?: string
}

export const SectionNav = ({ items, className }: SectionNavProps) => {
  const [activeId, setActiveId] = useState(items[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(entry => entry.isIntersecting)
        if (visible.length === 0) return

        const topmost = visible.reduce((closest, entry) =>
          entry.boundingClientRect.top < closest.boundingClientRect.top
            ? entry
            : closest,
        )
        setActiveId(topmost.target.id)
      },
      { rootMargin: "-20% 0px -70% 0px" },
    )

    for (const item of items) {
      const element = document.getElementById(item.id)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
  }, [items])

  return (
    <nav aria-label="Seksjoner på siden" className={className}>
      <p className="mb-3 font-heading text-sm uppercase tracking-widest text-foreground-muted">
        På denne siden
      </p>
      <ul className="flex flex-col">
        {items.map(item => {
          const isActive = item.id === activeId
          return (
            <li key={item.id}>
              <a
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "block border-l-2 py-2 pl-3 leading-snug transition-colors focus-brutal",
                  isActive
                    ? "border-primary font-heading text-foreground"
                    : "border-border text-foreground-muted hover:border-foreground hover:text-foreground",
                )}
                href={`#${item.id}`}
              >
                {item.title}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
