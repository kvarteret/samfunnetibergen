"use client"

import { useForm, useStore } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import {
    defaultVolunteerProspectValues,
    loadVolunteerProspectDraft,
    validateVolunteerProspectValues,
    volunteerProspectDraftStorageKey,
    type VolunteerProspectErrorResponse,
    type VolunteerProspectResponse,
    type VolunteerProspectValidationMessages,
    type VolunteerProspectValues,
} from "@/lib/volunteer-prospect"
import type {
    InstitutionOption,
    LaunchGroupContent,
    LaunchGroupSlug,
} from "@/lib/volunteer-launch-content"

function RequiredStar() {
    return <span aria-hidden="true" className="text-destructive">*</span>
}

function RequiredLabel({
    htmlFor,
    children,
}: {
    htmlFor?: string
    children: React.ReactNode
}) {
    return (
        <Label className="flex items-center gap-1" htmlFor={htmlFor}>
            <span>{children}</span>
            <RequiredStar />
        </Label>
    )
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null
    return <p className="text-sm text-destructive">{message}</p>
}

export function VolunteerProspectExperience({
    groups,
    institutionOptions,
    initialGroupSlug,
}: {
    groups: LaunchGroupContent[]
    institutionOptions: InstitutionOption[]
    initialGroupSlug?: string
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

    const initialValues = useMemo<VolunteerProspectValues>(() => {
        const resolvedInitialGroup = groups.some(group => group.slug === initialGroupSlug)
            ? (initialGroupSlug as LaunchGroupSlug)
            : ""

        return {
            ...defaultVolunteerProspectValues,
            firstChoiceGroupSlug: resolvedInitialGroup || "",
        }
    }, [groups, initialGroupSlug])

    const [formMessage, setFormMessage] = useState<{
        status: "success" | "error"
        message: string
    } | null>(null)
    const [choiceModalGroupSlug, setChoiceModalGroupSlug] = useState<LaunchGroupSlug | null>(
        null,
    )
    const hasRestoredDraftRef = useRef(false)

    const createProspectMutation = useMutation<
        VolunteerProspectResponse,
        VolunteerProspectErrorResponse,
        VolunteerProspectValues
    >({
        mutationFn: async values => {
            const response = await fetch("/api/volunteer-prospects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept-Language": locale,
                },
                body: JSON.stringify(values),
            })

            const payload = (await response.json().catch(() => null)) as
                | VolunteerProspectResponse
                | VolunteerProspectErrorResponse
                | null

            if (!response.ok) {
                throw {
                    detail:
                        payload && "detail" in payload && typeof payload.detail === "string"
                            ? payload.detail
                            : tForm("submitErrorFallback"),
                    fieldErrors:
                        payload && "fieldErrors" in payload ? payload.fieldErrors : undefined,
                }
            }

            return payload as VolunteerProspectResponse
        },
        onSuccess: () => {
            window.localStorage.removeItem(volunteerProspectDraftStorageKey)
            setFormMessage({
                status: "success",
                message: tForm("submittedMessage"),
            })
        },
        onError: error => {
            setFormMessage({
                status: "error",
                message: error.detail,
            })
        },
    })

    const form = useForm({
        defaultValues: initialValues,
        canSubmitWhenInvalid: false,
        onSubmit: async ({ value }) => {
            const submittedValues = value as VolunteerProspectValues
            const fieldErrors = validateVolunteerProspectValues(
                submittedValues,
                validationMessages,
            )

            if (Object.keys(fieldErrors).length > 0) {
                setFormMessage({
                    status: "error",
                    message: tForm("invalidFormMessage"),
                })
                return
            }

            setFormMessage(null)
            await createProspectMutation.mutateAsync(submittedValues)
            form.reset(defaultVolunteerProspectValues)
        },
    })

    const formValues = useStore(form.store, state => state.values)
    const secondChoiceConflict =
        !!formValues.secondChoiceGroupSlug &&
        formValues.secondChoiceGroupSlug === formValues.firstChoiceGroupSlug

    useEffect(() => {
        const draft = loadVolunteerProspectDraft()
        const resolvedInitialGroup = groups.some(group => group.slug === initialGroupSlug)
            ? (initialGroupSlug as LaunchGroupSlug)
            : draft.firstChoiceGroupSlug

        form.reset({
            ...defaultVolunteerProspectValues,
            ...draft,
            firstChoiceGroupSlug: resolvedInitialGroup || "",
        })
        hasRestoredDraftRef.current = true
    }, [form, groups, initialGroupSlug])

    useEffect(() => {
        if (!hasRestoredDraftRef.current) return
        window.localStorage.setItem(
            volunteerProspectDraftStorageKey,
            JSON.stringify(formValues),
        )
    }, [formValues])

    useEffect(() => {
        if (createProspectMutation.isError && createProspectMutation.error.fieldErrors) {
            const errorEntries = Object.entries(
                createProspectMutation.error.fieldErrors,
            ) as Array<[keyof VolunteerProspectValues, string]>

            for (const [fieldName, message] of errorEntries) {
                form.setFieldMeta(fieldName, previous => ({
                    ...previous,
                    errorMap: {
                        ...previous.errorMap,
                        onSubmit: message,
                    },
                    isTouched: true,
                }))
            }
        }
    }, [createProspectMutation.error, createProspectMutation.isError, form])

    function selectPrimaryGroup(slug: LaunchGroupSlug) {
        form.setFieldValue("firstChoiceGroupSlug", slug)
        form.setFieldMeta("firstChoiceGroupSlug", previous => ({
            ...previous,
            isTouched: true,
        }))

        if (form.state.values.secondChoiceGroupSlug === slug) {
            form.setFieldValue("secondChoiceGroupSlug", "")
        }

        setFormMessage(null)

        if (window.innerWidth < 1024) {
            document.getElementById("registration-form")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            })
        }
    }

    function applyChoice(slug: LaunchGroupSlug, target: "first" | "second") {
        const currentFirst = form.state.values.firstChoiceGroupSlug
        const currentSecond = form.state.values.secondChoiceGroupSlug

        if (target === "first") {
            if (currentFirst === slug) {
                return
            }

            if (currentSecond === slug) {
                form.setFieldValue("firstChoiceGroupSlug", slug)
                form.setFieldValue(
                    "secondChoiceGroupSlug",
                    currentFirst && currentFirst !== slug ? currentFirst : "",
                )
            } else {
                form.setFieldValue("firstChoiceGroupSlug", slug)

                if (currentSecond && currentSecond !== slug) {
                    form.setFieldValue("secondChoiceGroupSlug", currentSecond)
                } else if (currentFirst && currentFirst !== slug) {
                    form.setFieldValue("secondChoiceGroupSlug", currentFirst)
                } else {
                    form.setFieldValue("secondChoiceGroupSlug", "")
                }
            }

            form.setFieldMeta("firstChoiceGroupSlug", previous => ({
                ...previous,
                isTouched: true,
            }))
            form.setFieldMeta("secondChoiceGroupSlug", previous => ({
                ...previous,
                isTouched: true,
            }))
            setFormMessage(null)
            return
        }

        if (!currentFirst) {
            selectPrimaryGroup(slug)
            return
        }

        if (currentFirst === slug) {
            if (!currentSecond) {
                return
            }

            form.setFieldValue("firstChoiceGroupSlug", currentSecond)
            form.setFieldValue("secondChoiceGroupSlug", slug)
        } else {
            form.setFieldValue("secondChoiceGroupSlug", currentSecond === slug ? "" : slug)
        }

        form.setFieldMeta("firstChoiceGroupSlug", previous => ({
            ...previous,
            isTouched: true,
        }))
        form.setFieldMeta("secondChoiceGroupSlug", previous => ({
            ...previous,
            isTouched: true,
        }))
        setFormMessage(null)
    }

    useEffect(() => {
        if (!choiceModalGroupSlug) return

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setChoiceModalGroupSlug(null)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [choiceModalGroupSlug])

    const choiceModalGroup = choiceModalGroupSlug
        ? groups.find(group => group.slug === choiceModalGroupSlug) ?? null
        : null
    const modalFirstChoiceSlug = formValues.firstChoiceGroupSlug
    const modalSecondChoiceSlug = formValues.secondChoiceGroupSlug

    return (
        <main className="flex-1 px-6 py-10 sm:px-10 lg:px-14">
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <section className="space-y-8">
                    <div className="inline-flex border-2 border-border bg-destructive px-5 py-3 text-lg uppercase tracking-[0.28em] text-destructive-foreground shadow-shadow">
                        {tHome("badge")}
                    </div>

                    <div className="space-y-5">
                        <p className="max-w-4xl text-base leading-8 text-foreground/85 sm:text-lg">
                            {tHome("heroDescription")}
                        </p>
                    </div>

                    <div className="grid gap-5">
                        {groups.map(group => {
                            const isSelected =
                                form.state.values.firstChoiceGroupSlug === group.slug
                            const isSecondChoice =
                                form.state.values.secondChoiceGroupSlug === group.slug

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
                                                <h2 className="text-3xl leading-none">
                                                    {group.name}
                                                </h2>
                                            </div>

                                            <Button
                                                className="h-auto px-3 py-2 text-xs uppercase tracking-[0.22em]"
                                                onClick={() => setChoiceModalGroupSlug(group.slug)}
                                                type="button"
                                                variant={
                                                    isSelected || isSecondChoice
                                                        ? "neutral"
                                                        : "default"
                                                }
                                            >
                                                {isSelected
                                                    ? tForm("selectionActionPrimary")
                                                    : isSecondChoice
                                                      ? tForm("selectionActionSecondary")
                                                      : tForm("selectionActionIdle")}
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
                                                    {tForm("accordionAction")}
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
                                                    {tForm("detailAction", { group: group.name })}
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </section>

                <aside className="lg:sticky lg:top-8 lg:self-start">
                    <Card className="bg-card" id="registration-form">
                        <CardHeader>
                            <CardTitle className="text-3xl">{tForm("title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-[calc(100vh-6rem)] overflow-y-auto">
                            <form
                                className="space-y-5"
                                onSubmit={event => {
                                    event.preventDefault()
                                    void form.handleSubmit()
                                }}
                            >
                                <div className="space-y-2">
                                    <RequiredLabel>{tForm("firstChoiceLabel")}</RequiredLabel>
                                    <div className="border-2 border-border bg-secondary-background px-4 py-3 text-sm shadow-shadow">
                                        {formValues.firstChoiceGroupSlug
                                            ? groups.find(
                                                  group =>
                                                      group.slug ===
                                                      formValues.firstChoiceGroupSlug,
                                              )?.name
                                            : tForm("firstChoicePlaceholder")}
                                    </div>
                                    <FieldError
                                        message={
                                            form.state.fieldMeta.firstChoiceGroupSlug?.errorMap
                                                ?.onSubmit as string | undefined
                                        }
                                    />
                                </div>

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
                                                    onChange={event =>
                                                        field.handleChange(event.target.value)
                                                    }
                                                    value={field.state.value}
                                                />
                                                <FieldError
                                                    message={
                                                        field.state.meta.isTouched
                                                            ? (field.state.meta.errors[0] as
                                                                  | string
                                                                  | undefined)
                                                            : undefined
                                                    }
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
                                                    onChange={event =>
                                                        field.handleChange(event.target.value)
                                                    }
                                                    value={field.state.value}
                                                />
                                                <FieldError
                                                    message={
                                                        field.state.meta.isTouched
                                                            ? (field.state.meta.errors[0] as
                                                                  | string
                                                                  | undefined)
                                                            : undefined
                                                    }
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
                                                    onChange={event =>
                                                        field.handleChange(event.target.value)
                                                    }
                                                    placeholder={tForm("emailPlaceholder")}
                                                    type="email"
                                                    value={field.state.value}
                                                />
                                                <FieldError
                                                    message={
                                                        field.state.meta.isTouched
                                                            ? (field.state.meta.errors[0] as
                                                                  | string
                                                                  | undefined)
                                                            : undefined
                                                    }
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
                                                    onBlur={field.handleBlur}
                                                    onChange={event =>
                                                        field.handleChange(event.target.value)
                                                    }
                                                    placeholder={tForm("phonePlaceholder")}
                                                    type="tel"
                                                    value={field.state.value}
                                                />
                                                <FieldError
                                                    message={
                                                        field.state.meta.isTouched
                                                            ? (field.state.meta.errors[0] as
                                                                  | string
                                                                  | undefined)
                                                            : undefined
                                                    }
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
                                                onChange={event =>
                                                    field.handleChange(event.target.value)
                                                }
                                                value={field.state.value}
                                            >
                                                <option value="">
                                                    {tForm("studyInstitutionPlaceholder")}
                                                </option>
                                                {institutionOptions.map(option => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <FieldError
                                                message={
                                                    field.state.meta.isTouched
                                                        ? (field.state.meta.errors[0] as
                                                              | string
                                                              | undefined)
                                                        : undefined
                                                }
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
                                                onChange={event =>
                                                    field.handleChange(event.target.value)
                                                }
                                                placeholder={tForm(
                                                    "backgroundDetailsPlaceholder",
                                                )}
                                                rows={4}
                                                value={field.state.value}
                                            />
                                        </div>
                                    )}
                                </form.Field>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <Label>{tForm("secondChoiceLabel")}</Label>
                                        <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                                            {tForm("optionalLabel")}
                                        </span>
                                    </div>
                                    <div className="border-2 border-border bg-secondary-background px-4 py-3 text-sm shadow-shadow">
                                        {formValues.secondChoiceGroupSlug
                                            ? groups.find(
                                                  group =>
                                                      group.slug ===
                                                      formValues.secondChoiceGroupSlug,
                                              )?.name
                                            : tForm("clearSecondChoice")}
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={() => form.setFieldValue("secondChoiceGroupSlug", "")}
                                        type="button"
                                        variant="neutral"
                                    >
                                        {tForm("clearSecondChoice")}
                                    </Button>
                                    <FieldError
                                        message={
                                            secondChoiceConflict
                                                ? tForm("secondChoiceConflict")
                                                : ((form.state.fieldMeta.secondChoiceGroupSlug
                                                      ?.errorMap?.onSubmit as string | undefined) ??
                                                  undefined)
                                        }
                                    />
                                </div>

                                {formMessage ? (
                                    <Alert
                                        variant={
                                            formMessage.status === "error"
                                                ? "destructive"
                                                : "default"
                                        }
                                    >
                                        <AlertTitle>
                                            {formMessage.status === "success"
                                                ? tForm("successTitle")
                                                : tForm("errorTitle")}
                                        </AlertTitle>
                                        <AlertDescription>{formMessage.message}</AlertDescription>
                                    </Alert>
                                ) : null}

                                <form.Subscribe
                                    selector={state => [state.canSubmit, state.isSubmitting]}
                                >
                                    {([canSubmit, isSubmitting]) => (
                                        <Button
                                            aria-disabled={
                                                !canSubmit ||
                                                secondChoiceConflict ||
                                                createProspectMutation.isPending
                                            }
                                            className="h-12 w-full"
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
                                        </Button>
                                    )}
                                </form.Subscribe>
                            </form>
                        </CardContent>
                    </Card>
                </aside>
            </div>
            {choiceModalGroup ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6"
                    onClick={() => setChoiceModalGroupSlug(null)}
                >
                    <div
                        aria-modal="true"
                        className="w-full max-w-md border-2 border-border bg-card p-6 shadow-shadow"
                        onClick={event => event.stopPropagation()}
                        role="dialog"
                    >
                        <div className="grid gap-3">
                            <h3 className="text-2xl leading-none">
                                {tForm("choiceModalTitle")}
                            </h3>
                            <p className="text-sm leading-6 text-foreground/75">
                                {tForm("choiceModalDescription", {
                                    group: choiceModalGroup.name,
                                })}
                            </p>
                        </div>

                        <div className="mt-6 grid gap-3">
                            {modalFirstChoiceSlug ? (
                                <>
                                    <Button
                                        onClick={() => {
                                            applyChoice(choiceModalGroup.slug, "second")
                                            setChoiceModalGroupSlug(null)
                                        }}
                                        type="button"
                                        variant="default"
                                    >
                                        {modalFirstChoiceSlug === choiceModalGroup.slug &&
                                        modalSecondChoiceSlug
                                            ? tForm("choiceModalSecond")
                                            : modalSecondChoiceSlug === choiceModalGroup.slug
                                              ? tForm("choiceModalFirst")
                                              : tForm("choiceModalSecond")}
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            applyChoice(choiceModalGroup.slug, "first")
                                            setChoiceModalGroupSlug(null)
                                        }}
                                        type="button"
                                        variant="neutral"
                                    >
                                        {modalSecondChoiceSlug === choiceModalGroup.slug
                                            ? tForm("choiceModalFirst")
                                            : tForm("choiceModalFirst")}
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => {
                                        applyChoice(choiceModalGroup.slug, "first")
                                        setChoiceModalGroupSlug(null)
                                    }}
                                    type="button"
                                    variant="default"
                                >
                                    {tForm("choiceModalFirst")}
                                </Button>
                            )}

                            <Button
                                onClick={() => setChoiceModalGroupSlug(null)}
                                type="button"
                                variant="neutral"
                            >
                                {tForm("choiceModalClose")}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
            <footer className="w-full py-8 text-center text-lg text-foreground/75">
                {tHome("footer")}
            </footer>
        </main>
    )
}
