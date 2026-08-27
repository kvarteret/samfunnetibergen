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
import { PhoneNumberField } from "@/components/ui/phone-number-field"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { SelectField } from "@/components/ui/select-field"
import { Textarea } from "@/components/ui/textarea"
import { getFormValidationIssues } from "@/lib/form-validation-errors"
import { useFieldAria } from "@/lib/use-field-aria"
import { useFormErrors } from "@/lib/use-form-errors"
import {
  VOLUNTEER_FORM_LIMITS,
  type VolunteerFormValues,
  volunteerFormSchema,
} from "../domain/volunteerFormSchema"

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

const defaultValues: VolunteerFormValues = {
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

type SubmissionIdentity = {
  fingerprint: string
  idempotencyKey: string
}

function friendFieldId(index: number) {
  return index === 0 ? "gvf-friend-0" : "gvf-friend-1"
}

export function GroupVolunteerForm({
  groupSlug,
  groupName,
  subGroups,
  institutionOptions,
}: GroupVolunteerFormProps) {
  const uid = useId()
  const t = useTranslations("GroupVolunteerForm")
  const tv = useTranslations("Validation")
  const groupChoices = [
    { slug: groupSlug, name: groupName },
    ...(subGroups ?? []),
  ]
  const hasMultipleGroupChoices = groupChoices.length > 1
  const [honeypot, setHoneypot] = useState("")
  const submissionIdentityRef = useRef<SubmissionIdentity | null>(null)

  const form = useForm({
    defaultValues: { ...defaultValues, firstChoiceGroupSlug: groupSlug },
    validators: {
      onChange: volunteerFormSchema,
      onSubmit: volunteerFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const body = JSON.stringify({ ...value, honeypot })
      if (submissionIdentityRef.current?.fingerprint !== body) {
        submissionIdentityRef.current = {
          fingerprint: body,
          idempotencyKey: crypto.randomUUID(),
        }
      }
      const response = await fetch("/api/volunteer-prospects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kvarteret-Idempotency-Key":
            submissionIdentityRef.current.idempotencyKey,
        },
        body,
      })

      if (!response.ok) {
        const detail =
          response.status === 429
            ? t("submitRateLimited", {
                minutes: Math.max(
                  1,
                  Math.ceil(Number(response.headers.get("retry-after")) / 60) ||
                    1,
                ),
              })
            : await response
                .json()
                .then(data =>
                  data && typeof data.detail === "string"
                    ? data.detail
                    : t("submitErrorFallback"),
                )
                .catch(() => t("submitErrorFallback"))
        formApi.setErrorMap({ onServer: detail })
        throw new Error(detail)
      }
    },
  })

  const selectedSlug = useStore(
    form.store,
    state => state.values.firstChoiceGroupSlug,
  )
  const secondChoiceSlug = useStore(
    form.store,
    state => state.values.secondChoiceGroupSlug,
  )

  const selectFirstChoice = (slug: string) => {
    form.setFieldValue("firstChoiceGroupSlug", slug)
    if (slug === form.state.values.secondChoiceGroupSlug) {
      form.setFieldValue("secondChoiceGroupSlug", "")
    }
  }

  const hasStartedRef = useRef(false)
  const markStarted = () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    posthog.capture("volunteer_application_started", {
      first_choice_group_slug: selectedSlug,
    })
  }

  const fieldIds = {
    firstName: "gvf-firstName",
    lastName: "gvf-lastName",
    email: "gvf-email",
    phone: "gvf-phone",
    studyInstitution: "gvf-institution",
    backgroundDetails: "gvf-background",
    firstChoiceGroupSlug: "volunteer-first-choice",
    secondChoiceGroupSlug: "volunteer-second-choice",
  }

  const isSubmitting = useStore(form.store, state => state.isSubmitting)
  const isSubmitSuccessful = useStore(
    form.store,
    state => state.isSubmitSuccessful,
  )
  const errorMap = useStore(form.store, state => state.errorMap)
  const submitError =
    typeof errorMap.onServer === "string" ? errorMap.onServer : undefined
  const validationErrors: ErrorSummaryItem[] = getFormValidationIssues(
    errorMap.onChange,
    errorMap.onSubmit,
  ).map(issue => ({
    fieldId: volunteerFieldId(issue.path, fieldIds),
    message: translateValidationMessage(issue.message, tv),
  }))
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
    backgroundDetails: useFieldAria(
      fieldIds.backgroundDetails,
      errorFor(fieldIds.backgroundDetails),
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
        <FieldGroup
          error={errorFor(fieldIds.firstChoiceGroupSlug)}
          errorId={`${fieldIds.firstChoiceGroupSlug}-error`}
        >
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
            error={errorFor(fieldIds.secondChoiceGroupSlug)}
            errorId={`${fieldIds.secondChoiceGroupSlug}-error`}
            id="volunteer-second-choice"
            label={t("secondChoiceLabel")}
            onChange={slug => form.setFieldValue("secondChoiceGroupSlug", slug)}
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
            form.setErrorMap({ onServer: undefined })
            void form.handleSubmit().catch(() => {
              if (form.state.errorMap.onServer) return
              form.setErrorMap({ onServer: t("submitErrorFallback") as never })
              posthog.captureException(
                new Error("Unexpected volunteer application failure"),
                {
                  form_id: "volunteer_application",
                  validation_stage: "client",
                  failure_branch: "unexpected_submission_failure",
                },
              )
            })
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
                    aria-describedby={aria.firstName.describedby}
                    aria-invalid={aria.firstName.invalid}
                    autoComplete="given-name"
                    id={fieldIds.firstName}
                    maxLength={VOLUNTEER_FORM_LIMITS.firstName}
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
                    aria-describedby={aria.lastName.describedby}
                    aria-invalid={aria.lastName.invalid}
                    autoComplete="family-name"
                    id={fieldIds.lastName}
                    maxLength={VOLUNTEER_FORM_LIMITS.lastName}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    value={field.state.value as string}
                  />
                )}
              </form.Field>
            </FieldGroup>

            <FieldGroup
              className="col-span-2"
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
                    aria-describedby={aria.email.describedby}
                    aria-invalid={aria.email.invalid}
                    autoComplete="email"
                    id={fieldIds.email}
                    maxLength={VOLUNTEER_FORM_LIMITS.email}
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
              className="col-span-2"
              error={errorFor(fieldIds.phone)}
              errorId={`${fieldIds.phone}-error`}
            >
              <div className="flex items-center gap-1">
                <Label htmlFor={fieldIds.phone}>{t("phoneLabel")}</Label>
                <span className="text-destructive">*</span>
              </div>
              <form.Field name="phone">
                {(field: AnyFieldApi) => (
                  <PhoneNumberField
                    describedBy={aria.phone.describedby}
                    error={aria.phone.invalid}
                    id={fieldIds.phone}
                    onBlur={field.handleBlur}
                    onChange={value => field.handleChange(value)}
                    placeholder={t("phonePlaceholder")}
                    required
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
              <FieldGroup
                error={errorFor(fieldIds.backgroundDetails)}
                errorId={`${fieldIds.backgroundDetails}-error`}
              >
                <Label htmlFor={fieldIds.backgroundDetails}>
                  {t("backgroundDetailsLabel")}
                </Label>
                <Textarea
                  aria-describedby={aria.backgroundDetails.describedby}
                  aria-invalid={aria.backgroundDetails.invalid}
                  id={fieldIds.backgroundDetails}
                  maxLength={VOLUNTEER_FORM_LIMITS.backgroundDetails}
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
                              maxLength={VOLUNTEER_FORM_LIMITS.email}
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
            maxLength={VOLUNTEER_FORM_LIMITS.honeypot}
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

function volunteerFieldId(
  path: string,
  fieldIds: Record<string, string>,
): string {
  if (path === "firstName") return fieldIds.firstName
  if (path === "lastName") return fieldIds.lastName
  if (path === "email") return fieldIds.email
  if (path === "phone") return fieldIds.phone
  if (path === "studyInstitution") return fieldIds.studyInstitution
  if (path === "backgroundDetails") return fieldIds.backgroundDetails
  if (path === "firstChoiceGroupSlug") return fieldIds.firstChoiceGroupSlug
  if (path === "secondChoiceGroupSlug") return fieldIds.secondChoiceGroupSlug
  const friendMatch = /^friendEmails\[(\d+)\]/.exec(path)
  if (friendMatch) return friendFieldId(Number(friendMatch[1]))
  return fieldIds.firstName
}

function translateValidationMessage(
  message: string,
  t: (key: string) => string,
): string {
  const keyByMessage: Record<string, string> = {
    "Fornavn er påkrevd.": "firstNameRequired",
    "Etternavn er påkrevd.": "lastNameRequired",
    "Ugyldig e-postadresse.": "emailInvalid",
    "Skriv inn et gyldig telefonnummer.": "phoneRequired",
    "Studiested er påkrevd.": "studyInstitutionRequired",
    "Velg en gruppe du vil søke til.": "firstChoiceRequired",
    "Andrevalget må være en annen gruppe.": "secondChoiceConflict",
    "E-postadressene må være ulike.": "friendEmailDuplicate",
    "Du kan melde på maksimalt to venner.": "friendEmailMax",
    "Fornavnet er for langt.": "firstNameMax",
    "Etternavnet er for langt.": "lastNameMax",
    "E-postadressen er for lang.": "emailMax",
    "Telefonnummeret er for langt.": "phoneMax",
    "Studiestedet er for langt.": "studyInstitutionMax",
    "Bakgrunnsteksten er for lang.": "backgroundDetailsMax",
    "Gruppenavnet er for langt.": "groupSlugMax",
  }
  const key = keyByMessage[message]
  return key ? t(key) : message
}
