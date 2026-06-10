"use client"

import { ArrowRight, Mail } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { Link } from "@/i18n/navigation"
import type { StudentGroupSummary } from "@/lib/sanity/fetch"
import { SegmentedControl } from "@/components/ui/segmented-control"

type GroupSection = {
  title: string
  groups: StudentGroupSummary[]
}

interface GroupsFilterProps {
  sections: GroupSection[]
  allLabels: string[]
}

export function GroupsFilter({ sections, allLabels }: GroupsFilterProps) {
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
        <SegmentedControl
          onChange={value => setActiveLabel(value === "all" ? null : value)}
          options={[
            { value: "all", label: "Alle" },
            ...allLabels.map(label => ({ value: label, label })),
          ]}
          value={activeLabel ?? "all"}
        />
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
  return (
    <Link
      className="group flex min-h-full flex-col gap-4 border-2 border-border bg-card p-5 shadow-shadow transition-transform hover:-translate-y-1"
      href={`/grupper/${group.slug}`}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-4">
          {group.logoUrl ? (
            <div className="relative size-12 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
              <Image
                alt={`${group.name} logo`}
                className="object-contain p-1"
                fill
                src={group.logoUrl}
              />
            </div>
          ) : null}
          <h3 className="wrap-break-word font-heading text-3xl leading-none text-foreground">
            {group.name}
          </h3>
        </div>
        <p className="line-clamp-4 text-base leading-7 text-foreground">
          {group.summary}
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-3 text-sm text-foreground">
        {group.labels?.length ? (
          <div className="flex flex-wrap gap-2">
            {group.labels.map((label: string) => (
              <span
                className="border-2 border-border bg-background px-2 py-1 font-heading text-xs text-foreground"
                key={label}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
        {group.subGroups?.length ? (
          <div className="flex flex-wrap gap-2">
            {group.subGroups.map(
              (subGroup: { name: string | null; slug: string | null }) => (
                <span
                  className="border-2 border-border bg-background px-2 py-1 font-heading text-xs text-foreground"
                  key={subGroup.slug ?? subGroup.name}
                >
                  {subGroup.name}
                </span>
              ),
            )}
          </div>
        ) : null}
        {group.email ? (
          <span className="inline-flex items-center gap-2">
            <Mail aria-hidden="true" className="size-4" />
            {group.email}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-2 font-heading group-hover:underline group-hover:underline-offset-4">
          Les mer
          <ArrowRight aria-hidden="true" className="size-4" />
        </span>
      </div>
    </Link>
  )
}
