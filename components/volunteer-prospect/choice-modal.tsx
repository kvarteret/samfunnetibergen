"use client"

import { Button } from "@/components/ui/button"
import type { LaunchGroupContent, LaunchGroupSlug } from "@/lib/volunteer-launch-content"

type VolunteerChoiceModalProps = {
    choiceModalDescriptionLabel: (groupName: string) => string
    choiceModalGroup: LaunchGroupContent | null
    choiceModalTitle: string
    closeLabel: string
    firstChoiceLabel: string
    modalFirstChoiceSlug: LaunchGroupSlug | ""
    modalSecondChoiceSlug: LaunchGroupSlug | ""
    onApplyChoice: (groupSlug: LaunchGroupSlug, target: "first" | "second") => void
    onClose: () => void
    secondChoiceLabel: string
}

export function VolunteerChoiceModal({
    choiceModalDescriptionLabel,
    choiceModalGroup,
    choiceModalTitle,
    closeLabel,
    firstChoiceLabel,
    modalFirstChoiceSlug,
    modalSecondChoiceSlug,
    onApplyChoice,
    onClose,
    secondChoiceLabel,
}: VolunteerChoiceModalProps) {
    if (!choiceModalGroup) {
        return null
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6"
            onClick={onClose}
        >
            <div
                aria-modal="true"
                className="w-full max-w-md border-2 border-border bg-card p-6 shadow-shadow"
                onClick={event => event.stopPropagation()}
                role="dialog"
            >
                <div className="grid gap-3">
                    <h3 className="text-2xl leading-none">{choiceModalTitle}</h3>
                    <p className="text-sm leading-6 text-foreground/75">
                        {choiceModalDescriptionLabel(choiceModalGroup.name)}
                    </p>
                </div>

                <div className="mt-6 grid gap-3">
                    {modalFirstChoiceSlug ? (
                        <>
                            <Button
                                onClick={() => {
                                    onApplyChoice(choiceModalGroup.slug, "second")
                                    onClose()
                                }}
                                type="button"
                                variant="default"
                            >
                                {modalFirstChoiceSlug === choiceModalGroup.slug &&
                                modalSecondChoiceSlug
                                    ? secondChoiceLabel
                                    : modalSecondChoiceSlug === choiceModalGroup.slug
                                      ? firstChoiceLabel
                                      : secondChoiceLabel}
                            </Button>

                            <Button
                                onClick={() => {
                                    onApplyChoice(choiceModalGroup.slug, "first")
                                    onClose()
                                }}
                                type="button"
                                variant="neutral"
                            >
                                {firstChoiceLabel}
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => {
                                onApplyChoice(choiceModalGroup.slug, "first")
                                onClose()
                            }}
                            type="button"
                            variant="default"
                        >
                            {firstChoiceLabel}
                        </Button>
                    )}

                    <Button onClick={onClose} type="button" variant="neutral">
                        {closeLabel}
                    </Button>
                </div>
            </div>
        </div>
    )
}
