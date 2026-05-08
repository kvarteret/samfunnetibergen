"use client"

import { useLocale, useTranslations } from "next-intl"
import { useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { HomePageContent } from "@/lib/sanity/types"
import type { InstitutionOption, VolunteerGroupContent } from "@/lib/volunteer-group-content"
import type { VolunteerProspectValidationMessages } from "@/lib/volunteer-prospect"
import { normalizeVolunteerPhoneNumber } from "@/lib/volunteer-prospect"
import { VolunteerChoiceModal } from "./volunteer-prospect/choice-modal"
import { VolunteerChoiceSummary } from "./volunteer-prospect/choice-summary"
import { VolunteerProspectGroupList } from "./volunteer-prospect/group-list"
import { VolunteerProspectHero } from "./volunteer-prospect/hero"
import {
    FieldError,
    getVisibleFieldError,
    RequiredLabel,
    VolunteerFormMessageAlert,
} from "./volunteer-prospect/shared"
import { useVolunteerProspectController } from "./volunteer-prospect/use-volunteer-prospect-controller"

export function VolunteerProspectExperience({
    groups,
    homeContent,
    institutionOptions,
    hideHero = false,
}: {
    groups: VolunteerGroupContent[]
    homeContent: HomePageContent | null
    institutionOptions: InstitutionOption[]
    hideHero?: boolean
}) {
    const locale = useLocale()
    const tHome = useTranslations("HomePage")
    const tForm = useTranslations("VolunteerProspectForm")
    const tValidation = useTranslations("Validation")

    const validationMessages = useMemo<VolunteerProspectValidationMessages>(
        () => ({
            firstNameRequired: tValidation("firstNameRequired"),
            lastNameRequired: tValidation("lastNameRequired"),
            emailInvalid: tValidation("emailInvalid"),
            phoneRequired: tValidation("phoneRequired"),
            studyInstitutionRequired: tValidation("studyInstitutionRequired"),
            firstChoiceRequired: tValidation("firstChoiceRequired"),
            unsupportedGroup: tValidation("unsupportedGroup"),
            secondChoiceConflict: tValidation("secondChoiceConflict"),
        }),
        [tValidation],
    )

    const {
        applyChoice,
        captureFormStarted,
        choiceModalGroup,
        closeChoiceModal,
        createProspectMutation,
        form,
        formMessage,
        formValues,
        openChoiceModal,
        removeChoice,
        secondChoiceConflict,
    } = useVolunteerProspectController({
        groups,
        invalidFormMessage: tForm("invalidFormMessage"),
        locale,
        submitErrorFallback: tForm("submitErrorFallback"),
        submittedMessage: tForm("submittedMessage"),
        validationMessages,
    })

    const firstChoiceError = form.state.fieldMeta.firstChoiceGroupSlug?.errorMap?.onSubmit as
        | string
        | undefined
    const secondChoiceError = secondChoiceConflict
        ? tForm("secondChoiceConflict")
        : ((form.state.fieldMeta.secondChoiceGroupSlug?.errorMap?.onSubmit as string | undefined) ??
          undefined)

    return (
        <>
            <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:items-start">
                <section className="flex flex-col gap-8 lg:flex-[1.15]">
                    {!hideHero && (
                        <VolunteerProspectHero
                            badge={homeContent?.badge ?? ""}
                            description={homeContent?.heroDescription ?? ""}
                            eventsLinkLabel={homeContent?.eventsLink ?? ""}
                            fusionDescription={homeContent?.heroDescriptionFusion ?? ""}
                        />
                    )}

                    <VolunteerProspectGroupList
                        accordionActionLabel={tForm("accordionAction")}
                        detailActionLabel={groupName => tForm("detailAction", { group: groupName })}
                        firstChoiceGroupSlug={formValues.firstChoiceGroupSlug}
                        groups={groups}
                        onChoosePreference={openChoiceModal}
                        secondChoiceGroupSlug={formValues.secondChoiceGroupSlug}
                        selectionActionIdleLabel={tForm("selectionActionIdle")}
                        selectionActionPrimaryLabel={tForm("selectionActionPrimary")}
                        selectionActionSecondaryLabel={tForm("selectionActionSecondary")}
                    />
                </section>

                <aside className="lg:sticky lg:top-8 lg:flex-[0.85] lg:self-start">
                    <Card className="bg-card" id="registration-form">
                        <CardHeader>
                            <CardTitle className="text-3xl">{tForm("title")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="space-y-5"
                                onSubmit={event => {
                                    event.preventDefault()
                                    void form.handleSubmit()
                                }}
                            >
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <form.Field
                                        name="firstName"
                                        validators={{
                                            onChange: ({ value }) =>
                                                value.trim()
                                                    ? undefined
                                                    : tValidation("firstNameRequired"),
                                        }}
                                    >
                                        {field => (
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor={field.name}>
                                                    {tForm("firstNameLabel")}
                                                </RequiredLabel>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    onBlur={field.handleBlur}
                                                    onChange={event => {
                                                        captureFormStarted("change", field.name)
                                                        field.handleChange(event.target.value)
                                                    }}
                                                    value={field.state.value}
                                                />
                                                <FieldError
                                                    message={getVisibleFieldError(field.state.meta)}
                                                />
                                            </div>
                                        )}
                                    </form.Field>

                                    <form.Field
                                        name="lastName"
                                        validators={{
                                            onChange: ({ value }) =>
                                                value.trim()
                                                    ? undefined
                                                    : tValidation("lastNameRequired"),
                                        }}
                                    >
                                        {field => (
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor={field.name}>
                                                    {tForm("lastNameLabel")}
                                                </RequiredLabel>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    onBlur={field.handleBlur}
                                                    onChange={event => {
                                                        captureFormStarted("change", field.name)
                                                        field.handleChange(event.target.value)
                                                    }}
                                                    value={field.state.value}
                                                />
                                                <FieldError
                                                    message={getVisibleFieldError(field.state.meta)}
                                                />
                                            </div>
                                        )}
                                    </form.Field>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <form.Field
                                        name="email"
                                        validators={{
                                            onChange: ({ value }) =>
                                                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                                    value.trim().toLowerCase(),
                                                )
                                                    ? undefined
                                                    : tValidation("emailInvalid"),
                                        }}
                                    >
                                        {field => (
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor={field.name}>
                                                    {tForm("emailLabel")}
                                                </RequiredLabel>
                                                <Input
                                                    autoComplete="email"
                                                    id={field.name}
                                                    name={field.name}
                                                    onBlur={field.handleBlur}
                                                    onChange={event => {
                                                        captureFormStarted("change", field.name)
                                                        field.handleChange(event.target.value)
                                                    }}
                                                    placeholder={tForm("emailPlaceholder")}
                                                    type="email"
                                                    value={field.state.value}
                                                />
                                                <FieldError
                                                    message={getVisibleFieldError(field.state.meta)}
                                                />
                                            </div>
                                        )}
                                    </form.Field>

                                    <form.Field
                                        name="phone"
                                        validators={{
                                            onChange: ({ value }) =>
                                                value.trim()
                                                    ? undefined
                                                    : tValidation("phoneRequired"),
                                        }}
                                    >
                                        {field => (
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor={field.name}>
                                                    {tForm("phoneLabel")}
                                                </RequiredLabel>
                                                <Input
                                                    autoComplete="tel"
                                                    id={field.name}
                                                    name={field.name}
                                                    onBlur={event => {
                                                        captureFormStarted("change", field.name)
                                                        field.handleChange(
                                                            normalizeVolunteerPhoneNumber(
                                                                event.target.value,
                                                            ),
                                                        )
                                                        field.handleBlur()
                                                    }}
                                                    onChange={event => {
                                                        captureFormStarted("change", field.name)
                                                        field.handleChange(event.target.value)
                                                    }}
                                                    placeholder={tForm("phonePlaceholder")}
                                                    type="tel"
                                                    value={field.state.value}
                                                />
                                                <FieldError
                                                    message={getVisibleFieldError(field.state.meta)}
                                                />
                                            </div>
                                        )}
                                    </form.Field>
                                </div>

                                <form.Field
                                    name="studyInstitution"
                                    validators={{
                                        onChange: ({ value }) =>
                                            value.trim()
                                                ? undefined
                                                : tValidation("studyInstitutionRequired"),
                                    }}
                                >
                                    {field => (
                                        <div className="space-y-2">
                                            <RequiredLabel htmlFor={field.name}>
                                                {tForm("studyInstitutionLabel")}
                                            </RequiredLabel>
                                            <select
                                                className="flex h-10 w-full border-2 border-border bg-secondary-background px-3 py-2 text-sm text-foreground shadow-shadow focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                                                id={field.name}
                                                name={field.name}
                                                onBlur={field.handleBlur}
                                                onChange={event => {
                                                    captureFormStarted("change", field.name)
                                                    field.handleChange(event.target.value)
                                                }}
                                                value={field.state.value}
                                            >
                                                <option value="">
                                                    {tForm("studyInstitutionPlaceholder")}
                                                </option>
                                                {institutionOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <FieldError
                                                message={getVisibleFieldError(field.state.meta)}
                                            />
                                        </div>
                                    )}
                                </form.Field>

                                <form.Field name="backgroundDetails">
                                    {field => (
                                        <div className="space-y-2">
                                            <Label htmlFor={field.name}>
                                                {tForm("backgroundDetailsLabel")}
                                            </Label>
                                            <Textarea
                                                id={field.name}
                                                name={field.name}
                                                onBlur={field.handleBlur}
                                                onChange={event => {
                                                    captureFormStarted("change", field.name)
                                                    field.handleChange(event.target.value)
                                                }}
                                                placeholder={tForm("backgroundDetailsPlaceholder")}
                                                rows={4}
                                                value={field.state.value}
                                            />
                                        </div>
                                    )}
                                </form.Field>

                                <VolunteerChoiceSummary
                                    firstChoiceError={firstChoiceError}
                                    firstChoiceGroupSlug={formValues.firstChoiceGroupSlug}
                                    firstChoiceLabel={tForm("firstChoiceLabel")}
                                    groups={groups}
                                    onRemoveChoice={removeChoice}
                                    optionalLabel={tForm("optionalLabel")}
                                    secondChoiceError={secondChoiceError}
                                    secondChoiceGroupSlug={formValues.secondChoiceGroupSlug}
                                    secondChoiceLabel={tForm("secondChoiceLabel")}
                                />

                                <VolunteerFormMessageAlert
                                    errorTitle={tForm("errorTitle")}
                                    formMessage={formMessage}
                                    successTitle={tForm("successTitle")}
                                />

                                <form.Subscribe
                                    selector={state => [state.canSubmit, state.isSubmitting]}
                                >
                                    {([canSubmit, isSubmitting]) => (
                                        <button
                                            aria-disabled={
                                                !canSubmit ||
                                                secondChoiceConflict ||
                                                createProspectMutation.isPending
                                            }
                                            className="inline-flex h-12 w-full cursor-pointer items-center justify-center whitespace-nowrap rounded-base bg-primary text-sm font-base text-primary-foreground ring-offset-white btn-brutal disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={
                                                !canSubmit ||
                                                secondChoiceConflict ||
                                                createProspectMutation.isPending ||
                                                isSubmitting
                                            }
                                            type="submit"
                                        >
                                            {createProspectMutation.isPending || isSubmitting
                                                ? tForm("submitPending")
                                                : tForm("submitIdle")}
                                        </button>
                                    )}
                                </form.Subscribe>
                            </form>
                        </CardContent>
                    </Card>
                </aside>
            </div>

            <VolunteerChoiceModal
                choiceModalDescriptionLabel={groupName =>
                    tForm("choiceModalDescription", { group: groupName })
                }
                choiceModalGroup={choiceModalGroup ?? null}
                choiceModalTitle={tForm("choiceModalTitle")}
                closeLabel={tForm("choiceModalClose")}
                firstChoiceLabel={tForm("choiceModalFirst")}
                modalFirstChoiceSlug={formValues.firstChoiceGroupSlug}
                modalSecondChoiceSlug={formValues.secondChoiceGroupSlug}
                onApplyChoice={applyChoice}
                onClose={closeChoiceModal}
                secondChoiceLabel={tForm("choiceModalSecond")}
            />

            <footer className="w-full py-8 text-center text-lg text-foreground/75">
                {tHome("footer")}
            </footer>
        </>
    )
}
