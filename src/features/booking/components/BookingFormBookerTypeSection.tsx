"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useId } from "react"
import { Building2, User, Users, type LucideIcon } from "lucide-react"
import { FieldGroup, FormSection } from "@/components/ui/form-fields"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BookerType } from "../domain/formState"
import { SelectableCard } from "@/components/ui/selectable-card"
import { useBookingForm } from "./bookingFormContext"

const BOOKER_OPTIONS: Array<{
  type: BookerType
  label: string
  hint: string
  icon: LucideIcon
}> = [
  {
    type: "ekstern",
    label: "Ekstern / privat",
    hint: "Privatpersoner og bedrifter.",
    icon: User,
  },
  {
    type: "studentorg",
    label: "Studentorganisasjon",
    hint: "Registrert under Studentbergen.no.",
    icon: Users,
  },
  {
    type: "intern",
    label: "Intern",
    hint: "Driftsorganisasjoner og interne arrangører.",
    icon: Building2,
  },
]

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface BookingFormBookerTypeSectionProps {}

export function BookingFormBookerTypeSection({}: BookingFormBookerTypeSectionProps) {
  const uid = useId()
  const form = useBookingForm()
  const bookerType = form.state.values.bookerType as BookerType

  return (
    <FormSection number="01" title="Hvem booker">
      <div className="grid gap-3 md:grid-cols-3">
        {BOOKER_OPTIONS.map(option => (
          <SelectableCard
            key={option.type}
            onSelect={() => form.setFieldValue("bookerType", option.type)}
            selected={bookerType === option.type}
          >
            <span className="flex items-center gap-2 font-heading text-foreground">
              <option.icon aria-hidden className="size-4 text-primary" />
              {option.label}
            </span>
            <span className="text-sm leading-5 text-foreground/65">
              {option.hint}
            </span>
          </SelectableCard>
        ))}
      </div>
      <form.Subscribe selector={(s: any) => s.values.bookerType}>
        {(bookerTypeVal: BookerType) =>
          bookerTypeVal === "studentorg" ? (
            <FieldGroup className="max-w-xl">
              <Label htmlFor={`${uid}-studentOrg`}>
                Navn på studentorganisasjon *
              </Label>
              <form.Field name="studentOrgName">
                {(field: any) => (
                  <Input
                    id={`${uid}-studentOrg`}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder="Registrert under Studentbergen.no"
                    value={field.state.value as string}
                  />
                )}
              </form.Field>
            </FieldGroup>
          ) : null
        }
      </form.Subscribe>
    </FormSection>
  )
}
