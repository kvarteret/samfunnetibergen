"use client"

import { useLocale, useTranslations } from "next-intl"
import { posthog } from "posthog-js"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { normalizeVolunteerPhoneNumber } from "@/features/blifrivillig/prospect"
import { isValidEmailAddress } from "@/lib/contact"
import type { VolunteerFormMessage } from "../shared"
import { FieldError, RequiredLabel, VolunteerFormMessageAlert } from "../shared"

type SubGroup = {
    slug: string
    name: string
}

type InstitutionOption = {
    value: string
    label: string
}

type GroupVolunteerFormProps = {
    groupSlug: string
    groupName: string
    subGroups?: SubGroup[]
    institutionOptions: InstitutionOption[]
}

type FormState = {
    firstName: string
    lastName: string
    email: string
    phone: string
    studyInstitution: string
    backgroundDetails: string
}

const emptyForm: FormState = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    studyInstitution: "",
    backgroundDetails: "",
}

export function GroupVolunteerForm({
    groupSlug,
    groupName,
    subGroups,
    institutionOptions,
}: GroupVolunteerFormProps) {
    const locale = useLocale()
    const t = useTranslations("GroupVolunteerForm")
    const tValidation = useTranslations("Validation")

    const hasSubGroups = Boolean(subGroups?.length)
    const [selectedSlug, setSelectedSlug] = useState<string>(hasSubGroups ? "" : groupSlug)
    const [form, setForm] = useState<FormState>(emptyForm)
    const [friendEmails, setFriendEmails] = useState<string[]>([])
    const [friendEmailErrors, setFriendEmailErrors] = useState<Record<string, string>>({})
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({})
    const [formMessage, setFormMessage] = useState<VolunteerFormMessage | null>(null)
    const [isPending, setIsPending] = useState(false)

    function updateField<K extends keyof FormState>(key: K, value: string) {
        setForm(prev => ({ ...prev, [key]: value }))
        if (fieldErrors[key]) {
            setFieldErrors(prev => ({ ...prev, [key]: undefined }))
        }
    }

    function addFriend() {
        if (friendEmails.length < 2) {
            setFriendEmails(prev => [...prev, ""])
        }
    }

    function updateFriend(index: number, value: string) {
        setFriendEmails(prev => prev.map((e, i) => (i === index ? value : e)))
        if (friendEmailErrors[String(index)]) {
            setFriendEmailErrors(prev => {
                const next = { ...prev }
                delete next[String(index)]
                return next
            })
        }
    }

    function removeFriend(index: number) {
        setFriendEmails(prev => prev.filter((_, i) => i !== index))
        setFriendEmailErrors(prev => {
            const next: Record<string, string> = {}
            Object.entries(prev).forEach(([k, v]) => {
                const n = Number(k)
                if (n < index) next[String(n)] = v
                else if (n > index) next[String(n - 1)] = v
            })
            return next
        })
    }

    function validate(): boolean {
        const errors: Partial<Record<keyof FormState, string>> = {}
        if (!form.firstName.trim()) errors.firstName = tValidation("firstNameRequired")
        if (!form.lastName.trim()) errors.lastName = tValidation("lastNameRequired")
        if (!isValidEmailAddress(form.email.trim().toLowerCase()))
            errors.email = tValidation("emailInvalid")
        if (!form.phone.trim() || !/\d/.test(form.phone))
            errors.phone = tValidation("phoneRequired")
        if (!form.studyInstitution.trim())
            errors.studyInstitution = tValidation("studyInstitutionRequired")
        setFieldErrors(errors)

        const friendErrors: Record<string, string> = {}
        const seen = new Set([form.email.trim().toLowerCase()])
        friendEmails.forEach((email, index) => {
            const normalized = email.trim().toLowerCase()
            if (!normalized) return
            if (!isValidEmailAddress(normalized)) {
                friendErrors[String(index)] = tValidation("friendEmailInvalid")
            } else if (seen.has(normalized)) {
                friendErrors[String(index)] = tValidation("friendEmailDuplicate")
            }
            seen.add(normalized)
        })
        setFriendEmailErrors(friendErrors)

        return Object.keys(errors).length === 0 && Object.keys(friendErrors).length === 0
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setFormMessage(null)

        if (!validate()) return

        setIsPending(true)

        const distinctId = posthog.get_distinct_id()?.trim()
        const payload = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim().toLowerCase(),
            phone: normalizeVolunteerPhoneNumber(form.phone),
            studyInstitution: form.studyInstitution.trim(),
            backgroundDetails: form.backgroundDetails.trim(),
            firstChoiceGroupSlug: selectedSlug,
            secondChoiceGroupSlug: "",
            friendEmails: friendEmails.map(e => e.trim().toLowerCase()).filter(isValidEmailAddress),
        }

        try {
            const response = await fetch("/api/volunteer-prospects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept-Language": locale,
                    ...(distinctId ? { "x-posthog-distinct-id": distinctId } : {}),
                    "x-posthog-session-id": posthog.get_session_id() ?? "",
                },
                body: JSON.stringify(payload),
            })

            const data = (await response.json().catch(() => null)) as Record<string, unknown> | null

            if (!response.ok) {
                const detail =
                    data && typeof data.detail === "string" ? data.detail : t("submitErrorFallback")
                setFormMessage({ status: "error", message: detail })
                return
            }

            posthog.capture("volunteer_form_submitted", {
                first_choice_group: selectedSlug,
                source: "group_page",
            })

            setForm(emptyForm)
            setFriendEmails([])
            setFieldErrors({})
            setFriendEmailErrors({})
            setFormMessage({ status: "success", message: t("submittedMessage") })
        } catch {
            setFormMessage({ status: "error", message: t("submitErrorFallback") })
        } finally {
            setIsPending(false)
        }
    }

    const selectedSubGroupName = subGroups?.find(g => g.slug === selectedSlug)?.name

    return (
        <div className="space-y-4">
            <h2 className="font-heading text-xl text-foreground">{t("title")}</h2>

            {hasSubGroups && (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t("selectSubGroup")}</p>
                    <div className="flex flex-wrap gap-2">
                        {subGroups!.map(sub => (
                            <button
                                key={sub.slug}
                                type="button"
                                onClick={() => setSelectedSlug(sub.slug)}
                                className={`border-2 px-3 py-1.5 font-heading text-sm transition-colors ${
                                    selectedSlug === sub.slug
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-background text-foreground hover:border-primary"
                                }`}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>
                    {selectedSlug && (
                        <p className="text-xs text-muted-foreground">
                            {t("applyingTo", { group: selectedSubGroupName ?? selectedSlug })}
                        </p>
                    )}
                </div>
            )}

            {(!hasSubGroups || selectedSlug) && (
                <form onSubmit={onSubmit} className="space-y-4">
                    {!hasSubGroups && (
                        <p className="text-sm text-muted-foreground">
                            {t("applyingTo", { group: groupName })}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="gvf-firstName">
                                {t("firstNameLabel")}
                            </RequiredLabel>
                            <Input
                                id="gvf-firstName"
                                value={form.firstName}
                                onChange={e => updateField("firstName", e.target.value)}
                                autoComplete="given-name"
                            />
                            <FieldError message={fieldErrors.firstName} />
                        </div>
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="gvf-lastName">
                                {t("lastNameLabel")}
                            </RequiredLabel>
                            <Input
                                id="gvf-lastName"
                                value={form.lastName}
                                onChange={e => updateField("lastName", e.target.value)}
                                autoComplete="family-name"
                            />
                            <FieldError message={fieldErrors.lastName} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="gvf-email">{t("emailLabel")}</RequiredLabel>
                            <Input
                                id="gvf-email"
                                type="email"
                                value={form.email}
                                onChange={e => updateField("email", e.target.value)}
                                placeholder={t("emailPlaceholder")}
                                autoComplete="email"
                            />
                            <FieldError message={fieldErrors.email} />
                        </div>
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="gvf-phone">{t("phoneLabel")}</RequiredLabel>
                            <Input
                                id="gvf-phone"
                                type="tel"
                                value={form.phone}
                                onChange={e => updateField("phone", e.target.value)}
                                onBlur={e =>
                                    updateField(
                                        "phone",
                                        normalizeVolunteerPhoneNumber(e.target.value),
                                    )
                                }
                                placeholder={t("phonePlaceholder")}
                                autoComplete="tel"
                            />
                            <FieldError message={fieldErrors.phone} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <RequiredLabel htmlFor="gvf-institution">
                            {t("studyInstitutionLabel")}
                        </RequiredLabel>
                        <select
                            id="gvf-institution"
                            value={form.studyInstitution}
                            onChange={e => updateField("studyInstitution", e.target.value)}
                            className="flex h-10 w-full border-2 border-border bg-secondary-background px-3 py-2 text-sm text-foreground shadow-shadow focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                            <option value="">{t("studyInstitutionPlaceholder")}</option>
                            {institutionOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <FieldError message={fieldErrors.studyInstitution} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gvf-background">{t("backgroundDetailsLabel")}</Label>
                        <Textarea
                            id="gvf-background"
                            value={form.backgroundDetails}
                            onChange={e => updateField("backgroundDetails", e.target.value)}
                            placeholder={t("backgroundDetailsPlaceholder")}
                            rows={4}
                        />
                    </div>

                    <section className="space-y-3 border-t-2 border-border pt-4">
                        <div className="space-y-1">
                            <Label>{t("friendSignupLabel")}</Label>
                            <p className="text-sm leading-6 text-foreground/75">
                                {t("friendSignupHelp")}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {friendEmails.map((email, index) => (
                                <div
                                    key={index}
                                    className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                                >
                                    <div className="space-y-2">
                                        <Input
                                            type="email"
                                            aria-label={t("friendEmailLabel", {
                                                number: index + 1,
                                            })}
                                            value={email}
                                            onChange={e => updateFriend(index, e.target.value)}
                                            placeholder={t("friendEmailPlaceholder")}
                                        />
                                        <FieldError message={friendEmailErrors[String(index)]} />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="neutral"
                                        size="icon"
                                        aria-label={t("removeFriend")}
                                        onClick={() => removeFriend(index)}
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {friendEmails.length < 2 && (
                            <Button type="button" variant="neutral" onClick={addFriend}>
                                {t("addFriend")}
                            </Button>
                        )}
                    </section>

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? t("submitPending") : t("submitIdle")}
                    </Button>

                    <VolunteerFormMessageAlert
                        formMessage={formMessage}
                        successTitle={t("successTitle")}
                        errorTitle={t("errorTitle")}
                    />
                </form>
            )}
        </div>
    )
}
