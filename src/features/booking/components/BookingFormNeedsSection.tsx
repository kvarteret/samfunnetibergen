"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { Music, Projector, Volume2, Wand2, Armchair } from "lucide-react"
import { useId } from "react"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumberField } from "@/components/ui/number-field"
import { ToggleOption } from "@/components/ui/toggle-option"
import { useBookingForm } from "./bookingFormContext"

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
  const furnitureErrorId = `${furnitureId}-error`

  return (
    <FormSection number="04" title="Behov">
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup
          className="sm:col-span-2"
          error={furnitureError}
          errorId={furnitureErrorId}
        >
          <Label htmlFor={furnitureId}>Ønsket møblement *</Label>
          <form.Field name="furniture">
            {(field: AnyFieldApi) => (
              <Input
                aria-describedby={furnitureError ? furnitureErrorId : undefined}
                aria-invalid={!!furnitureError}
                id={furnitureId}
                onChange={e => field.handleChange(e.target.value)}
                placeholder="F.eks. bord og stoler til 30 personer"
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
        <form.Field name="micEnabled">
          {(field: AnyFieldApi) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={Volume2}
              label="Mikrofoner"
              onChange={field.handleChange}
            >
              {(field.state.value as boolean) && (
                <FieldGroup className="mt-3 flex items-center gap-3">
                  <Label htmlFor={`${uid}-micQuantity`}>Antall</Label>
                  <form.Field name="micQuantity">
                    {(qtyField: AnyFieldApi) => (
                      <NumberField
                        className="w-32"
                        id={`${uid}-micQuantity`}
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
              label="Projektor + lerret"
              onChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Field name="music">
          {(field: AnyFieldApi) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={Music}
              label="Musikkavspilling"
              onChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Field name="soundTech">
          {(field: AnyFieldApi) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={Wand2}
              label="Dedikert lydtekniker"
              onChange={field.handleChange}
            >
              <p className=" leading-6 text-foreground-muted">
                Dedikert tekniker koster <strong>3500 kr eks. mva</strong> per
                tekniker. Avbestilling må skje senest <strong>10 dager</strong>{" "}
                før arrangementet.
              </p>
            </ToggleOption>
          )}
        </form.Field>
        <form.Field name="lightTech">
          {(field: AnyFieldApi) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={Wand2}
              label="Dedikert lystekniker"
              onChange={field.handleChange}
            >
              <p className=" leading-6 text-foreground-muted">
                Dedikert tekniker koster <strong>3500 kr eks. mva</strong> per
                tekniker. Avbestilling må skje senest <strong>10 dager</strong>{" "}
                før arrangementet.
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
                label="Behov for amfi — kun Tivoli"
                onChange={field.handleChange}
              />
            )}
          </form.Field>
        )}
      </div>
    </FormSection>
  )
}
