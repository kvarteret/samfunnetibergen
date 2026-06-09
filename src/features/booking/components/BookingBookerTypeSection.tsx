"use client";

import { Building2, User, Users, type LucideIcon } from "lucide-react";

import { FieldGroup, SectionHeader } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type BookerType,
  type BookingFormState,
  type SetBookingField,
} from "../domain/formState";
import { BookingSelectableCard } from "./BookingPrimitives";

const BOOKER_OPTIONS: Array<{
  type: BookerType;
  label: string;
  hint: string;
  icon: LucideIcon;
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
];

interface BookingBookerTypeSectionProps {
  state: BookingFormState;
  setField: SetBookingField;
  uid: string;
}

export function BookingBookerTypeSection({
  state,
  setField,
  uid,
}: BookingBookerTypeSectionProps) {
  return (
    <section className="space-y-6">
      <SectionHeader number="01" title="Hvem booker" />
      <div className="grid gap-3 md:grid-cols-3">
        {BOOKER_OPTIONS.map((option) => (
          <BookingSelectableCard
            key={option.type}
            selected={state.bookerType === option.type}
            onSelect={() => setField("bookerType")(option.type)}
          >
            <span className="flex items-center gap-2 font-heading text-foreground">
              <option.icon aria-hidden className="size-4 text-primary" />
              {option.label}
            </span>
            <span className="text-sm leading-5 text-foreground/65">
              {option.hint}
            </span>
          </BookingSelectableCard>
        ))}
      </div>
      {state.bookerType === "studentorg" && (
        <FieldGroup className="max-w-xl">
          <Label htmlFor={`${uid}-studentOrg`}>
            Navn på studentorganisasjon *
          </Label>
          <Input
            id={`${uid}-studentOrg`}
            onChange={(e) => setField("studentOrgName")(e.target.value)}
            placeholder="Registrert under Studentbergen.no"
            value={state.studentOrgName}
          />
        </FieldGroup>
      )}
    </section>
  );
}
