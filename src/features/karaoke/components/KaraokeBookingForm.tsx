"use client";

import { useForm } from "@tanstack/react-form";
import type { FormEvent } from "react";
import { useEffect, useId, useMemo, useState } from "react";

import { fetchKaraokeAvailability } from "../actions/karaoke-availability";
import { submitKaraokeBooking } from "../actions/submit-karaoke-booking";
import type { CresatBooking } from "@/lib/integrations/crescat/calendar";
import {
  type ClosedDate,
  isoDate,
  type OpeningHours,
  slotRangesForDate,
} from "@/lib/opening-hours";
import {
  KARAOKE_DATE_COUNT,
  slotOverlapsKaraokeBookings,
} from "../domain/availability";
import {
  buildKaraokePayload,
  canSubmitKaraokeBooking,
  deriveKaraokeState,
  initialKaraokeState,
  type KaraokeFormState,
} from "../domain/formState";
import type { KaraokeRoom } from "../types";
import { KaraokeFormContext } from "./karaokeFormContext";
import { KaraokeDetailsSection } from "./KaraokeDetailsSection";
import { KaraokePackageSection } from "./KaraokePackageSection";
import { KaraokeContactSection } from "./KaraokeContactSection";
import { KaraokeTermsSection } from "./KaraokeTermsSection";
import { KaraokeSubmitSection, KaraokeBookingSuccess } from "./KaraokeSubmitSection";
import { KaraokeOrderPreview } from "./KaraokeOrderSummary";
import { KaraokeRoomCard } from "./KaraokeRoomCard";

interface KaraokeBookingFormProps {
  room: KaraokeRoom;
  operationsManagerHours?: OpeningHours | null;
  houseClosedDates?: ClosedDate[] | null;
}

export function KaraokeBookingForm({
  room,
  operationsManagerHours,
  houseClosedDates,
}: KaraokeBookingFormProps) {
  const uid = useId();
  const [bookings, setBookings] = useState<CresatBooking[]>([]);
  const today = useMemo(() => isoDate(new Date()), []);

  const form = useForm({
    defaultValues: initialKaraokeState as KaraokeFormState,
    onSubmit: async ({ value }) => {
      const derived = deriveKaraokeState(value);
      const result = await submitKaraokeBooking(
        buildKaraokePayload(value, derived),
      );
      if (!result.ok) throw new Error(result.error);
    },
  });

  const derived = useMemo(
    () => deriveKaraokeState(form.state.values),
    [form.state.values],
  );

  useEffect(() => {
    const end = new Date(today);
    end.setDate(end.getDate() + KARAOKE_DATE_COUNT);
    fetchKaraokeAvailability(today, isoDate(end)).then(setBookings);
  }, [today]);

  useEffect(() => {
    const values = form.state.values;
    if (!values.startDate || values.startSlotMin === null) return;
    const allowedSlots = slotRangesForDate(
      values.startDate,
      values.duration,
      operationsManagerHours,
      houseClosedDates,
    );
    const slotTaken = slotOverlapsKaraokeBookings(
      values.startDate,
      values.startSlotMin,
      values.duration,
      bookings,
    );
    if (!allowedSlots.includes(values.startSlotMin) || slotTaken) {
      form.setFieldValue("startSlotMin", null);
    }
  }, [
    bookings,
    houseClosedDates,
    operationsManagerHours,
    form.state.values.duration,
    form.state.values.startDate,
    form.state.values.startSlotMin,
  ]);

  if (form.state.isSubmitSuccessful) {
    return <KaraokeBookingSuccess />;
  }

  return (
    <KaraokeFormContext.Provider value={form}>
      <div className="grid gap-12 items-start lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <form
          className="min-w-0 space-y-14"
          noValidate
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (!canSubmitKaraokeBooking(form.state.values)) return;
            form.handleSubmit();
          }}
        >
          <KaraokeDetailsSection
            derived={derived}
            uid={uid}
            today={today}
            bookings={bookings}
            houseClosedDates={houseClosedDates}
            operationsManagerHours={operationsManagerHours}
          />
          <KaraokePackageSection uid={uid} derived={derived} />
          <KaraokeContactSection uid={uid} />
          <KaraokeTermsSection />
          <KaraokeSubmitSection />
        </form>

        <aside className="space-y-5 lg:sticky lg:top-8">
          <KaraokeOrderPreview derived={derived} />
          <KaraokeRoomCard room={room} />
        </aside>
      </div>
    </KaraokeFormContext.Provider>
  );
}
