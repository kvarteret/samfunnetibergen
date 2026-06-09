"use client";

import { useId, useMemo } from "react";

import { useBookingForm } from "./bookingFormContext";
import {
  CheckboxSquare,
  FieldGroup,
  FieldHint,
  SectionHeader,
} from "@/components/ui/form-fields";
import { Label } from "@/components/ui/label";
import type { CresatBooking } from "@/lib/integrations/crescat/calendar";
import {
  type ClosedDate,
  combinedSlotRangesForDate,
  hasOpeningHoursRows,
  isoDate,
  type OpeningHours,
} from "@/lib/opening-hours";
import { cn } from "@/lib/utils";
import { durationHoursBetween, overlaps } from "../domain/availability";
import { isExternalBooker } from "../domain/formState";
import type { BookingRoom } from "../types";
import {
  BookingRoomAvailability,
  BookingRoomPicker,
} from "./BookingFormPrimitives";
import { BookingFormTimeSlotPicker } from "./BookingFormTimeSlotPicker";

const DATE_COUNT = 7;
const MINUTES_IN_DAY = 24 * 60;

interface BookingScheduleSectionProps {
  rooms: BookingRoom[];
  occupiedSlugs: Set<string>;
  roomBookings: CresatBooking[];
  selectedDateRoomBookings: CresatBooking[];
  hasConflict: boolean;
  selectedRoomTitle?: string;
  selectedRoom?: BookingRoom;
  openingHours: OpeningHours | null;
  closedDates: ClosedDate[];
}

export function BookingFormScheduleSection({
  rooms,
  occupiedSlugs,
  roomBookings,
  selectedDateRoomBookings,
  hasConflict,
  selectedRoomTitle,
  selectedRoom,
  openingHours,
  closedDates,
}: BookingScheduleSectionProps) {
  const uid = useId();
  const form = useBookingForm();
  const values = form.state.values;
  const durationHours =
    values.startTime && values.endTime
      ? durationHoursBetween(values.startTime, values.endTime)
      : 1;

  return (
    <section className="space-y-6">
      <SectionHeader number="02" title="Rom og tidspunkt" />
      {rooms.length > 0 ? (
        <BookingRoomPicker
          occupiedSlugs={occupiedSlugs}
          onChange={(v) => form.setFieldValue("roomSlug", v)}
          rooms={rooms}
          selectedSlug={values.roomSlug}
        />
      ) : (
        <FieldHint>
          Ingen rom er tilgjengelige for booking akkurat nå.
        </FieldHint>
      )}

      <div className="max-w-3xl space-y-4">
        <FieldGroup>
          <Label>Dato *</Label>
          <BookingAvailableDatePicker
            bookings={roomBookings}
            closedDates={closedDates}
            durationHours={durationHours}
            onChange={(v) => form.setFieldValue("startDate", v)}
            openingHours={openingHours}
            room={selectedRoom}
            selectedDate={values.startDate}
          />
        </FieldGroup>
        <BookingFormTimeSlotPicker
          closedDates={closedDates}
          date={values.startDate}
          doorsTime={values.doorsTime}
          endTime={values.endTime}
          onDoorsChange={(v) => form.setFieldValue("doorsTime", v)}
          onEndChange={(v) => form.setFieldValue("endTime", v)}
          onStartChange={(v) => form.setFieldValue("startTime", v)}
          openingHours={openingHours}
          roomOpeningHours={selectedRoom?.openingHours ?? null}
          startTime={values.startTime}
          uid={uid}
        />
      </div>

      {isExternalBooker(values.bookerType) && (
        <label className="group flex max-w-3xl cursor-pointer items-start gap-3">
          <CheckboxSquare
            checked={values.flexibleDates}
            onChange={(v) => form.setFieldValue("flexibleDates", v)}
          />
          <span className="text-sm leading-6 text-foreground/80">
            Dato og rom er fleksibelt. Kvarteret kan foreslå et annet tidspunkt
            eller rom hvis dette passer bedre.
          </span>
        </label>
      )}

      {selectedRoomTitle && values.startDate && (
        <BookingRoomAvailability
          bookings={selectedDateRoomBookings}
          hasConflict={hasConflict}
          roomTitle={selectedRoomTitle}
        />
      )}
    </section>
  );
}

// ─── BookingAvailableDatePicker ──────────────────────────────────────────────

interface BookingAvailableDatePickerProps {
  bookings: CresatBooking[];
  closedDates: ClosedDate[];
  durationHours: number;
  openingHours: OpeningHours | null;
  room?: BookingRoom;
  selectedDate: string;
  onChange: (date: string) => void;
}

function BookingAvailableDatePicker({
  bookings,
  closedDates,
  durationHours,
  openingHours,
  room,
  selectedDate,
  onChange,
}: BookingAvailableDatePickerProps) {
  const today = useMemo(() => isoDate(new Date()), []);
  const dates = useMemo(
    () =>
      Array.from({ length: DATE_COUNT }, (_, index) => {
        const date = new Date(today);
        date.setDate(date.getDate() + index);
        return isoDate(date);
      }),
    [today],
  );

  if (!room) {
    return <FieldHint>Velg et rom for å se ledige dager.</FieldHint>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-1.5 pb-1">
        {dates.map((date) => {
          const available = dateHasAvailableRoomSlot(
            date,
            durationHours,
            bookings,
            openingHours,
            room.openingHours,
            closedDates,
          );
          const isSelected = date === selectedDate;
          const d = new Date(date);
          const weekday = d.toLocaleDateString("nb-NO", { weekday: "short" });
          const day = d.getDate();
          const month = d
            .toLocaleDateString("nb-NO", { month: "short" })
            .replace(".", "");

          const slotClass = cn(
            "flex min-w-[52px] shrink-0 flex-col items-center gap-0.5 border-2 px-2.5 py-2 transition-colors",
            isSelected && "border-primary bg-primary text-primary-foreground",
            !isSelected && available && "cursor-pointer border-border hover:bg-muted",
            !isSelected && !available && "cursor-not-allowed border-border/30 text-foreground/25",
          );

          return (
            <button
              key={date}
              className={slotClass}
              disabled={!available}
              onClick={() => onChange(date)}
              type="button"
            >
              <span className="text-[10px] uppercase tracking-widest">
                {weekday}
              </span>
              <span className="font-heading text-base leading-none">{day}</span>
              <span className="text-[10px]">{month}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function dateHasAvailableRoomSlot(
  date: string,
  durationHours: number,
  bookings: CresatBooking[],
  openingHours: OpeningHours | null,
  roomOpeningHours: OpeningHours | null,
  closedDates: ClosedDate[],
): boolean {
  const slotStarts = combinedSlotRangesForDate(
    date,
    durationHours,
    openingHours,
    roomOpeningHours,
    closedDates,
    30,
  );
  const hasHours =
    hasOpeningHoursRows(openingHours) || hasOpeningHoursRows(roomOpeningHours);
  const sameDaySlotStarts = slotStarts.filter(
    (slotStartMin) => slotStartMin < MINUTES_IN_DAY,
  );
  const candidateStarts =
    slotStarts.length > 0 || hasHours
      ? sameDaySlotStarts
      : Array.from({ length: 48 }, (_, index) => index * 30);

  return candidateStarts.some((slotStartMin) => {
    const startMs =
      new Date(`${date}T00:00:00`).getTime() + slotStartMin * 60_000;
    const endMs = startMs + durationHours * 60 * 60_000;
    return !bookings.some((booking) => overlaps(startMs, endMs, booking));
  });
}
