import type { VolunteerGroupSlug } from "@/features/blifrivillig/content"
import { isValidEmailAddress } from "@/lib/contact"

export type VolunteerProspectField =
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "studyInstitution"
    | "backgroundDetails"
    | "firstChoiceGroupSlug"
    | "secondChoiceGroupSlug"
    | "friendEmails"

export type VolunteerProspectValues = {
    firstName: string
    lastName: string
    email: string
    phone: string
    studyInstitution: string
    backgroundDetails: string
    firstChoiceGroupSlug: VolunteerGroupSlug | ""
    secondChoiceGroupSlug: VolunteerGroupSlug | ""
    friendEmails: string[]
}

export type VolunteerProspectResponse = {
    registrationId: number
}

export type VolunteerProspectErrorResponse = {
    detail: string
    fieldErrors?: Partial<Record<VolunteerProspectField, string | Record<string, string>>>
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
    friendEmailInvalid: string
    friendEmailDuplicate: string
    friendEmailMax: string
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
    friendEmails: [],
}

const NON_DIGIT_PATTERN = /\D/g

export function validateVolunteerProspectValues(
    values: VolunteerProspectValues,
    messages: VolunteerProspectValidationMessages,
    validGroupSlugs: ReadonlyArray<string>,
) {
    const fieldErrors: Partial<Record<VolunteerProspectField, string>> = {}

    if (!values.firstName.trim()) fieldErrors.firstName = messages.firstNameRequired
    if (!values.lastName.trim()) fieldErrors.lastName = messages.lastNameRequired

    const normalizedEmail = values.email.trim().toLowerCase()
    if (!normalizedEmail || !isValidEmailAddress(normalizedEmail)) {
        fieldErrors.email = messages.emailInvalid
    }

    if (!values.phone.trim() || !/\d/.test(values.phone)) fieldErrors.phone = messages.phoneRequired
    if (!values.studyInstitution.trim()) {
        fieldErrors.studyInstitution = messages.studyInstitutionRequired
    }

    if (!values.firstChoiceGroupSlug) {
        fieldErrors.firstChoiceGroupSlug = messages.firstChoiceRequired
    } else if (!validGroupSlugs.includes(values.firstChoiceGroupSlug)) {
        fieldErrors.firstChoiceGroupSlug = messages.unsupportedGroup
    }

    if (values.secondChoiceGroupSlug && !validGroupSlugs.includes(values.secondChoiceGroupSlug)) {
        fieldErrors.secondChoiceGroupSlug = messages.unsupportedGroup
    }

    if (
        values.secondChoiceGroupSlug &&
        values.secondChoiceGroupSlug === values.firstChoiceGroupSlug
    ) {
        fieldErrors.secondChoiceGroupSlug = messages.secondChoiceConflict
    }

    const normalizedFriendEmails = values.friendEmails
        .map(email => email.trim().toLowerCase())
        .filter(Boolean)
    if (normalizedFriendEmails.length > 2) {
        fieldErrors.friendEmails = messages.friendEmailMax
    } else {
        const seenEmails = new Set<string>([normalizedEmail].filter(Boolean))
        const friendErrors: Record<string, string> = {}
        normalizedFriendEmails.forEach((email, index) => {
            if (!isValidEmailAddress(email)) {
                friendErrors[String(index)] = messages.friendEmailInvalid
            } else if (seenEmails.has(email)) {
                friendErrors[String(index)] = messages.friendEmailDuplicate
            }
            seenEmails.add(email)
        })
        if (Object.keys(friendErrors).length > 0) {
            fieldErrors.friendEmails = friendErrors
        }
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
        friend_emails: values.friendEmails.map(email => email.trim().toLowerCase()).filter(Boolean),
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
            friendEmails: Array.isArray(parsed.friendEmails) ? parsed.friendEmails : [],
        }
    } catch {
        return defaultVolunteerProspectValues
    }
}
