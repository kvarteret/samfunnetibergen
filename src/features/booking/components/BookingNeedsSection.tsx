"use client";

import { Music, Projector, Volume2 } from "lucide-react";

import {
  FieldGroup,
  FieldHint,
  SectionHeader,
} from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  composeTechEquipment,
  type BookingFormState,
  type SetBookingField,
} from "../domain/formState";
import {
  BookingTechnicianOption,
  BookingToggleOption,
} from "./BookingPrimitives";

interface BookingNeedsSectionProps {
  state: BookingFormState;
  setField: SetBookingField;
  uid: string;
}

export function BookingNeedsSection({
  state,
  setField,
  uid,
}: BookingNeedsSectionProps) {
  return (
    <section className="space-y-6">
      <SectionHeader number="04" title="Behov" />
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor={`${uid}-furniture`}>Ønsket møblement *</Label>
          <Input
            id={`${uid}-furniture`}
            onChange={(e) => setField("furniture")(e.target.value)}
            placeholder="F.eks. bord og stoler til 30 personer"
            value={state.furniture}
          />
        </FieldGroup>
        <BookingToggleOption
          checked={state.micEnabled}
          icon={Volume2}
          label="Mikrofoner"
          onChange={setField("micEnabled")}
        >
          {state.micEnabled && (
            <div className="mt-3 flex items-center gap-3">
              <Label htmlFor={`${uid}-micQuantity`}>Antall</Label>
              <Input
                className="w-24"
                id={`${uid}-micQuantity`}
                min={1}
                onChange={(e) =>
                  setField("micQuantity")(Number(e.target.value) || 1)
                }
                type="number"
                value={state.micQuantity}
              />
            </div>
          )}
        </BookingToggleOption>
        <BookingToggleOption
          checked={state.projector}
          icon={Projector}
          label="Projektor + lerret"
          onChange={setField("projector")}
        />
        <BookingToggleOption
          checked={state.music}
          icon={Music}
          label="Musikkavspilling"
          onChange={setField("music")}
        />
        <BookingTechnicianOption
          checked={state.soundTech}
          label="Dedikert lydtekniker"
          onChange={setField("soundTech")}
        />
        <BookingTechnicianOption
          checked={state.lightTech}
          label="Dedikert lystekniker"
          onChange={setField("lightTech")}
        />
      </div>
      <FieldHint>
        Sendes til Crescat som teknisk utstyr: {composeTechEquipment(state)}
      </FieldHint>
    </section>
  );
}
