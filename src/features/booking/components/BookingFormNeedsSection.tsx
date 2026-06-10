"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Music, Projector, Volume2, Wand2 } from "lucide-react"
import { useId } from "react"
import { FieldGroup, FormSection } from "@/components/ui/form-fields"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleOption } from "@/components/ui/toggle-option"
import { useBookingForm } from "./bookingFormContext"

export function BookingFormNeedsSection() {
  const uid = useId()
  const form = useBookingForm()

  return (
    <FormSection number="04" title="Behov">
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor={`${uid}-furniture`}>Ønsket møblement *</Label>
          <form.Field name="furniture">
            {(field: any) => (
              <Input
                id={`${uid}-furniture`}
                onChange={e => field.handleChange(e.target.value)}
                placeholder="F.eks. bord og stoler til 30 personer"
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
        <form.Field name="micEnabled">
          {(field: any) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={Volume2}
              label="Mikrofoner"
              onChange={field.handleChange}
            >
              {(field.state.value as boolean) && (
                <div className="mt-3 flex items-center gap-3">
                  <Label htmlFor={`${uid}-micQuantity`}>Antall</Label>
                  <form.Field name="micQuantity">
                    {(qtyField: any) => (
                      <Input
                        className="w-24"
                        id={`${uid}-micQuantity`}
                        min={1}
                        onChange={e =>
                          qtyField.handleChange(Number(e.target.value) || 1)
                        }
                        type="number"
                        value={qtyField.state.value as number}
                      />
                    )}
                  </form.Field>
                </div>
              )}
            </ToggleOption>
          )}
        </form.Field>
        <form.Field name="projector">
          {(field: any) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={Projector}
              label="Projektor + lerret"
              onChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Field name="music">
          {(field: any) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={Music}
              label="Musikkavspilling"
              onChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Field name="soundTech">
          {(field: any) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={Wand2}
              label="Dedikert lydtekniker"
              onChange={field.handleChange}
            >
              <p className="text-sm leading-6 text-foreground/70">
                Dedikert tekniker koster <strong>3500 kr eks. mva</strong> per
                tekniker. Avbestilling må skje senest <strong>10 dager</strong>{" "}
                før arrangementet.
              </p>
            </ToggleOption>
          )}
        </form.Field>
        <form.Field name="lightTech">
          {(field: any) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={Wand2}
              label="Dedikert lystekniker"
              onChange={field.handleChange}
            >
              <p className="text-sm leading-6 text-foreground/70">
                Dedikert tekniker koster <strong>3500 kr eks. mva</strong> per
                tekniker. Avbestilling må skje senest <strong>10 dager</strong>{" "}
                før arrangementet.
              </p>
            </ToggleOption>
          )}
        </form.Field>
      </div>
    </FormSection>
  )
}
