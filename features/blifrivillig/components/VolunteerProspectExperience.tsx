"use client"

import { useLocale, useTranslations } from "next-intl"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { InstitutionOption, VolunteerGroupContent } from "@/features/blifrivillig/content"
import type { VolunteerProspectValidationMessages } from "@/features/blifrivillig/prospect"
import { normalizeVolunteerPhoneNumber } from "@/features/blifrivillig/prospect"
import { useVolunteerProspectController } from "../hooks/useVolunteerProspectController"
import {
    FieldError,
    getVisibleFieldError,
    RequiredLabel,
    VolunteerFormMessageAlert,
} from "../shared"
import { VolunteerChoiceModal } from "./ChoiceModal"
import { VolunteerChoiceSummary } from "./ChoiceSummary"
import { VolunteerProspectGroupList } from "./GroupList"
import { VolunteerProspectHero } from "./Hero"

export function VolunteerProspectExperience({
    groups,
    institutionOptions,
    hideHero = false,
}: {
    groups: VolunteerGroupContent[]
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
            friendEmailInvalid: tValidation("friendEmailInvalid"),
            friendEmailDuplicate: tValidation("friendEmailDuplicate"),
            friendEmailMax: tValidation("friendEmailMax"),
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
                            badge=""
                            description=""
                            eventsLinkLabel=""
                            fusionDescription=""
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
                                            <Select
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
                                            </Select>
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

                                <form.Field name="friendEmails">
                                    {field => {
                                        const friendErrors =
                                            createProspectMutation.error?.fieldErrors?.friendEmails
                                        const indexedFriendErrors =
                                            friendErrors && typeof friendErrors === "object"
                                                ? friendErrors
                                                : {}
                                        const friendEmails = field.state.value

                                        return (
                                            <section className="space-y-3 border-t-2 border-border pt-5">
                                                <div className="space-y-1">
                                                    <Label>{tForm("friendSignupLabel")}</Label>
                                                    <p className="text-sm leading-6 text-foreground/75">
                                                        {tForm("friendSignupHelp")}
                                                    </p>
                                                </div>
                                                <div className="space-y-3">
                                                    {friendEmails.map((email, index) => (
                                                        <div
                                                            className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                                                            key={index}
                                                        >
                                                            <div className="space-y-2">
                                                                <Input
                                                                    aria-label={tForm(
                                                                        "friendEmailLabel",
                                                                        { number: index + 1 },
                                                                    )}
                                                                    onBlur={field.handleBlur}
                                                                    onChange={event => {
                                                                        captureFormStarted(
                                                                            "change",
                                                                            field.name,
                                                                        )
                                                                        const nextEmails = [
                                                                            ...friendEmails,
                                                                        ]
                                                                        nextEmails[index] =
                                                                            event.target.value
                                                                        field.handleChange(
                                                                            nextEmails,
                                                                        )
                                                                    }}
                                                                    placeholder={tForm(
                                                                        "friendEmailPlaceholder",
                                                                    )}
                                                                    type="email"
                                                                    value={email}
                                                                />
                                                                <FieldError
                                                                    message={
                                                                        indexedFriendErrors[
                                                                            String(index)
                                                                        ] ??
                                                                        (typeof friendErrors ===
                                                                        "string"
                                                                            ? friendErrors
                                                                            : undefined)
                                                                    }
                                                                />
                                                            </div>
                                                            <Button
                                                                aria-label={tForm("removeFriend")}
                                                                onClick={() => {
                                                                    field.handleChange(
                                                                        friendEmails.filter(
                                                                            (_, emailIndex) =>
                                                                                emailIndex !==
                                                                                index,
                                                                        ),
                                                                    )
                                                                }}
                                                                size="icon"
                                                                type="button"
                                                                variant="neutral"
                                                            >
                                                                ×
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                                {friendEmails.length < 2 && (
                                                    <Button
                                                        onClick={() => {
                                                            captureFormStarted("change", field.name)
                                                            field.handleChange([
                                                                ...friendEmails,
                                                                "",
                                                            ])
                                                        }}
                                                        type="button"
                                                        variant="neutral"
                                                    >
                                                        {tForm("addFriend")}
                                                    </Button>
                                                )}
                                                <FieldError
                                                    message={
                                                        typeof friendErrors === "string"
                                                            ? friendErrors
                                                            : getVisibleFieldError(field.state.meta)
                                                    }
                                                />
                                            </section>
                                        )
                                    }}
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
                                        <Button
                                            className="w-full"
                                            disabled={
                                                !canSubmit ||
                                                secondChoiceConflict ||
                                                createProspectMutation.isPending ||
                                                isSubmitting
                                            }
                                            size="lg"
                                            type="submit"
                                        >
                                            {createProspectMutation.isPending || isSubmitting
                                                ? tForm("submitPending")
                                                : tForm("submitIdle")}
                                        </Button>
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
