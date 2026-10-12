"use client"

import Image from "next/image"
import { useState } from "react"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Link } from "@/i18n/navigation"
import { groupTrackingAttributes } from "@/lib/posthog/tracking-attributes"
import type { StudentGroupSummary } from "@/lib/sanity/fetch"

type GroupSection = {
  title: string
  groups: StudentGroupSummary[]
}

interface GroupsFilterProps {
  sections: GroupSection[]
  allLabels: string[]
  allLabel: string
}

export function GroupsFilter({
  sections,
  allLabels,
  allLabel,
}: GroupsFilterProps) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null)

  const filteredSections = activeLabel
    ? sections
        .map(section => ({
          ...section,
          groups: section.groups.filter(g => g.labels?.includes(activeLabel)),
        }))
        .filter(section => section.groups.length > 0)
    : sections

  return (
    <div className="space-y-12">
      {allLabels.length > 0 && (
        <div className="overflow-x-auto pb-2">
          <SegmentedControl
            className="flex-nowrap"
            onValueChange={value =>
              setActiveLabel(value === "all" ? null : value)
            }
            options={[
              { value: "all", label: allLabel },
              ...allLabels.map(label => ({ value: label, label })),
            ]}
            value={activeLabel ?? "all"}
          />
        </div>
      )}

      {filteredSections.map(section => (
        <section className="space-y-5" key={section.title}>
          <h2 className="font-heading text-4xl leading-none text-foreground">
            {section.title}
          </h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {section.groups.map(group => (
              <GroupCard group={group} key={group.slug} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function GroupCard({ group }: { group: StudentGroupSummary }) {
  // The logo is decorative here: the heading names the group, visibly or not.
  const logoOnly = Boolean(group.hideName && group.logoUrl)

  return (
    <Link
      className="group flex h-full flex-col gap-4 border-2 border-border bg-card p-5 transition-colors hover:border-foreground focus-brutal"
      href={`/grupper/${group.slug}`}
      {...groupTrackingAttributes(group, "groups-card")}
    >
      {logoOnly && group.logoUrl ? (
        <>
          <div className="relative h-20 w-full">
            <Image
              alt=""
              className="object-contain object-left"
              fill
              sizes="(min-width: 1280px) 24rem, (min-width: 768px) 45vw, 90vw"
              src={group.logoUrl}
            />
          </div>
          <h3 className="sr-only">{group.name}</h3>
        </>
      ) : (
        <div className="flex min-h-16 min-w-0 items-center gap-4">
          {group.logoUrl ? (
            <div className="relative size-16 shrink-0">
              <Image
                alt=""
                className="object-contain"
                fill
                sizes="64px"
                src={group.logoUrl}
              />
            </div>
          ) : null}
          <h3 className="min-w-0 font-heading text-2xl leading-tight text-foreground group-hover:underline group-hover:underline-offset-4">
            {group.name}
          </h3>
        </div>
      )}
      <p className="line-clamp-3 leading-7 text-foreground">{group.summary}</p>
    </Link>
  )
}
