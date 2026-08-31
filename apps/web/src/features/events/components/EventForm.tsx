"use client"

import { useForm, useStore } from "@tanstack/react-form"
import posthog from "posthog-js"
import { type FormEvent, useEffect, useId, useRef, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ErrorSummary,
  type ErrorSummaryItem,
} from "@/components/ui/error-summary"
import {
  submitEvent,
  uploadEventImage,
} from "@/features/events/actions/submitEvent"
import { getFormValidationIssues } from "@/lib/form-validation-errors"
import { requestExceptionFeedback } from "@/lib/posthog/exception-feedback"
import { captureInvalidFormSubmission } from "@/lib/posthog/form-validation"
import type { EventGroup, EventRoom, EventType } from "@/lib/sanity/fetch"
import { GENERIC_SUBMIT_ERROR } from "@/lib/submission-messages"
import { useFormErrors } from "@/lib/use-form-errors"
import { eventFormSchema } from "../domain/eventFormSchema"
import {
  buildPreviewEvent,
  type FormState,
  initialState,
} from "../domain/formState"
import { eventTypeOptions, groupOptions, roomOptions } from "../domain/options"
import { useEventImage } from "../domain/useEventImage"
import { EventFormActions } from "./EventFormActions"
import { EventFormDetailsSection } from "./EventFormDetailsSection"
import { EventFormImageSection } from "./EventFormImageSection"
import { EventFormLinksSection } from "./EventFormLinksSection"
import { EventFormOrganizerSection } from "./EventFormOrganizerSection"
import { EventFormPlaceSection } from "./EventFormPlaceSection"
import { EventFormPreview } from "./EventFormPreview"
import { EventFormPriceSection } from "./EventFormPriceSection"
import { EventFormScheduleSection } from "./EventFormScheduleSection"
import { EventFormSubmitterSection } from "./EventFormSubmitterSection"
import { EventFormContext } from "./eventFormContext"

interface EventFormProps {
  rooms: EventRoom[]
  eventTypes: EventType[]
  groups: EventGroup[]
}

export function EventForm({ rooms, eventTypes, groups }: EventFormProps) {
  const uid = useId()
  const image = useEventImage()
  const [honeypot] = useState("")
  const fieldIds = {
    title: `${uid}-title`,
    titleEnglish: `${uid}-title-en`,
    description: `${uid}-description`,
    descriptionEnglish: `${uid}-description-en`,
    firstDate: `${uid}-date-${initialState.dates[0]?.id ?? "first"}`,
    roomText: `${uid}-roomText`,
    roomTextEnglish: `${uid}-roomText-en`,
    organizerText: `${uid}-organizerText`,
    organizerTextEnglish: `${uid}-organizerText-en`,
    submittedBy: `${uid}-submittedBy`,
    submittedByEmail: `${uid}-submittedByEmail`,
  }

  const form = useForm({
    defaultValues: initialState as FormState,
    validators: {
      onChange: eventFormSchema,
      onSubmit: eventFormSchema,
    },
    onSubmitInvalid: ({ formApi }) => {
      captureInvalidFormSubmission(
        "event_submission",
        formApi.state.errorMap.onChange,
        formApi.state.errorMap.onSubmit,
      )
    },
    onSubmit: async ({ value, formApi }) => {
      // Upload the image only now, as part of submit, so abandoned forms never
      // leave orphaned assets in Sanity.
      let imageAssetId: string | undefined
      if (image.imageFile) {
        const formData = new FormData()
        formData.append("image", image.imageFile)
        const uploadResult = await uploadEventImage(formData)
        if (!uploadResult.ok) {
          formApi.setErrorMap({ onServer: uploadResult.error as never })
          requestExceptionFeedback("event_submission")
          throw new Error(uploadResult.error)
        }
        imageAssetId = uploadResult.value
      }

      const result = await submitEvent({ ...value, imageAssetId, honeypot })

      if (!result.ok) {
        formApi.setErrorMap({ onServer: result.error as never })
        requestExceptionFeedback("event_submission")
        throw new Error(result.error)
      }
    },
  })
  const values = useStore(form.store, state => state.values)
  const isSubmitSuccessful = useStore(
    form.store,
    state => state.isSubmitSuccessful,
  )

  // Initialize first date with today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    const firstId = form.state.values.dates[0]?.id
    if (firstId) {
      form.setFieldValue("dates", (dates: typeof initialState.dates) =>
        dates.map(d =>
          d.id === firstId ? { ...d, startDate: today, startTime: "21:00" } : d,
        ),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const eventTypeSelectOptions = eventTypeOptions(eventTypes)
  const roomSelectOptions = roomOptions(rooms)
  const groupSelectOptions = groupOptions(groups)

  const previewEvent = buildPreviewEvent(
    values,
    image.imagePreviewUrl,
    rooms,
    groups,
    eventTypes,
  )
  const errorMap = useStore(form.store, state => state.errorMap)
  const submitError =
    typeof errorMap.onServer === "string" ? errorMap.onServer : undefined
  const validationErrors: ErrorSummaryItem[] = getFormValidationIssues(
    errorMap.onChange,
    errorMap.onSubmit,
  ).map(issue => ({
    fieldId: eventFieldId(issue.path, fieldIds),
    message: issue.message,
  }))
  const { visibleErrors, markSubmitAttempt, errorFor } =
    useFormErrors(validationErrors)

  const hasStartedRef = useRef(false)
  const markStarted = () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    posthog.capture("event_submission_started")
  }

  if (isSubmitSuccessful) {
    return (
      <Alert className="max-w-2xl p-8" variant="success">
        <AlertTitle className="text-xl">Forespørsel sendt inn</AlertTitle>
        <AlertDescription>Din forespørsel er sendt inn.</AlertDescription>
      </Alert>
    )
  }

  return (
    <EventFormContext.Provider value={form}>
      <div className="grid grid-cols-1 items-start gap-12 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form
          className="min-w-0 space-y-14"
          noValidate
          onFocusCapture={markStarted}
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            markSubmitAttempt()
            form.setErrorMap({ onServer: undefined })
            void form.handleSubmit().catch((error: unknown) => {
              if (form.state.errorMap.onServer) return
              form.setErrorMap({ onServer: GENERIC_SUBMIT_ERROR as never })
              requestExceptionFeedback("event_submission")
              posthog.captureException(
                new Error("Unexpected event submission failure"),
                {
                  form_id: "event_submission",
                  validation_stage: "client",
                  failure_branch: "unexpected_submission_failure",
                  rejection_message:
                    error instanceof Error ? error.message : String(error),
                  rejection_name:
                    error instanceof Error ? error.name : undefined,
                },
              )
            })
          }}
        >
          {visibleErrors.length > 0 && (
            <ErrorSummary className="max-w-3xl" errors={visibleErrors} />
          )}
          <EventFormDetailsSection
            descriptionEnglishError={errorFor(fieldIds.descriptionEnglish)}
            descriptionError={errorFor(fieldIds.description)}
            eventTypeOptions={eventTypeSelectOptions}
            titleError={errorFor(fieldIds.title)}
            titleEnglishError={errorFor(fieldIds.titleEnglish)}
            titleId={fieldIds.title}
            uid={uid}
          />
          <EventFormImageSection
            imagePreviewUrl={image.imagePreviewUrl}
            imageUploadError={image.imageUploadError}
            onImageChange={image.onImageChange}
            onRemoveImage={image.onRemoveImage}
          />
          <EventFormScheduleSection
            firstDateError={errorFor(fieldIds.firstDate)}
            firstDateId={fieldIds.firstDate}
            uid={uid}
          />
          <EventFormPlaceSection
            roomOptions={roomSelectOptions}
            roomTextEnglishError={errorFor(fieldIds.roomTextEnglish)}
            roomTextError={errorFor(fieldIds.roomText)}
            uid={uid}
          />
          <EventFormOrganizerSection
            groupOptions={groupSelectOptions}
            organizerTextEnglishError={errorFor(fieldIds.organizerTextEnglish)}
            organizerTextError={errorFor(fieldIds.organizerText)}
            uid={uid}
          />
          <EventFormPriceSection uid={uid} />
          <EventFormLinksSection uid={uid} />
          <EventFormSubmitterSection
            submittedByEmailError={errorFor(fieldIds.submittedByEmail)}
            submittedByEmailId={fieldIds.submittedByEmail}
            submittedByError={errorFor(fieldIds.submittedBy)}
            submittedById={fieldIds.submittedBy}
            uid={uid}
          />
          <EventFormActions formError={submitError} />
        </form>

        <EventFormPreview event={previewEvent} />
      </div>
    </EventFormContext.Provider>
  )
}

function eventFieldId(path: string, fieldIds: Record<string, string>): string {
  if (path === "title") return fieldIds.title
  if (path === "titleEnglish") return fieldIds.titleEnglish
  if (path === "description") return fieldIds.description
  if (path === "descriptionEnglish") return fieldIds.descriptionEnglish
  if (path === "roomText") return fieldIds.roomText
  if (path === "roomTextEnglish") return fieldIds.roomTextEnglish
  if (path === "organizerText") return fieldIds.organizerText
  if (path === "organizerTextEnglish") return fieldIds.organizerTextEnglish
  if (path === "submittedBy") return fieldIds.submittedBy
  if (path === "submittedByEmail") return fieldIds.submittedByEmail
  if (path === "dates" || path.startsWith("dates[")) {
    return fieldIds.firstDate
  }
  if (path === "rrule") return fieldIds.firstDate
  return fieldIds.title
}
