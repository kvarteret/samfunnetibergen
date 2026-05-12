"use client"

import { Label } from "@/components/ui/label"
import type { VolunteerGroupContent, VolunteerGroupSlug } from "@/features/blifrivillig/content"
import { getVolunteerGroupName } from "@/features/blifrivillig/groups"
import { FieldError, RequiredLabel, SelectionChip } from "../shared"

type VolunteerChoiceSummaryProps = {
    firstChoiceError?: string
    firstChoiceGroupSlug: VolunteerGroupSlug | ""
    firstChoiceLabel: string
    groups: VolunteerGroupContent[]
    onRemoveChoice: (target: "first" | "second") => void
    optionalLabel: string
    secondChoiceError?: string
    secondChoiceGroupSlug: VolunteerGroupSlug | ""
    secondChoiceLabel: string
}

export function VolunteerChoiceSummary({
    firstChoiceError,
    firstChoiceGroupSlug,
    firstChoiceLabel,
    groups,
    onRemoveChoice,
    optionalLabel,
    secondChoiceError,
    secondChoiceGroupSlug,
    secondChoiceLabel,
}: VolunteerChoiceSummaryProps) {
    return (
        <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
                <RequiredLabel>{firstChoiceLabel}</RequiredLabel>
                <div className="flex min-h-12 flex-wrap items-center gap-2">
                    {firstChoiceGroupSlug ? (
                        <SelectionChip
                            label={getVolunteerGroupName(groups, firstChoiceGroupSlug)}
                            onRemove={() => onRemoveChoice("first")}
                        />
                    ) : null}
                </div>
                <FieldError message={firstChoiceError} />
            </div>

            <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                    <Label>{secondChoiceLabel}</Label>
                    <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                        {optionalLabel}
                    </span>
                </div>
                <div className="flex min-h-12 flex-wrap items-center gap-2">
                    {secondChoiceGroupSlug ? (
                        <SelectionChip
                            label={getVolunteerGroupName(groups, secondChoiceGroupSlug)}
                            onRemove={() => onRemoveChoice("second")}
                        />
                    ) : null}
                </div>
                <FieldError message={secondChoiceError} />
            </div>
        </div>
    )
}
