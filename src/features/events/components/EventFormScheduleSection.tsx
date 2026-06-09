"use client";

import { Plus, X } from "lucide-react";

import {
  CheckboxSquare,
  FieldGroup,
  SectionHeader,
} from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DateEntry } from "../domain/formState";
import { newDate } from "../domain/formState";
import { EventFormRecurrenceBuilder } from "./EventFormRecurrenceBuilder";
import { useEventForm } from "./eventFormContext";

interface EventScheduleFieldsProps {
  uid: string;
}

export function EventFormScheduleSection({ uid }: EventScheduleFieldsProps) {
  const form = useEventForm();
  const values = form.state.values;

  const handleAddDate = () => {
    form.setFieldValue("dates", (dates: DateEntry[]) => [
      ...dates,
      newDate(),
    ]);
  };

  const handleRemoveDate = (id: string) => {
    form.setFieldValue("dates", (dates: DateEntry[]) =>
      dates.filter((date) => date.id !== id),
    );
  };

  const handleUpdateDate = (
    id: string,
    key: keyof DateEntry,
    value: string,
  ) => {
    form.setFieldValue("dates", (dates: DateEntry[]) =>
      dates.map((date) =>
        date.id === id ? { ...date, [key]: value } : date,
      ),
    );
  };

  return (
    <section className="space-y-6">
      <SectionHeader number="03" title="Dato og tid" />

      <div className="space-y-4">
        {values.dates.map(
          (date: DateEntry, index: number) => (
            <EventDateCard
              date={date}
              index={index}
              key={date.id}
              totalDates={values.dates.length}
              uid={uid}
              removeDate={handleRemoveDate}
              updateDate={handleUpdateDate}
            />
          ),
        )}

        <button
          className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-border px-4 py-2.5 text-sm font-heading text-foreground/60 transition-colors hover:border-primary hover:text-primary"
          onClick={handleAddDate}
          type="button"
        >
          <Plus aria-hidden className="size-4" />
          Legg til dato
        </button>
      </div>

      <EventRecurrenceFields
        isRecurring={values.isRecurring}
        onRecurrenceChange={(rrule) =>
          form.setFieldValue("rrule", rrule)
        }
        onRecurringToggle={(v) =>
          form.setFieldValue("isRecurring", v)
        }
      />
    </section>
  );
}

interface EventDateCardProps {
  uid: string;
  date: DateEntry;
  index: number;
  totalDates: number;
  removeDate: (id: string) => void;
  updateDate: (id: string, key: keyof DateEntry, value: string) => void;
}

function EventDateCard({
  uid,
  date,
  index,
  totalDates,
  removeDate,
  updateDate,
}: EventDateCardProps) {
  return (
    <div className="space-y-4 border-2 border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm uppercase tracking-[0.12em] text-foreground/60">
          Dato {totalDates > 1 ? index + 1 : ""}
        </p>
        {totalDates > 1 && (
          <button
            aria-label="Fjern dato"
            className="text-foreground/40 transition-colors hover:text-destructive"
            onClick={() => removeDate(date.id)}
            type="button"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FieldGroup>
          <Label htmlFor={`${uid}-date-${date.id}`}>Dato *</Label>
          <Input
            id={`${uid}-date-${date.id}`}
            onChange={(event) =>
              updateDate(date.id, "startDate", event.target.value)
            }
            required={index === 0}
            type="date"
            value={date.startDate}
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor={`${uid}-starttime-${date.id}`}>
            Starttid
            <span className="ml-1 font-sans font-normal text-foreground/40">
              (anbefalt)
            </span>
          </Label>
          <Input
            id={`${uid}-starttime-${date.id}`}
            onChange={(event) =>
              updateDate(date.id, "startTime", event.target.value)
            }
            type="time"
            value={date.startTime}
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor={`${uid}-endtime-${date.id}`}>
            Sluttid
            <span className="ml-1 font-sans font-normal text-foreground/40">
              (valgfritt)
            </span>
          </Label>
          <Input
            id={`${uid}-endtime-${date.id}`}
            onChange={(event) =>
              updateDate(date.id, "endTime", event.target.value)
            }
            type="time"
            value={date.endTime}
          />
        </FieldGroup>
      </div>
    </div>
  );
}

interface EventRecurrenceFieldsProps {
  isRecurring: boolean;
  onRecurrenceChange: (rrule: string) => void;
  onRecurringToggle: (isRecurring: boolean) => void;
}

function EventRecurrenceFields({
  isRecurring,
  onRecurrenceChange,
  onRecurringToggle,
}: EventRecurrenceFieldsProps) {
  return (
    <div className="space-y-4">
      <label className="group flex cursor-pointer items-start gap-3">
        <CheckboxSquare
          checked={isRecurring}
          onChange={onRecurringToggle}
        />
        <span>
          <span className="block font-heading text-sm text-foreground">
            Gjentagende arrangement
          </span>
          <span className="mt-0.5 block text-xs text-foreground/55">
            Arrangementet gjentas etter et fast mønster (f.eks. ukentlig quiz,
            månedlig konsert)
          </span>
        </span>
      </label>

      {isRecurring && (
        <EventFormRecurrenceBuilder onChange={onRecurrenceChange} />
      )}
    </div>
  );
}
