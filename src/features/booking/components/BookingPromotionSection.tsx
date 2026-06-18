"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { useId } from "react"

import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import type { SelectOption } from "@/components/ui/select-field"
import { EventFormDetailsSection } from "@/features/events/components/EventFormDetailsSection"
import { EventFormImageSection } from "@/features/events/components/EventFormImageSection"
import { EventFormLinksSection } from "@/features/events/components/EventFormLinksSection"
import { EventFormOrganizerSection } from "@/features/events/components/EventFormOrganizerSection"
import { EventFormPlaceSection } from "@/features/events/components/EventFormPlaceSection"
import { EventFormPriceSection } from "@/features/events/components/EventFormPriceSection"
import { EventFormScheduleSection } from "@/features/events/components/EventFormScheduleSection"
import { EventFormSubmitterSection } from "@/features/events/components/EventFormSubmitterSection"
import { EventFormContext } from "@/features/events/components/eventFormContext"
import type { FormState as EventFormState } from "@/features/events/domain/formState"
import type { EventImageController } from "@/features/events/domain/useEventImage"
import type { AppFormApi } from "@/lib/form-api"
import { cn } from "@/lib/utils"
import type { BookingFormValues } from "./BookingForm"
import { useBookingForm } from "./bookingFormContext"

interface BookingPromotionSectionProps {
  promotionForm: AppFormApi<EventFormState>
  eventTypeOptions: SelectOption[]
  roomOptions: SelectOption[]
  groupOptions: SelectOption[]
  image: EventImageController
  uploadLater: boolean
  onUploadLaterChange: (value: boolean) => void
  onSameAsBooking: () => void
  showDoorsHint: boolean
  promoteError?: string
  promoteFieldId: string
  titleError?: string
  titleId: string
  firstDateError?: string
  firstDateId: string
  submittedByError?: string
  submittedById: string
  submittedByEmailError?: string
  submittedByEmailId: string
}

export function BookingPromotionSection({
  promotionForm,
  eventTypeOptions,
  roomOptions,
  groupOptions,
  image,
  uploadLater,
  onUploadLaterChange,
  onSameAsBooking,
  showDoorsHint,
  promoteError,
  promoteFieldId,
  titleError,
  titleId,
  firstDateError,
  firstDateId,
  submittedByError,
  submittedById,
  submittedByEmailError,
  submittedByEmailId,
}: BookingPromotionSectionProps) {
  const uid = useId()
  const form = useBookingForm()
  const promoteErrorId = `${promoteFieldId}-error`

  return (
    <FormSection number="08" title="Promotering">
      <p className="max-w-3xl leading-6 text-foreground-muted">
        Ønsker du at arrangementet promoteres på samfunnetibergen.no og
        eksternt?
      </p>

      <FieldGroup error={promoteError} errorId={promoteErrorId}>
        <form.Field name="promote">
          {(field: AnyFieldApi) => {
            const value = field.state.value as string
            return (
              <div
                aria-describedby={promoteError ? promoteErrorId : undefined}
                className="flex flex-wrap gap-3"
                id={promoteFieldId}
              >
                <Button
                  aria-pressed={value === "ja"}
                  className={cn(value === "nei" && "opacity-60")}
                  onClick={() => field.handleChange("ja")}
                  type="button"
                  variant="default"
                >
                  Ja, promoter arrangementet
                </Button>
                <Button
                  aria-pressed={value === "nei"}
                  onClick={() => field.handleChange("nei")}
                  type="button"
                  variant="neutral"
                >
                  Nei takk
                </Button>
              </div>
            )
          }}
        </form.Field>
      </FieldGroup>

      <form.Subscribe
        selector={(s: { values: BookingFormValues }) => s.values.promote}
      >
        {(promote: string) =>
          promote === "ja" ? (
            <EventFormContext.Provider value={promotionForm}>
              <div className="space-y-14 border-l-2 border-border pl-6">
                <EventFormDetailsSection
                  eventTypeOptions={eventTypeOptions}
                  number=""
                  titleError={titleError}
                  titleId={titleId}
                  uid={uid}
                />
                <EventFormImageSection
                  imagePreviewUrl={image.imagePreviewUrl}
                  imageUploadError={image.imageUploadError}
                  number=""
                  onImageChange={image.onImageChange}
                  onRemoveImage={image.onRemoveImage}
                  onUploadLaterChange={onUploadLaterChange}
                  uploadLater={uploadLater}
                />
                <div className="space-y-4">
                  <EventFormScheduleSection
                    allowRecurring={false}
                    firstDateError={firstDateError}
                    firstDateId={firstDateId}
                    number=""
                    uid={uid}
                  />
                  {showDoorsHint ? (
                    <p className="text-sm text-foreground-muted">
                      Starttid er hentet fra «Dører åpner» i bookingen.
                    </p>
                  ) : (
                    <Button
                      onClick={onSameAsBooking}
                      size="sm"
                      type="button"
                      variant="neutral"
                    >
                      Samme som booking
                    </Button>
                  )}
                </div>
                <EventFormPlaceSection
                  number=""
                  roomOptions={roomOptions}
                  uid={uid}
                />
                <EventFormOrganizerSection
                  groupOptions={groupOptions}
                  number=""
                  uid={uid}
                />
                <EventFormPriceSection number="" uid={uid} />
                <EventFormLinksSection number="" uid={uid} />
                <EventFormSubmitterSection
                  number=""
                  submittedByEmailError={submittedByEmailError}
                  submittedByEmailId={submittedByEmailId}
                  submittedByError={submittedByError}
                  submittedById={submittedById}
                  title="Kontaktperson for arrangementet"
                  uid={uid}
                />
              </div>
            </EventFormContext.Provider>
          ) : null
        }
      </form.Subscribe>
    </FormSection>
  )
}
