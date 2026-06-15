"use client"

import { useForm, useStore } from "@tanstack/react-form"
import posthog from "posthog-js"
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
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
import {
  EVENT_IMAGE_MAX_SIZE_BYTES,
  formatEventImageMaxSize,
  isAcceptedEventImageType,
} from "../domain/imageUpload"
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
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageAssetId, setImageAssetId] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUploadError, setImageUploadError] = useState("")
  const fieldIds = {
    title: `${uid}-title`,
    firstDate: `${uid}-date-${initialState.dates[0]?.id ?? "first"}`,
    submittedBy: `${uid}-submittedBy`,
    submittedByEmail: `${uid}-submittedByEmail`,
  }

  const form = useForm({
    defaultValues: initialState as FormState,
    onSubmit: async ({ value }) => {
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

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  const eventTypeOptions = eventTypes.map(eventType => ({
    value: eventType._id,
    label: eventType.taxonomyGroup
      ? `${eventType.taxonomyGroup.name} — ${eventType.name}`
      : eventType.name,
  }))

  const roomOptions = rooms.map(room => ({
    value: room._id,
    label: room.title,
  }))

  const groupOptions = groups.map(group => ({
    value: group._id,
    label: group.name,
  }))

  const previewEvent = buildPreviewEvent(
    values,
    imagePreviewUrl,
    rooms,
    groups,
    eventTypes,
  )
  const validationErrors = getEventValidationErrors(values, fieldIds)
  const { visibleErrors, markSubmitAttempt, errorFor } =
    useFormErrors(validationErrors)

  const handleImageChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]

      if (!file) {
        return
      }

      setImageAssetId(null)
      setImageUploadError("")
      event.target.value = ""

      if (!isAcceptedEventImageType(file.type)) {
        setImageUploadError("Bildet må være JPEG, PNG eller WebP")
        return
      }

      if (file.size > EVENT_IMAGE_MAX_SIZE_BYTES) {
        setImageUploadError(
          `Bildet er for stort (maks ${formatEventImageMaxSize()})`,
        )
        return
      }

      const previewUrl = URL.createObjectURL(file)
      setImagePreviewUrl(previousUrl => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl)
        }
        return previewUrl
      })
      setImageUploading(true)

      const formData = new FormData()
      formData.append("image", file)

      try {
        const result = await uploadEventImage(formData)

        if (result.ok) {
          setImageAssetId(result.value)
        } else {
          setImageUploadError(result.error)
        }
      } catch {
        setImageUploadError(
          "Kunne ikke laste opp bildet. Prøv igjen med et bilde under 10 MB.",
        )
      } finally {
        setImageUploading(false)
      }
    },
    [],
  )

  const handleRemoveImage = useCallback(() => {
    setImagePreviewUrl(previousUrl => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }
      return null
    })
    setImageAssetId(null)
    setImageUploadError("")
  }, [])

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
            if (imageUploading) {
              return
            }
            form.handleSubmit()
          }}
        >
          {visibleErrors.length > 0 && (
            <ErrorSummary className="max-w-3xl" errors={visibleErrors} />
          )}
          <EventFormDetailsSection
            eventTypeOptions={eventTypeOptions}
            titleError={errorFor(fieldIds.title)}
            titleId={fieldIds.title}
            uid={uid}
          />
          <EventFormImageSection
            imageAssetId={imageAssetId}
            imagePreviewUrl={imagePreviewUrl}
            imageUploadError={imageUploadError}
            imageUploading={imageUploading}
            onImageChange={handleImageChange}
            onRemoveImage={handleRemoveImage}
          />
          <EventFormScheduleSection
            firstDateError={errorFor(fieldIds.firstDate)}
            firstDateId={fieldIds.firstDate}
            uid={uid}
          />
          <EventFormPlaceSection roomOptions={roomOptions} uid={uid} />
          <EventFormOrganizerSection groupOptions={groupOptions} uid={uid} />
          <EventFormPriceSection uid={uid} />
          <EventFormLinksSection uid={uid} />
          <EventFormSubmitterSection
            submittedByEmailError={errorFor(fieldIds.submittedByEmail)}
            submittedByEmailId={fieldIds.submittedByEmail}
            submittedByError={errorFor(fieldIds.submittedBy)}
            submittedById={fieldIds.submittedBy}
            uid={uid}
          />
          <EventFormActions formError="" imageUploading={imageUploading} />
        </form>

        <EventFormPreview event={previewEvent} />
      </div>
    </EventFormContext.Provider>
  )
}

type EventFieldIds = Record<
  "title" | "firstDate" | "submittedBy" | "submittedByEmail",
  string
>

function getEventValidationErrors(
  values: FormState,
  fieldIds: EventFieldIds,
): ErrorSummaryItem[] {
  const errors: ErrorSummaryItem[] = []

  if (!values.title.trim()) {
    errors.push({
      fieldId: fieldIds.title,
      message: "Skriv inn tittel.",
    })
  }
  if (values.dates.every(date => !date.startDate)) {
    errors.push({
      fieldId: fieldIds.firstDate,
      message: "Fyll ut minst én dato.",
    })
  }
  if (!values.submittedBy.trim()) {
    errors.push({
      fieldId: fieldIds.submittedBy,
      message: "Skriv inn navn på kontaktperson.",
    })
  }
  if (
    !values.submittedByEmail.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.submittedByEmail)
  ) {
    errors.push({
      fieldId: fieldIds.submittedByEmail,
      message: "Skriv inn en gyldig e-postadresse.",
    })
  }

  return errors
}
