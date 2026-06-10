"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  FieldGroup,
  FormSection,
  SelectField,
} from "@/components/ui/form-fields"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

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
  const t = useTranslations("GroupVolunteerForm")
  const hasSubGroups = Boolean(subGroups?.length)
  const [selectedSlug, setSelectedSlug] = useState<string>(
    hasSubGroups ? "" : groupSlug,
  )
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({})
  const [message, setMessage] = useState<{
    status: "success" | "error"
    text: string
  } | null>(null)
  const [isPending, setIsPending] = useState(false)

  function updateField<K extends keyof FormState>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) {
      setFieldErrors(prev => ({ ...prev, [key]: undefined }))
    }
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {}
    if (!form.firstName.trim()) errors.firstName = "Fornavn er påkrevd"
    if (!form.lastName.trim()) errors.lastName = "Etternavn er påkrevd"
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Ugyldig e-postadresse"
    if (!form.phone.trim() || !/\d/.test(form.phone))
      errors.phone = "Telefonnummer er påkrevd"
    if (!form.studyInstitution.trim())
      errors.studyInstitution = "Studiested er påkrevd"
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    if (!validate()) return

    setIsPending(true)

    const payload = {
      full_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim().replace(/\D/g, ""),
      study_institution: form.studyInstitution.trim(),
      first_choice_group_slug: selectedSlug,
      background_details: form.backgroundDetails.trim() || undefined,
    }

    try {
      const response = await fetch("/api/volunteer-prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const detail =
          data && typeof data.detail === "string"
            ? data.detail
            : t("submitErrorFallback")
        setMessage({ status: "error", text: detail })
        return
      }

      setForm(emptyForm)
      setFieldErrors({})
      setMessage({ status: "success", text: t("submittedMessage") })
    } catch {
      setMessage({ status: "error", text: t("submitErrorFallback") })
    } finally {
      setIsPending(false)
    }
  }

  const selectedSubGroupName = subGroups?.find(
    g => g.slug === selectedSlug,
  )?.name
  const formId = `gvf-${groupSlug}`

  return (
    <FormSection number="00" title={t("title")}>
      {hasSubGroups && (
        <FieldGroup>
          <p className="text-sm text-foreground/60">{t("selectSubGroup")}</p>
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
            <p className="text-xs text-foreground/50">
              {t("applyingTo", { group: selectedSubGroupName ?? selectedSlug })}
            </p>
          )}
        </FieldGroup>
      )}

      {(!hasSubGroups || selectedSlug) && (
        <form className="space-y-6" noValidate onSubmit={onSubmit}>
          {!hasSubGroups && (
            <p className="text-sm text-foreground/60">
              {t("applyingTo", { group: groupName })}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <div className="flex items-center gap-1">
                <label
                  className="text-sm font-heading text-foreground"
                  htmlFor={`${formId}-firstName`}
                >
                  {t("firstNameLabel")}
                </label>
                <span className="text-destructive">*</span>
              </div>
              <Input
                id={`${formId}-firstName`}
                value={form.firstName}
                onChange={e => updateField("firstName", e.target.value)}
                autoComplete="given-name"
              />
              {fieldErrors.firstName && (
                <p className="text-sm text-destructive">
                  {fieldErrors.firstName}
                </p>
              )}
            </FieldGroup>

            <FieldGroup>
              <div className="flex items-center gap-1">
                <label
                  className="text-sm font-heading text-foreground"
                  htmlFor={`${formId}-lastName`}
                >
                  {t("lastNameLabel")}
                </label>
                <span className="text-destructive">*</span>
              </div>
              <Input
                id={`${formId}-lastName`}
                value={form.lastName}
                onChange={e => updateField("lastName", e.target.value)}
                autoComplete="family-name"
              />
              {fieldErrors.lastName && (
                <p className="text-sm text-destructive">
                  {fieldErrors.lastName}
                </p>
              )}
            </FieldGroup>

            <FieldGroup>
              <div className="flex items-center gap-1">
                <label
                  className="text-sm font-heading text-foreground"
                  htmlFor={`${formId}-email`}
                >
                  {t("emailLabel")}
                </label>
                <span className="text-destructive">*</span>
              </div>
              <Input
                id={`${formId}-email`}
                type="email"
                value={form.email}
                onChange={e => updateField("email", e.target.value)}
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="text-sm text-destructive">{fieldErrors.email}</p>
              )}
            </FieldGroup>

            <FieldGroup>
              <div className="flex items-center gap-1">
                <label
                  className="text-sm font-heading text-foreground"
                  htmlFor={`${formId}-phone`}
                >
                  {t("phoneLabel")}
                </label>
                <span className="text-destructive">*</span>
              </div>
              <Input
                id={`${formId}-phone`}
                type="tel"
                value={form.phone}
                onChange={e => updateField("phone", e.target.value)}
                placeholder={t("phonePlaceholder")}
                autoComplete="tel"
              />
              {fieldErrors.phone && (
                <p className="text-sm text-destructive">{fieldErrors.phone}</p>
              )}
            </FieldGroup>
          </div>

          <SelectField
            id={`${formId}-institution`}
            label={`${t("studyInstitutionLabel")}`}
            onChange={v => updateField("studyInstitution", v)}
            value={form.studyInstitution}
          >
            <option value="">{t("studyInstitutionPlaceholder")}</option>
            {institutionOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectField>
          {fieldErrors.studyInstitution && (
            <p className="text-sm text-destructive">
              {fieldErrors.studyInstitution}
            </p>
          )}

          <FieldGroup>
            {/* Using raw <label> to avoid double-wrapping since FieldGroup already
                provides spacing; Label component is fine too, but consistent
                fontWeight avoids extra imports */}
            <label
              className="text-sm font-heading text-foreground"
              htmlFor={`${formId}-background`}
            >
              {t("backgroundDetailsLabel")}
            </label>
            <Textarea
              id={`${formId}-background`}
              value={form.backgroundDetails}
              onChange={e => updateField("backgroundDetails", e.target.value)}
              placeholder={t("backgroundDetailsPlaceholder")}
              rows={4}
            />
          </FieldGroup>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("submitPending") : t("submitIdle")}
          </Button>

          {message && (
            <div
              className={`border-2 p-4 ${
                message.status === "success"
                  ? "border-primary bg-primary/5"
                  : "border-destructive bg-destructive/10"
              }`}
            >
              <p
                className={`font-heading text-sm ${
                  message.status === "success"
                    ? "text-primary"
                    : "text-destructive"
                }`}
              >
                {message.status === "success"
                  ? t("successTitle")
                  : t("errorTitle")}
              </p>
              <p className="mt-1 text-sm text-foreground/70">{message.text}</p>
            </div>
          )}
        </form>
      )}
    </FormSection>
  )
}
