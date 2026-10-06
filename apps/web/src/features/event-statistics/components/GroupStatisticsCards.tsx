"use client"

import { ArrowUpRight } from "lucide-react"
import { useState } from "react"

import { selectionControlVariants } from "@/components/ui/selection-control"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type { GroupStatistic } from "../domain/statistics"
import { Sparkline } from "./Sparkline"

const numberFormatter = new Intl.NumberFormat("nb-NO")
const INITIAL_COUNT = 9

export function GroupStatisticsCards({ groups }: { groups: GroupStatistic[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? groups : groups.slice(0, INITIAL_COUNT)
  const peak = Math.max(1, ...groups.flatMap(group => group.daily))

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(group => (
          <li key={group.slug}>
            <GroupCard group={group} peak={peak} />
          </li>
        ))}
      </ul>
      {groups.length > INITIAL_COUNT && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}
          className={cn(
            selectionControlVariants(),
            "w-fit self-center rounded-full px-6",
          )}
        >
          {expanded ? "Vis færre grupper" : `Vis alle ${groups.length} grupper`}
        </button>
      )}
    </div>
  )
}

function GroupCard({ group, peak }: { group: GroupStatistic; peak: number }) {
  return (
    <article className="flex h-full flex-col gap-6 rounded-base bg-card p-6 shadow-shadow">
      <Link
        href={`/grupper/${group.slug}`}
        className="group inline-flex items-start justify-between gap-3 text-2xl leading-tight [font-family:var(--font-display)] font-heading tracking-[-0.03em] underline-offset-4 hover:underline"
      >
        {group.name}
        <ArrowUpRight
          aria-hidden
          className="mt-1.5 size-4 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </Link>
      <div className="mt-auto flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="[font-family:var(--font-display)] font-heading text-4xl leading-none tracking-[-0.045em] [font-variant-numeric:lining-nums_tabular-nums]">
            {numberFormatter.format(group.views)}
          </span>
          <span className="text-sm text-foreground-muted">
            visninger ·{" "}
            <span className="font-mono">
              {numberFormatter.format(group.visitors)}
            </span>{" "}
            besøkende
          </span>
        </div>
        <Sparkline values={group.daily} peak={peak} label={group.name} />
      </div>
    </article>
  )
}
