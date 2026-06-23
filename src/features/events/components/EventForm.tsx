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
import type { EventGroup, EventRoom, EventType } from "@/lib/sanity/fetch"
import { useFormErrors } from "@/lib/use-form-errors"
import {
  buildPreviewEvent,
  type FormState,
  initialState,
} from "../domain/formState"
import { useEventImage } from "../domain/useEventImage"
import {
  getEventValidationIssues,
  type EventValidationField,
} from "../domain/validation"
import { EventFormActions } from "./EventFormActions"
import { eventTypeOptions, groupOptions, roomOptions } from "../domain/options"
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
    firstDate: `${uid}-date-${initialState.dates[0]?.id ?? "first"}`,
    submittedBy: `${uid}-submittedBy`,
    submittedByEmail: `${uid}-submittedByEmail`,
  }

  const form = useForm({
    defaultValues: initialState as FormState,
    onSubmit: async ({ value }) => {
      // Upload the image only now, as part of submit, so abandoned forms never
      // leave orphaned assets in Sanity.
      let imageAssetId: string | undefined
      if (image.imageFile) {
        const formData = new FormData()
        formData.append("image", image.imageFile)
        const uploadResult = await uploadEventImage(formData)
        if (!uploadResult.ok) throw new Error(uploadResult.error)
        imageAssetId = uploadResult.value
      }

      const result = await submitEvent({
        title: value.title,
        description: value.description || undefined,
        dates: value.dates
          .filter(date => date.startDate)
          .map(date => ({
            startDate: date.startDate,
            startTime: date.startTime || undefined,
            endTime: date.endTime || undefined,
          })),
        isRecurring: value.isRecurring,
        rrule: value.isRecurring ? value.rrule : undefined,
        room: value.room || undefined,
        roomText: value.roomText || undefined,
        organizerGroup: value.organizerGroup || undefined,
        organizerText: value.organizerText || undefined,
        submittedByOrganization: value.submittedByOrganization || undefined,
        eventTypeId: value.eventTypeId || undefined,
        imageAssetId: imageAssetId || undefined,
        isInternalEvent: value.isInternalEvent || undefined,
        isFree: value.isFree,
        priceOrdinar: value.priceOrdinar
          ? Number(value.priceOrdinar)
          : undefined,
        priceStudent: value.priceStudent
          ? Number(value.priceStudent)
          : undefined,
        priceMedlem: value.priceMedlem ? Number(value.priceMedlem) : undefined,
        ticketUrl: value.ticketUrl || undefined,
        facebookUrl: value.facebookUrl || undefined,
        submittedBy: value.submittedBy,
        submittedByEmail: value.submittedByEmail,
        honeypot,
      })

      if (!result.ok) throw new Error(result.error)
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
  const validationFieldToId: Record<EventValidationField, string> = {
    title: fieldIds.title,
    firstDate: fieldIds.firstDate,
    submittedBy: fieldIds.submittedBy,
    submittedByEmail: fieldIds.submittedByEmail,
    rrule: "",
  }
  const issues = getEventValidationIssues(values)
  const validationErrors: ErrorSummaryItem[] = issues.map(issue => ({
    fieldId: validationFieldToId[issue.field] || fieldIds.title,
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
            if (validationErrors.length > 0) return
            form.handleSubmit()
          }}
        >
          {visibleErrors.length > 0 && (
            <ErrorSummary className="max-w-3xl" errors={visibleErrors} />
          )}
          <EventFormDetailsSection
            eventTypeOptions={eventTypeSelectOptions}
            titleError={errorFor(fieldIds.title)}
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
          <EventFormPlaceSection roomOptions={roomSelectOptions} uid={uid} />
          <EventFormOrganizerSection
            groupOptions={groupSelectOptions}
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
          <EventFormActions formError="" />
        </form>

        <EventFormPreview event={previewEvent} />
      </div>
    </EventFormContext.Provider>
  )
}
