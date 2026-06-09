"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useId } from "react"
import { Music, Projector, Volume2 } from "lucide-react"
import {
  FieldGroup,
  FieldHint,
  SectionHeader,
} from "@/components/ui/form-fields"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { composeTechEquipment } from "../domain/formState"
import {
  BookingTechnicianOption,
  BookingToggleOption,
} from "./BookingFormPrimitives"
import { useBookingForm } from "./bookingFormContext"

export function BookingFormNeedsSection() {
  const uid = useId()
  const form = useBookingForm()
  const values = form.state.values

  return (
    <section className="space-y-6">
      <SectionHeader number="04" title="Behov" />
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
        <BookingToggleOption
          checked={values.micEnabled}
          icon={Volume2}
          label="Mikrofoner"
          onChange={v => form.setFieldValue("micEnabled", v)}
        >
          {values.micEnabled && (
            <div className="mt-3 flex items-center gap-3">
              <Label htmlFor={`${uid}-micQuantity`}>Antall</Label>
              <form.Field name="micQuantity">
                {(field: any) => (
                  <Input
                    className="w-24"
                    id={`${uid}-micQuantity`}
                    min={1}
                    onChange={e =>
                      field.handleChange(Number(e.target.value) || 1)
                    }
                    type="number"
                    value={field.state.value as number}
                  />
                )}
              </form.Field>
            </div>
          )}
        </BookingToggleOption>
        <BookingToggleOption
          checked={values.projector}
          icon={Projector}
          label="Projektor + lerret"
          onChange={v => form.setFieldValue("projector", v)}
        />
        <BookingToggleOption
          checked={values.music}
          icon={Music}
          label="Musikkavspilling"
          onChange={v => form.setFieldValue("music", v)}
        />
        <BookingTechnicianOption
          checked={values.soundTech}
          label="Dedikert lydtekniker"
          onChange={v => form.setFieldValue("soundTech", v)}
        />
        <BookingTechnicianOption
          checked={values.lightTech}
          label="Dedikert lystekniker"
          onChange={v => form.setFieldValue("lightTech", v)}
        />
      </div>
      <FieldHint>
        Sendes til Crescat som teknisk utstyr: {composeTechEquipment(values)}
      </FieldHint>
    </section>
  )
}
