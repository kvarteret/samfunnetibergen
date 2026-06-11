"use client"

import { useForm, type AnyFieldApi } from "@tanstack/react-form"
import { useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  ErrorSummary,
  type ErrorSummaryItem,
} from "@/components/ui/error-summary"
import { useFormErrors } from "@/lib/use-form-errors"
import { FieldError } from "@/components/ui/field-error"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { SelectField } from "@/components/ui/select-field"
import { Textarea } from "@/components/ui/textarea"
import { useFieldAria } from "@/lib/use-field-aria"

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

type VolunteerFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  studyInstitution: string
  backgroundDetails: string
}

const defaultValues: VolunteerFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  studyInstitution: "",
  backgroundDetails: "",
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function getValidationErrors(
  values: VolunteerFormValues,
  fieldIds: Record<string, string>,
  t: ReturnType<typeof useTranslations<"GroupVolunteerForm">>,
): ErrorSummaryItem[] {
  const errors: ErrorSummaryItem[] = []

  if (!values.firstName.trim()) {
    errors.push({
      fieldId: fieldIds.firstName,
      message: `${t("firstNameLabel")} er påkrevd`,
    })
  }
  if (!values.lastName.trim()) {
    errors.push({
      fieldId: fieldIds.lastName,
      message: `${t("lastNameLabel")} er påkrevd`,
    })
  }
  if (!values.email.trim() || !isEmail(values.email)) {
    errors.push({ fieldId: fieldIds.email, message: "Ugyldig e-postadresse" })
  }
  if (!values.phone.trim() || !/\d/.test(values.phone)) {
    errors.push({
      fieldId: fieldIds.phone,
      message: "Telefonnummer er påkrevd",
    })
  }
  if (!values.studyInstitution.trim()) {
    errors.push({
      fieldId: fieldIds.studyInstitution,
      message: "Studiested er påkrevd",
    })
  }

  return errors
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
  const [secondChoiceSlug, setSecondChoiceSlug] = useState("")
  const slugSelected = !hasSubGroups || selectedSlug !== ""

  const selectFirstChoice = (slug: string) => {
    setSelectedSlug(slug)
    if (slug === secondChoiceSlug) setSecondChoiceSlug("")
  }

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const payload = {
        full_name: `${value.firstName.trim()} ${value.lastName.trim()}`,
        email: value.email.trim().toLowerCase(),
        phone: value.phone.trim().replace(/\D/g, ""),
        study_institution: value.studyInstitution.trim(),
        first_choice_group_slug: selectedSlug,
        second_choice_group_slug: secondChoiceSlug || undefined,
        background_details: value.backgroundDetails.trim() || undefined,
      }

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
        throw new Error(detail)
      }
    },
  })

  const fieldIds = {
    firstName: "gvf-firstName",
    lastName: "gvf-lastName",
    email: "gvf-email",
    phone: "gvf-phone",
    studyInstitution: "gvf-institution",
    backgroundDetails: "gvf-background",
  }

  const validationErrors = getValidationErrors(form.state.values, fieldIds, t)
  const { visibleErrors, markSubmitAttempt, errorFor } =
    useFormErrors(validationErrors)

  const aria = {
    firstName: useFieldAria(fieldIds.firstName, errorFor(fieldIds.firstName)),
    lastName: useFieldAria(fieldIds.lastName, errorFor(fieldIds.lastName)),
    email: useFieldAria(fieldIds.email, errorFor(fieldIds.email)),
    phone: useFieldAria(fieldIds.phone, errorFor(fieldIds.phone)),
    studyInstitution: useFieldAria(
      fieldIds.studyInstitution,
      errorFor(fieldIds.studyInstitution),
    ),
  }

  const submitError = form.state.errorMap.onSubmit

  if (form.state.isSubmitSuccessful) {
    return (
      <FormSection number="00" title={t("title")}>
        <Alert variant="success">
          <AlertTitle>{t("successTitle")}</AlertTitle>
          <AlertDescription>{t("submittedMessage")}</AlertDescription>
        </Alert>
      </FormSection>
    )
  }

  return (
    <FormSection number="00" title={t("title")}>
      {hasSubGroups && (
        <FieldGroup>
          <p className="text-sm text-foreground-subtle">
            {t("selectSubGroup")}
          </p>
          <SegmentedControl
            onChange={selectFirstChoice}
            options={subGroups!.map(sub => ({
              value: sub.slug,
              label: sub.name,
            }))}
            value={selectedSlug}
          />
          {selectedSlug && (
            <p className="text-xs text-foreground-faint">
              {t("applyingTo", {
                group:
                  subGroups!.find(g => g.slug === selectedSlug)?.name ??
                  selectedSlug,
              })}
            </p>
          )}
          {selectedSlug && subGroups!.length > 1 && (
            <SelectField
              className="max-w-72"
              id="volunteer-second-choice"
              label={t("secondChoiceLabel")}
              onChange={setSecondChoiceSlug}
              options={subGroups!
                .filter(sub => sub.slug !== selectedSlug)
                .map(sub => ({ value: sub.slug, label: sub.name }))}
              placeholder={t("secondChoicePlaceholder")}
              value={secondChoiceSlug}
            />
          )}
        </FieldGroup>
      )}

      {slugSelected && (
        <form
          className="space-y-6"
          noValidate
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            markSubmitAttempt()
            if (validationErrors.length > 0) return
            form.handleSubmit()
          }}
        >
          {visibleErrors.length > 0 && (
            <ErrorSummary className="max-w-3xl" errors={visibleErrors} />
          )}
          {!hasSubGroups && (
            <p className="text-sm text-foreground-subtle">
              {t("applyingTo", { group: groupName })}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup
              error={errorFor(fieldIds.firstName)}
              errorId={`${fieldIds.firstName}-error`}
            >
              <div className="flex items-center gap-1">
                <label
                  className="text-sm font-heading text-foreground"
                  htmlFor={fieldIds.firstName}
                >
                  {t("firstNameLabel")}
                </label>
                <span className="text-destructive">*</span>
              </div>
              <form.Field name="firstName">
                {(field: AnyFieldApi) => (
                  <Input
                    {...aria.firstName}
                    autoComplete="given-name"
                    id={fieldIds.firstName}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    value={field.state.value as string}
                  />
                )}
              </form.Field>
              {errorFor(fieldIds.firstName) && (
                <FieldError id={`${fieldIds.firstName}-error`}>
                  {errorFor(fieldIds.firstName)}
                </FieldError>
              )}
            </FieldGroup>

            <FieldGroup
              error={errorFor(fieldIds.lastName)}
              errorId={`${fieldIds.lastName}-error`}
            >
              <div className="flex items-center gap-1">
                <label
                  className="text-sm font-heading text-foreground"
                  htmlFor={fieldIds.lastName}
                >
                  {t("lastNameLabel")}
                </label>
                <span className="text-destructive">*</span>
              </div>
              <form.Field name="lastName">
                {(field: AnyFieldApi) => (
                  <Input
                    {...aria.lastName}
                    autoComplete="family-name"
                    id={fieldIds.lastName}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    value={field.state.value as string}
                  />
                )}
              </form.Field>
              {errorFor(fieldIds.lastName) && (
                <FieldError id={`${fieldIds.lastName}-error`}>
                  {errorFor(fieldIds.lastName)}
                </FieldError>
              )}
            </FieldGroup>

            <FieldGroup
              error={errorFor(fieldIds.email)}
              errorId={`${fieldIds.email}-error`}
            >
              <div className="flex items-center gap-1">
                <label
                  className="text-sm font-heading text-foreground"
                  htmlFor={fieldIds.email}
                >
                  {t("emailLabel")}
                </label>
                <span className="text-destructive">*</span>
              </div>
              <form.Field name="email">
                {(field: AnyFieldApi) => (
                  <Input
                    {...aria.email}
                    autoComplete="email"
                    id={fieldIds.email}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    type="email"
                    value={field.state.value as string}
                  />
                )}
              </form.Field>
              {errorFor(fieldIds.email) && (
                <FieldError id={`${fieldIds.email}-error`}>
                  {errorFor(fieldIds.email)}
                </FieldError>
              )}
            </FieldGroup>

            <FieldGroup
              error={errorFor(fieldIds.phone)}
              errorId={`${fieldIds.phone}-error`}
            >
              <div className="flex items-center gap-1">
                <label
                  className="text-sm font-heading text-foreground"
                  htmlFor={fieldIds.phone}
                >
                  {t("phoneLabel")}
                </label>
                <span className="text-destructive">*</span>
              </div>
              <form.Field name="phone">
                {(field: AnyFieldApi) => (
                  <Input
                    {...aria.phone}
                    autoComplete="tel"
                    className="max-w-48"
                    id={fieldIds.phone}
                    inputMode="tel"
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t("phonePlaceholder")}
                    type="tel"
                    value={field.state.value as string}
                  />
                )}
              </form.Field>
              {errorFor(fieldIds.phone) && (
                <FieldError id={`${fieldIds.phone}-error`}>
                  {errorFor(fieldIds.phone)}
                </FieldError>
              )}
            </FieldGroup>
          </div>

          <form.Field name="studyInstitution">
            {(field: AnyFieldApi) => (
              <SelectField
                error={errorFor(fieldIds.studyInstitution)}
                errorId={`${fieldIds.studyInstitution}-error`}
                id={fieldIds.studyInstitution}
                label={`${t("studyInstitutionLabel")}`}
                onChange={v => field.handleChange(v)}
                value={field.state.value as string}
              >
                <option value="">{t("studyInstitutionPlaceholder")}</option>
                {institutionOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectField>
            )}
          </form.Field>

          <form.Field name="backgroundDetails">
            {(field: AnyFieldApi) => (
              <FieldGroup>
                <label
                  className="text-sm font-heading text-foreground"
                  htmlFor={fieldIds.backgroundDetails}
                >
                  {t("backgroundDetailsLabel")}
                </label>
                <Textarea
                  id={fieldIds.backgroundDetails}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder={t("backgroundDetailsPlaceholder")}
                  rows={4}
                  value={field.state.value as string}
                />
              </FieldGroup>
            )}
          </form.Field>

          <Button
            type="submit"
            className="w-full"
            disabled={form.state.isSubmitting}
          >
            {form.state.isSubmitting ? t("submitPending") : t("submitIdle")}
          </Button>

          {submitError && (
            <Alert variant="destructive">
              <AlertTitle>{t("errorTitle")}</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
        </form>
      )}
    </FormSection>
  )
}
