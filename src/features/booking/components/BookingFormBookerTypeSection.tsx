"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { Building2, type LucideIcon, User, Users } from "lucide-react"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  SelectableCard,
  SelectableCardGroup,
} from "@/components/ui/selectable-card"
import type { BookerType } from "../domain/formState"
import type { BookingFormValues } from "./BookingForm"
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

interface BookingFormBookerTypeSectionProps {
  studentOrgNameError?: string
  studentOrgNameId: string
}

export function BookingFormBookerTypeSection({
  studentOrgNameError,
  studentOrgNameId,
}: BookingFormBookerTypeSectionProps) {
  const form = useBookingForm()
  const studentOrgErrorId = `${studentOrgNameId}-error`

  return (
    <FormSection number="01" title="Hvem booker">
      <form.Subscribe
        selector={(s: { values: BookingFormValues }) => s.values.bookerType}
      >
        {(bookerType: BookerType) => (
          <>
            <SelectableCardGroup
              className="gap-3 md:grid-cols-3"
              onValueChange={value =>
                form.setFieldValue("bookerType", value as BookerType)
              }
              value={bookerType}
            >
              {BOOKER_OPTIONS.map(option => (
                <SelectableCard key={option.type} value={option.type}>
                  <span className="flex items-center gap-2 font-heading text-foreground">
                    <option.icon aria-hidden className="size-4 text-primary" />
                    {option.label}
                  </span>
                  <span className="text-base leading-5 text-foreground-muted">
                    {option.hint}
                  </span>
                </SelectableCard>
              ))}
            </SelectableCardGroup>
            {bookerType === "studentorg" && (
              <FieldGroup
                className="max-w-xl"
                error={studentOrgNameError}
                errorId={studentOrgErrorId}
              >
                <Label htmlFor={studentOrgNameId}>
                  Navn på studentorganisasjon *
                </Label>
                <form.Field name="studentOrgName">
                  {(field: AnyFieldApi) => (
                    <Input
                      aria-describedby={
                        studentOrgNameError ? studentOrgErrorId : undefined
                      }
                      aria-invalid={!!studentOrgNameError}
                      autoComplete="organization"
                      id={studentOrgNameId}
                      onChange={e => field.handleChange(e.target.value)}
                      placeholder="Registrert under Studentbergen.no"
                      value={field.state.value as string}
                    />
                  )}
                </form.Field>
              </FieldGroup>
            )}
          </>
        )}
      </form.Subscribe>
    </FormSection>
  )
}
