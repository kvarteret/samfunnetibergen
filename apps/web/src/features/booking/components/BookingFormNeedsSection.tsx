"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import {
  Armchair,
  Hammer,
  Music,
  Projector,
  Trash2,
  Volume2,
  Wand2,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useId } from "react"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Label } from "@/components/ui/label"
import { NumberField } from "@/components/ui/number-field"
import { Textarea } from "@/components/ui/textarea"
import { ToggleOption } from "@/components/ui/toggle-option"
import { useBookingForm } from "./bookingFormContext"

function SubsectionHeading({ children }: { children: string }) {
  return (
    <h3 className="font-heading text-sm uppercase tracking-widest text-foreground">
      {children}
    </h3>
  )
}

interface BookingFormNeedsSectionProps {
  furnitureError?: string
  furnitureId: string
  selectedRoomCrescatId: number
}

export function BookingFormNeedsSection({
  furnitureError,
  furnitureId,
  selectedRoomCrescatId,
}: BookingFormNeedsSectionProps) {
  const uid = useId()
  const form = useBookingForm()
  const t = useTranslations("RoomBooking")
  const furnitureErrorId = `${furnitureId}-error`

  return (
    <FormSection number="06" title={t("needs.sectionTitle")}>
      <div className="max-w-3xl space-y-8">
        <div className="space-y-4">
          <SubsectionHeading>{t("needs.furniture")}</SubsectionHeading>
          <FieldGroup error={furnitureError} errorId={furnitureErrorId}>
            <Label htmlFor={furnitureId}>{t("needs.furnitureLabel")}</Label>
            <form.Field name="furniture">
              {(field: AnyFieldApi) => (
                <Textarea
                  aria-describedby={
                    furnitureError ? furnitureErrorId : undefined
                  }
                  aria-invalid={!!furnitureError}
                  className="resize-y"
                  id={furnitureId}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder={t("needs.furniturePlaceholder")}
                  rows={4}
                  value={field.state.value as string}
                />
              )}
            </form.Field>
          </FieldGroup>
        </div>

        <div className="space-y-4">
          <SubsectionHeading>{t("needs.technical")}</SubsectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <form.Field name="micEnabled">
              {(field: AnyFieldApi) => (
                <ToggleOption
                  checked={field.state.value as boolean}
                  icon={Volume2}
                  label={t("needs.microphones")}
                  onChange={field.handleChange}
                >
                  {(field.state.value as boolean) && (
                    <FieldGroup className="mt-3 flex items-center gap-3">
                      <Label htmlFor={`${uid}-micQuantity`}>
                        {t("needs.quantity")}
                      </Label>
                      <form.Field name="micQuantity">
                        {(qtyField: AnyFieldApi) => (
                          <NumberField
                            className="w-32"
                            decrementLabel={t("controls.decrease")}
                            id={`${uid}-micQuantity`}
                            incrementLabel={t("controls.increase")}
                            min={1}
                            onValueChange={value =>
                              qtyField.handleChange(value ?? 1)
                            }
                            value={qtyField.state.value as number}
                          />
                        )}
                      </form.Field>
                    </FieldGroup>
                  )}
                </ToggleOption>
              )}
            </form.Field>
            <form.Field name="projector">
              {(field: AnyFieldApi) => (
                <ToggleOption
                  checked={field.state.value as boolean}
                  icon={Projector}
                  label={t("needs.projector")}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
            <form.Field name="music">
              {(field: AnyFieldApi) => (
                <ToggleOption
                  checked={field.state.value as boolean}
                  icon={Music}
                  label={t("needs.music")}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
            <form.Field name="soundTech">
              {(field: AnyFieldApi) => (
                <ToggleOption
                  checked={field.state.value as boolean}
                  icon={Wand2}
                  label={t("needs.soundTechnician")}
                  onChange={field.handleChange}
                >
                  <p className="leading-6 text-foreground-muted">
                    {t("needs.technicianNotice")}
                  </p>
                </ToggleOption>
              )}
            </form.Field>
            <form.Field name="lightTech">
              {(field: AnyFieldApi) => (
                <ToggleOption
                  checked={field.state.value as boolean}
                  icon={Wand2}
                  label={t("needs.lightingTechnician")}
                  onChange={field.handleChange}
                >
                  <p className="leading-6 text-foreground-muted">
                    {t("needs.technicianNotice")}
                  </p>
                </ToggleOption>
              )}
            </form.Field>
            <form.Field name="riggingSetup">
              {(field: AnyFieldApi) => (
                <ToggleOption
                  checked={field.state.value as boolean}
                  icon={Hammer}
                  label={t("needs.riggingSetup")}
                  onChange={field.handleChange}
                >
                  <p className="leading-6 text-foreground-muted">
                    {t("needs.riggingSetupNotice")}
                  </p>
                </ToggleOption>
              )}
            </form.Field>
            <form.Field name="riggingTeardown">
              {(field: AnyFieldApi) => (
                <ToggleOption
                  checked={field.state.value as boolean}
                  icon={Trash2}
                  label={t("needs.riggingTeardown")}
                  onChange={field.handleChange}
                >
                  <p className="leading-6 text-foreground-muted">
                    {t("needs.riggingTeardownNotice")}
                  </p>
                </ToggleOption>
              )}
            </form.Field>
            {selectedRoomCrescatId === 95 && (
              <form.Field name="needsAmphi">
                {(field: AnyFieldApi) => (
                  <ToggleOption
                    checked={field.state.value as boolean}
                    icon={Armchair}
                    label={t("needs.amphi")}
                    onChange={field.handleChange}
                  />
                )}
              </form.Field>
            )}
          </div>
        </div>
      </div>
    </FormSection>
  )
}
