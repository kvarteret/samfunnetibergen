"use client"

import { Collapsible } from "@base-ui/react/collapsible"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"

interface DisclosureProps {
  summary: React.ReactNode
  children: React.ReactNode
  className?: string
  open?: boolean
}

export function Disclosure({
  summary,
  children,
  className,
  open = false,
}: DisclosureProps) {
  return (
    <Collapsible.Root
      className={cn("panel p-0 shadow-shadow", className)}
      defaultOpen={open}
    >
      <Collapsible.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left font-heading text-xl text-foreground focus-brutal">
        {summary}
        <Plus
          aria-hidden
          className="size-5 shrink-0 transition-transform group-data-panel-open:rotate-45"
        />
      </Collapsible.Trigger>
      <Collapsible.Panel>
        <div className="px-5 pb-5">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
