"use client";

import { useMemo } from "react";

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
import {
  type BookingFormState,
  isExternalBooker,
  type SetBookingField,
} from "../domain/formState";
import type { BookingRoom } from "../types";
import {
  BookingRoomAvailability,
  BookingRoomPicker,
} from "./BookingPrimitives";
import { TimeSlotPicker } from "./TimeSlotPicker";

const DATE_COUNT = 7;
const MINUTES_IN_DAY = 24 * 60;

interface BookingScheduleSectionProps {
  state: BookingFormState;
  setField: SetBookingField;
  uid: string;
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

export function BookingScheduleSection({
  state,
  setField,
  uid,
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
  const durationHours =
    state.startTime && state.endTime
      ? durationHoursBetween(state.startTime, state.endTime)
      : 1;

  return (
    <section className="space-y-6">
      <SectionHeader number="02" title="Rom og tidspunkt" />
      {rooms.length > 0 ? (
        <BookingRoomPicker
          occupiedSlugs={occupiedSlugs}
          onChange={setField("roomSlug")}
          rooms={rooms}
          selectedSlug={state.roomSlug}
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
            onChange={setField("startDate")}
            openingHours={openingHours}
            room={selectedRoom}
            selectedDate={state.startDate}
          />
        </FieldGroup>
        <TimeSlotPicker
          closedDates={closedDates}
          date={state.startDate}
          doorsTime={state.doorsTime}
          endTime={state.endTime}
          onDoorsChange={setField("doorsTime")}
          onEndChange={setField("endTime")}
          onStartChange={setField("startTime")}
          openingHours={openingHours}
          roomOpeningHours={selectedRoom?.openingHours ?? null}
          startTime={state.startTime}
          uid={uid}
        />
      </div>

      {isExternalBooker(state.bookerType) && (
        <label className="group flex max-w-3xl cursor-pointer items-start gap-3">
          <CheckboxSquare
            checked={state.flexibleDates}
            onChange={setField("flexibleDates")}
          />
          <span className="text-sm leading-6 text-foreground/80">
            Dato og rom er fleksibelt. Kvarteret kan foreslå et annet tidspunkt
            eller rom hvis dette passer bedre.
          </span>
        </label>
      )}

      {selectedRoomTitle && state.startDate && (
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

          return (
            <button
              key={date}
              className={cn(
                "flex min-w-[52px] shrink-0 flex-col items-center gap-0.5 border-2 px-2.5 py-2 transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : available
                    ? "cursor-pointer border-border hover:bg-muted"
                    : "cursor-not-allowed border-border/30 text-foreground/25",
              )}
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
