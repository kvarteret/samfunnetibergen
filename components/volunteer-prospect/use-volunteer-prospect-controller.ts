"use client"

import { useForm, useStore } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { posthog } from "posthog-js"
import { useEffect, useMemo, useRef, useState } from "react"

import { resolveInitialLaunchGroupSlug } from "@/lib/volunteer-groups"
import type { LaunchGroupContent, LaunchGroupSlug } from "@/lib/volunteer-launch-content"
import {
    defaultVolunteerProspectValues,
    loadVolunteerProspectDraft,
    normalizeVolunteerPhoneNumber,
    type VolunteerProspectErrorResponse,
    type VolunteerProspectResponse,
    type VolunteerProspectValidationMessages,
    type VolunteerProspectValues,
    validateVolunteerProspectValues,
    volunteerProspectDraftStorageKey,
} from "@/lib/volunteer-prospect"
import type { VolunteerFormMessage } from "./shared"

type UseVolunteerProspectControllerProps = {
    groups: LaunchGroupContent[]
    initialGroupSlug?: string
    invalidFormMessage: string
    locale: string
    submitErrorFallback: string
    submittedMessage: string
    validationMessages: VolunteerProspectValidationMessages
}

export function useVolunteerProspectController({
    groups,
    initialGroupSlug,
    invalidFormMessage,
    locale,
    submitErrorFallback,
    submittedMessage,
    validationMessages,
}: UseVolunteerProspectControllerProps) {
    const [formMessage, setFormMessage] = useState<VolunteerFormMessage | null>(null)
    const [choiceModalGroupSlug, setChoiceModalGroupSlug] = useState<LaunchGroupSlug | null>(null)
    const hasRestoredDraftRef = useRef(false)
    const hasStartedFormRef = useRef(false)

    const initialValues = useMemo<VolunteerProspectValues>(() => {
        const resolvedInitialGroup = resolveInitialLaunchGroupSlug(groups, initialGroupSlug)

        return {
            ...defaultVolunteerProspectValues,
            firstChoiceGroupSlug: resolvedInitialGroup ?? "",
        }
    }, [groups, initialGroupSlug])

    const form = useForm({
        defaultValues: initialValues,
        canSubmitWhenInvalid: false,
        onSubmit: async ({ value }) => {
            captureFormStarted("submit")

            const submittedValues = {
                ...(value as VolunteerProspectValues),
                phone: normalizeVolunteerPhoneNumber(value.phone),
            }
            const fieldErrors = validateVolunteerProspectValues(submittedValues, validationMessages)

            if (Object.keys(fieldErrors).length > 0) {
                setFormMessage({
                    status: "error",
                    message: invalidFormMessage,
                })
                return
            }

            setFormMessage(null)
            await createProspectMutation.mutateAsync(submittedValues)
            form.reset(defaultVolunteerProspectValues)
        },
    })

    function captureFormStarted(source: "change" | "submit", fieldName?: string) {
        if (hasStartedFormRef.current) {
            return
        }

        hasStartedFormRef.current = true
        posthog.capture("volunteer_form_started", {
            source,
            field_name: fieldName ?? null,
            first_choice_group: form.state.values.firstChoiceGroupSlug || null,
            second_choice_group: form.state.values.secondChoiceGroupSlug || null,
        })
    }

    const createProspectMutation = useMutation<
        VolunteerProspectResponse,
        VolunteerProspectErrorResponse,
        VolunteerProspectValues
    >({
        mutationFn: async values => {
            const distinctId = posthog.get_distinct_id()?.trim()
            const response = await fetch("/api/volunteer-prospects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept-Language": locale,
                    ...(distinctId ? { "x-posthog-distinct-id": distinctId } : {}),
                    "x-posthog-session-id": posthog.get_session_id() ?? "",
                },
                body: JSON.stringify(values),
            })

            // The route handler returns translated validation payloads, so the client can
            // surface field-level errors without duplicating server-side rules.
            const payload = (await response.json().catch(() => null)) as
                | VolunteerProspectResponse
                | VolunteerProspectErrorResponse
                | null

            if (!response.ok) {
                throw {
                    detail:
                        payload && "detail" in payload && typeof payload.detail === "string"
                            ? payload.detail
                            : submitErrorFallback,
                    fieldErrors:
                        payload && "fieldErrors" in payload ? payload.fieldErrors : undefined,
                }
            }

            return payload as VolunteerProspectResponse
        },
        onSuccess: (_, variables) => {
            posthog.capture("volunteer_form_submitted", {
                first_choice_group: variables.firstChoiceGroupSlug,
                second_choice_group: variables.secondChoiceGroupSlug || null,
            })
            window.localStorage.removeItem(volunteerProspectDraftStorageKey)
            hasStartedFormRef.current = false
            setFormMessage({
                status: "success",
                message: submittedMessage,
            })
        },
        onError: (error, variables) => {
            posthog.capture("volunteer_form_submission_failed", {
                first_choice_group: variables.firstChoiceGroupSlug,
                second_choice_group: variables.secondChoiceGroupSlug || null,
                error_detail: error.detail,
            })
            setFormMessage({
                status: "error",
                message: error.detail,
            })
        },
    })

    const formValues = useStore(form.store, state => state.values)
    const secondChoiceConflict =
        !!formValues.secondChoiceGroupSlug &&
        formValues.secondChoiceGroupSlug === formValues.firstChoiceGroupSlug

    function restoreDraftIntoForm() {
        const draft = loadVolunteerProspectDraft()
        const resolvedInitialGroup =
            resolveInitialLaunchGroupSlug(groups, initialGroupSlug) ?? draft.firstChoiceGroupSlug

        form.reset({
            ...defaultVolunteerProspectValues,
            ...draft,
            firstChoiceGroupSlug: resolvedInitialGroup || "",
        })
        hasRestoredDraftRef.current = true
    }

    function persistDraftToLocalStorage() {
        if (!hasRestoredDraftRef.current) {
            return
        }

        window.localStorage.setItem(volunteerProspectDraftStorageKey, JSON.stringify(formValues))
    }

    function syncServerFieldErrorsToForm() {
        if (!createProspectMutation.isError || !createProspectMutation.error.fieldErrors) {
            return
        }

        const errorEntries = Object.entries(createProspectMutation.error.fieldErrors) as Array<
            [keyof VolunteerProspectValues, string]
        >

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

    function closeChoiceModalOnEscape() {
        if (!choiceModalGroupSlug) {
            return
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setChoiceModalGroupSlug(null)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }

    useEffect(() => {
        restoreDraftIntoForm()
    }, [form, groups, initialGroupSlug])

    useEffect(() => {
        persistDraftToLocalStorage()
    }, [formValues])

    useEffect(() => {
        syncServerFieldErrorsToForm()
    }, [createProspectMutation.error, createProspectMutation.isError, form])

    useEffect(() => {
        return closeChoiceModalOnEscape()
    }, [choiceModalGroupSlug])

    function markChoiceFieldsTouched() {
        form.setFieldMeta("firstChoiceGroupSlug", previous => ({
            ...previous,
            isTouched: true,
        }))
        form.setFieldMeta("secondChoiceGroupSlug", previous => ({
            ...previous,
            isTouched: true,
        }))
    }

    function clearFormFeedback() {
        setFormMessage(null)
    }

    function selectPrimaryGroup(slug: LaunchGroupSlug) {
        posthog.capture("volunteer_group_selected", {
            group_slug: slug,
            choice: "first",
        })

        form.setFieldValue("firstChoiceGroupSlug", slug)
        form.setFieldMeta("firstChoiceGroupSlug", previous => ({
            ...previous,
            isTouched: true,
        }))

        if (form.state.values.secondChoiceGroupSlug === slug) {
            form.setFieldValue("secondChoiceGroupSlug", "")
        }

        clearFormFeedback()

        if (window.innerWidth < 1024) {
            document.getElementById("registration-form")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            })
        }
    }

    function applyChoice(slug: LaunchGroupSlug, target: "first" | "second") {
        posthog.capture("volunteer_group_selected", {
            group_slug: slug,
            choice: target,
        })

        const currentFirst = form.state.values.firstChoiceGroupSlug
        const currentSecond = form.state.values.secondChoiceGroupSlug

        if (target === "first") {
            if (currentFirst === slug) {
                return
            }

            // Promoting a choice to primary preserves the old primary as backup when possible,
            // so the user can reprioritize without rebuilding both selections from scratch.
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

            markChoiceFieldsTouched()
            clearFormFeedback()
            return
        }

        if (!currentFirst) {
            selectPrimaryGroup(slug)
            return
        }

        // Clicking the current primary as "second" is treated as a swap when a backup exists.
        if (currentFirst === slug) {
            if (!currentSecond) {
                return
            }

            form.setFieldValue("firstChoiceGroupSlug", currentSecond)
            form.setFieldValue("secondChoiceGroupSlug", slug)
        } else {
            form.setFieldValue("secondChoiceGroupSlug", currentSecond === slug ? "" : slug)
        }

        markChoiceFieldsTouched()
        clearFormFeedback()
    }

    function removeChoice(target: "first" | "second") {
        const currentSecond = form.state.values.secondChoiceGroupSlug

        if (target === "first") {
            form.setFieldValue("firstChoiceGroupSlug", currentSecond || "")
            form.setFieldValue("secondChoiceGroupSlug", "")
        } else {
            form.setFieldValue("secondChoiceGroupSlug", "")
        }

        markChoiceFieldsTouched()
        clearFormFeedback()
    }

    return {
        applyChoice,
        captureFormStarted,
        choiceModalGroup:
            choiceModalGroupSlug && groups.find(group => group.slug === choiceModalGroupSlug),
        closeChoiceModal: () => setChoiceModalGroupSlug(null),
        createProspectMutation,
        form,
        formMessage,
        formValues,
        openChoiceModal: setChoiceModalGroupSlug,
        removeChoice,
        secondChoiceConflict,
    }
}
