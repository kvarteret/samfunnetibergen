"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type { LaunchGroupContent, LaunchGroupSlug } from "@/lib/volunteer-launch-content"

type VolunteerProspectGroupListProps = {
    accordionActionLabel: string
    detailActionLabel: (groupName: string) => string
    firstChoiceGroupSlug: LaunchGroupSlug | ""
    groups: LaunchGroupContent[]
    onChoosePreference: (groupSlug: LaunchGroupSlug) => void
    secondChoiceGroupSlug: LaunchGroupSlug | ""
    selectionActionIdleLabel: string
    selectionActionPrimaryLabel: string
    selectionActionSecondaryLabel: string
}

export function VolunteerProspectGroupList({
    accordionActionLabel,
    detailActionLabel,
    firstChoiceGroupSlug,
    groups,
    onChoosePreference,
    secondChoiceGroupSlug,
    selectionActionIdleLabel,
    selectionActionPrimaryLabel,
    selectionActionSecondaryLabel,
}: VolunteerProspectGroupListProps) {
    return (
        <div className="grid gap-5">
            {groups.map(group => {
                const isSelected = firstChoiceGroupSlug === group.slug
                const isSecondChoice = secondChoiceGroupSlug === group.slug

                return (
                    <article
                        className={cn(
                            "border-2 border-border bg-card shadow-shadow",
                            isSelected && "bg-primary text-primary-foreground",
                        )}
                        key={group.slug}
                    >
                        <div className="grid gap-5 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <p
                                        className={cn(
                                            "text-xs uppercase tracking-[0.24em]",
                                            isSelected
                                                ? "text-primary-foreground/75"
                                                : "text-foreground/65",
                                        )}
                                    >
                                        {group.eyebrow}
                                    </p>
                                    <h2 className="text-3xl leading-none">{group.name}</h2>
                                </div>

                                <Button
                                    className="h-auto px-3 py-2 text-xs uppercase tracking-[0.22em]"
                                    onClick={() => onChoosePreference(group.slug)}
                                    type="button"
                                    variant={isSelected || isSecondChoice ? "neutral" : "default"}
                                >
                                    {isSelected
                                        ? selectionActionPrimaryLabel
                                        : isSecondChoice
                                          ? selectionActionSecondaryLabel
                                          : selectionActionIdleLabel}
                                </Button>
                            </div>

                            <p
                                className={cn(
                                    "max-w-3xl text-base leading-7",
                                    isSelected
                                        ? "text-primary-foreground/90"
                                        : "text-foreground/80",
                                )}
                            >
                                {group.lead}
                            </p>

                            <Accordion collapsible type="single">
                                <AccordionItem value={`${group.slug}-details`}>
                                    <AccordionTrigger
                                        className={cn(
                                            isSelected
                                                ? "text-primary-foreground"
                                                : "text-foreground",
                                        )}
                                    >
                                        {accordionActionLabel}
                                    </AccordionTrigger>
                                    <AccordionContent
                                        className={cn(
                                            "grid gap-4",
                                            isSelected
                                                ? "text-primary-foreground/90"
                                                : "text-foreground/80",
                                        )}
                                    >
                                        {group.accordionSections.map(section => (
                                            <div className="grid gap-2" key={section.title}>
                                                <h3 className="text-sm font-heading uppercase tracking-[0.2em]">
                                                    {section.title}
                                                </h3>
                                                {section.paragraphs.map(paragraph => (
                                                    <p
                                                        className="text-sm leading-6"
                                                        key={paragraph}
                                                    >
                                                        {paragraph}
                                                    </p>
                                                ))}
                                            </div>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            <div className="flex flex-wrap justify-between gap-3">
                                <Button
                                    asChild
                                    className="w-full sm:w-auto"
                                    type="button"
                                    variant="neutral"
                                >
                                    <Link href={`/blifrivillig/${group.slug}`}>
                                        {detailActionLabel(group.name ?? "")}
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </article>
                )
            })}
        </div>
    )
}
