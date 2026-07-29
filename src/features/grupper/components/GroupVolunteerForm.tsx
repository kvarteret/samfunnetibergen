"use client"

import { type AnyFieldApi, useForm, useStore } from "@tanstack/react-form"
import { useTranslations } from "next-intl"
import posthog from "posthog-js"
import { type FormEvent, useId, useRef, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  ErrorSummary,
  type ErrorSummaryItem,
} from "@/components/ui/error-summary"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { SelectField } from "@/components/ui/select-field"
import { Textarea } from "@/components/ui/textarea"
import { useFieldAria } from "@/lib/use-field-aria"
import { useFormErrors } from "@/lib/use-form-errors"

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
  friendEmails: string[]
}

const defaultValues: VolunteerFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  studyInstitution: "",
  backgroundDetails: "",
  friendEmails: [],
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function friendFieldId(index: number) {
  return index === 0 ? "gvf-friend-0" : "gvf-friend-1"
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
  const normalizedEmail = values.email.trim().toLowerCase()
  const normalizedFriends = values.friendEmails.map(email =>
    email.trim().toLowerCase(),
  )
  values.friendEmails.forEach((friendEmail, index) => {
    const fieldId = friendFieldId(index)
    if (!friendEmail.trim() || !isEmail(friendEmail)) {
      errors.push({
        fieldId,
        message: t("friendEmailInvalid"),
      })
    } else if (friendEmail.trim().toLowerCase() === normalizedEmail) {
      errors.push({
        fieldId,
        message: t("friendEmailDuplicate"),
      })
    } else if (
      normalizedFriends.findIndex(
        email => email === normalizedFriends[index],
      ) !== index
    ) {
      errors.push({
        fieldId,
        message: t("friendEmailDuplicate"),
      })
    }
  })

  return errors
}

export function GroupVolunteerForm({
  groupSlug,
  groupName,
  subGroups,
  institutionOptions,
}: GroupVolunteerFormProps) {
  const uid = useId()
  const t = useTranslations("GroupVolunteerForm")
  const groupChoices = [
    { slug: groupSlug, name: groupName },
    ...(subGroups ?? []),
  ]
  const hasMultipleGroupChoices = groupChoices.length > 1
  const [selectedSlug, setSelectedSlug] = useState(groupSlug)
  const [secondChoiceSlug, setSecondChoiceSlug] = useState("")
  const [honeypot, setHoneypot] = useState("")

  const selectFirstChoice = (slug: string) => {
    setSelectedSlug(slug)
    if (slug === secondChoiceSlug) setSecondChoiceSlug("")
  }

  const hasStartedRef = useRef(false)
  const markStarted = () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    posthog.capture("volunteer_application_started", {
      first_choice_group_slug: selectedSlug,
    })
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
        friend_emails:
          value.friendEmails.length > 0
            ? value.friendEmails.map(email => email.trim().toLowerCase())
            : undefined,
      }

      const response = await fetch("/api/volunteer-prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, honeypot }),
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

  const values = useStore(form.store, state => state.values)
  const isSubmitting = useStore(form.store, state => state.isSubmitting)
  const isSubmitSuccessful = useStore(
    form.store,
    state => state.isSubmitSuccessful,
  )
  const submitError = useStore(form.store, state => state.errorMap.onSubmit)
  const validationErrors = getValidationErrors(values, fieldIds, t)
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

  if (isSubmitSuccessful) {
    return (
      <FormSection title={t("title")}>
        <Alert variant="success">
          <AlertTitle>{t("successTitle")}</AlertTitle>
          <AlertDescription>{t("submittedMessage")}</AlertDescription>
        </Alert>
      </FormSection>
    )
  }

  return (
    <FormSection title={t("title")}>
      {hasMultipleGroupChoices && (
        <FieldGroup>
          <p className="text-foreground-muted">{t("selectSubGroup")}</p>
          <SegmentedControl
            onValueChange={selectFirstChoice}
            options={groupChoices.map(group => ({
              value: group.slug,
              label: group.name,
            }))}
            value={selectedSlug}
          />
          <p className="text-sm text-foreground-muted">
            {t("applyingTo", {
              group:
                groupChoices.find(group => group.slug === selectedSlug)?.name ??
                selectedSlug,
            })}
          </p>
          <SelectField
            className="max-w-72"
            id="volunteer-second-choice"
            label={t("secondChoiceLabel")}
            onChange={setSecondChoiceSlug}
            options={groupChoices
              .filter(group => group.slug !== selectedSlug)
              .map(group => ({ value: group.slug, label: group.name }))}
            placeholder={t("secondChoicePlaceholder")}
            value={secondChoiceSlug}
          />
        </FieldGroup>
      )}

      {selectedSlug && (
        <form
          className="space-y-6"
          noValidate
          onFocusCapture={markStarted}
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
          {!hasMultipleGroupChoices && (
            <p className="text-foreground-muted">
              {t("applyingTo", { group: groupName })}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup
              error={errorFor(fieldIds.firstName)}
              errorId={`${fieldIds.firstName}-error`}
            >
              <div className="flex items-center gap-1">
                <Label htmlFor={fieldIds.firstName}>
                  {t("firstNameLabel")}
                </Label>
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
            </FieldGroup>

            <FieldGroup
              error={errorFor(fieldIds.lastName)}
              errorId={`${fieldIds.lastName}-error`}
            >
              <div className="flex items-center gap-1">
                <Label htmlFor={fieldIds.lastName}>{t("lastNameLabel")}</Label>
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
            </FieldGroup>

            <FieldGroup
              error={errorFor(fieldIds.email)}
              errorId={`${fieldIds.email}-error`}
            >
              <div className="flex items-center gap-1">
                <Label htmlFor={fieldIds.email}>{t("emailLabel")}</Label>
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
            </FieldGroup>

            <FieldGroup
              error={errorFor(fieldIds.phone)}
              errorId={`${fieldIds.phone}-error`}
            >
              <div className="flex items-center gap-1">
                <Label htmlFor={fieldIds.phone}>{t("phoneLabel")}</Label>
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
                options={institutionOptions}
                placeholder={t("studyInstitutionPlaceholder")}
                value={field.state.value as string}
              />
            )}
          </form.Field>

          <form.Field name="backgroundDetails">
            {(field: AnyFieldApi) => (
              <FieldGroup>
                <Label htmlFor={fieldIds.backgroundDetails}>
                  {t("backgroundDetailsLabel")}
                </Label>
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

          <form.Field name="friendEmails">
            {(field: AnyFieldApi) => {
              const friendEmails = field.state.value as string[]

              return (
                <FieldGroup>
                  <div className="space-y-1">
                    <p className="font-heading text-foreground">
                      {t("friendSignupLabel")}
                    </p>
                    <p className=" text-foreground-muted">
                      {t("friendSignupHelp")}
                    </p>
                  </div>

                  {friendEmails.map((friendEmail, index) => {
                    const fieldId = friendFieldId(index)
                    const error = errorFor(fieldId)

                    return (
                      <div className="space-y-2" key={fieldId}>
                        <div className="flex items-end gap-2">
                          <FieldGroup
                            className="min-w-0 flex-1"
                            error={error}
                            errorId={`${fieldId}-error`}
                          >
                            <Label htmlFor={fieldId}>
                              {t("friendEmailLabel", { number: index + 1 })}
                            </Label>
                            <Input
                              aria-describedby={
                                error ? `${fieldId}-error` : undefined
                              }
                              aria-invalid={!!error}
                              autoComplete="email"
                              id={fieldId}
                              onChange={event =>
                                field.handleChange(
                                  friendEmails.map((email, emailIndex) =>
                                    emailIndex === index
                                      ? event.target.value
                                      : email,
                                  ),
                                )
                              }
                              placeholder={t("friendEmailPlaceholder")}
                              type="email"
                              value={friendEmail}
                            />
                          </FieldGroup>
                          <Button
                            onClick={() =>
                              field.handleChange(
                                friendEmails.filter(
                                  (_, emailIndex) => emailIndex !== index,
                                ),
                              )
                            }
                            type="button"
                            variant="neutral"
                          >
                            {t("removeFriend")}
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  {friendEmails.length < 2 && (
                    <Button
                      className="w-fit"
                      onClick={() => field.handleChange([...friendEmails, ""])}
                      type="button"
                      variant="neutral"
                    >
                      {t("addFriend")}
                    </Button>
                  )}
                </FieldGroup>
              )
            }}
          </form.Field>

          {/* Honeypot — invisible to humans, filled by bots. */}
          <input
            aria-hidden="true"
            autoComplete="off"
            className="absolute opacity-0 pointer-events-none h-0 w-0"
            id={`${uid}-hp`}
            name="honeypot"
            onChange={e => setHoneypot(e.target.value)}
            tabIndex={-1}
            type="text"
            value={honeypot}
          />

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? t("submitPending") : t("submitIdle")}
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
