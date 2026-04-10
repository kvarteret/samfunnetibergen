import { isValidEmailAddress } from "@/lib/contact"
import { getLaunchGroupBySlug, type LaunchGroupSlug } from "@/lib/volunteer-launch-content"

export type VolunteerProspectField =
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "studyInstitution"
    | "backgroundDetails"
    | "firstChoiceGroupSlug"
    | "secondChoiceGroupSlug"

export type VolunteerProspectValues = {
    firstName: string
    lastName: string
    email: string
    phone: string
    studyInstitution: string
    backgroundDetails: string
    firstChoiceGroupSlug: LaunchGroupSlug | ""
    secondChoiceGroupSlug: LaunchGroupSlug | ""
}

export type VolunteerProspectResponse = {
    registrationId: number
}

export type VolunteerProspectErrorResponse = {
    detail: string
    fieldErrors?: Partial<Record<VolunteerProspectField, string>>
}

export type VolunteerProspectValidationMessages = {
    firstNameRequired: string
    lastNameRequired: string
    emailInvalid: string
    phoneRequired: string
    studyInstitutionRequired: string
    firstChoiceRequired: string
    unsupportedGroup: string
    secondChoiceConflict: string
}

export const volunteerProspectDraftStorageKey = "volunteer-prospect-draft"

export const defaultVolunteerProspectValues: VolunteerProspectValues = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    studyInstitution: "",
    backgroundDetails: "",
    firstChoiceGroupSlug: "",
    secondChoiceGroupSlug: "",
}

const NON_DIGIT_PATTERN = /\D/g

export function validateVolunteerProspectValues(
    values: VolunteerProspectValues,
    messages: VolunteerProspectValidationMessages,
) {
    const fieldErrors: Partial<Record<VolunteerProspectField, string>> = {}

    if (!values.firstName.trim()) fieldErrors.firstName = messages.firstNameRequired
    if (!values.lastName.trim()) fieldErrors.lastName = messages.lastNameRequired

    const normalizedEmail = values.email.trim().toLowerCase()
    if (!normalizedEmail || !isValidEmailAddress(normalizedEmail)) {
        fieldErrors.email = messages.emailInvalid
    }

    if (!values.phone.trim()) fieldErrors.phone = messages.phoneRequired
    if (!values.studyInstitution.trim()) {
        fieldErrors.studyInstitution = messages.studyInstitutionRequired
    }

    if (!values.firstChoiceGroupSlug) {
        fieldErrors.firstChoiceGroupSlug = messages.firstChoiceRequired
    } else if (!getLaunchGroupBySlug("nb", values.firstChoiceGroupSlug)) {
        fieldErrors.firstChoiceGroupSlug = messages.unsupportedGroup
    }

    if (values.secondChoiceGroupSlug && !getLaunchGroupBySlug("nb", values.secondChoiceGroupSlug)) {
        fieldErrors.secondChoiceGroupSlug = messages.unsupportedGroup
    }

    if (
        values.secondChoiceGroupSlug &&
        values.secondChoiceGroupSlug === values.firstChoiceGroupSlug
    ) {
        fieldErrors.secondChoiceGroupSlug = messages.secondChoiceConflict
    }

    return fieldErrors
}

export function normalizeVolunteerPhoneNumber(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return ""

    const withoutTelPrefix = trimmed.replace(/^tel:/i, "")
    const digits = withoutTelPrefix.replace(NON_DIGIT_PATTERN, "")

    if (withoutTelPrefix.startsWith("+") && digits) {
        return `+${digits}`
    }

    if (digits.startsWith("00") && digits.length > 2) {
        return `+${digits.slice(2)}`
    }

    if (digits.length === 8) {
        return `+47${digits}`
    }

    if (digits.startsWith("47") && digits.length === 10) {
        return `+${digits}`
    }

    return trimmed
}

export function buildVolunteerProspectPayload(values: VolunteerProspectValues) {
    return {
        full_name: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
        email: values.email.trim().toLowerCase(),
        phone: normalizeVolunteerPhoneNumber(values.phone),
        study_institution: values.studyInstitution.trim(),
        background_details: values.backgroundDetails.trim() || null,
        first_choice_group_slug: values.firstChoiceGroupSlug || null,
        second_choice_group_slug: values.secondChoiceGroupSlug || "",
    }
}

export function loadVolunteerProspectDraft() {
    if (typeof window === "undefined") {
        return defaultVolunteerProspectValues
    }

    try {
        const raw = window.localStorage.getItem(volunteerProspectDraftStorageKey)
        if (!raw) return defaultVolunteerProspectValues
        const parsed = JSON.parse(raw) as Partial<VolunteerProspectValues>
        return {
            ...defaultVolunteerProspectValues,
            ...parsed,
        }
    } catch {
        return defaultVolunteerProspectValues
    }
}
