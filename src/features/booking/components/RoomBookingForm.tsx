"use client";

import { useForm } from "@tanstack/react-form";
import { ArrowRight, Loader2, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { BookingFormContext } from "./bookingFormContext";
import { fetchRoomAvailability } from "../actions/room-availability";
import { submitRoomBooking } from "../actions/submit-room-booking";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { CresatBooking } from "@/lib/integrations/crescat/calendar";
import { addDaysDateOnly } from "@/lib/integrations/crescat/datetime";
import {
  type ClosedDate,
  hasOpeningHoursRows,
  isoDate,
  isSlotAllowedForCombinedHours,
  type OpeningHours,
} from "@/lib/opening-hours";
import {
  durationHoursBetween,
  isRoomOccupied,
  overlaps,
  slotRangeMs,
} from "../domain/availability";
import { buildBookingPayload, canSubmitBooking, initialBookingState } from "../domain/formState";
import type { BookingRoom } from "../types";
import { BookingOrderSummary } from "./BookingOrderSummary";
import { BookingBookerTypeSection } from "./BookingBookerTypeSection";
import { BookingCateringBarSection } from "./BookingCateringBarSection";
import { BookingContactSection } from "./BookingContactSection";
import { BookingEventDetailsSection } from "./BookingEventDetailsSection";
import { BookingNeedsSection } from "./BookingNeedsSection";
import { BookingScheduleSection } from "./BookingScheduleSection";
import { BookingTermsSection } from "./BookingTermsSection";
import { BookingTicketSection } from "./BookingTicketSection";

// TODO: resolve form type when @tanstack/react-form stabilizes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BookingFormValues = typeof initialBookingState & {
  roomSlug: string;
};

const DATE_COUNT = 7;

interface RoomBookingFormProps {
  rooms: BookingRoom[];
  openingHours: OpeningHours | null;
  closedDates: ClosedDate[];
}

export function RoomBookingForm({
  rooms,
  openingHours,
  closedDates,
}: RoomBookingFormProps) {
  const [bookings, setBookings] = useState<CresatBooking[]>([]);
  const today = useMemo(() => isoDate(new Date()), []);

  const form = useForm({
    defaultValues: {
      ...initialBookingState,
      roomSlug: rooms[0]?.slug ?? "",
    } as BookingFormValues,
    onSubmit: async ({ value }) => {
      const room = rooms.find((r) => r.slug === value.roomSlug);
      if (!room) throw new Error("Ingen rom valgt");
      const result = await submitRoomBooking(
        buildBookingPayload(value, room),
      );
      if (!result.ok) throw new Error(result.error);
    },
  });

  const values = form.state.values;

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.slug === values.roomSlug),
    [rooms, values.roomSlug],
  );

  useEffect(() => {
    if (!today) return;
    let active = true;
    fetchRoomAvailability(today, addDaysDateOnly(today, DATE_COUNT)).then(
      (result) => {
        if (active) setBookings(result);
      },
    );
    return () => {
      active = false;
    };
  }, [today]);

  const roomBookings = useMemo(
    () =>
      selectedRoom
        ? bookings.filter((b) => b.resourceId === selectedRoom.crescatRoomId)
        : [],
    [bookings, selectedRoom],
  );

  const selectedDateRoomBookings = useMemo(() => {
    if (!values.startDate) return [];
    const [dayStartMs, dayEndMs] = slotRangeMs(values.startDate, "00:00", "00:00");
    return roomBookings.filter((booking) => overlaps(dayStartMs, dayEndMs, booking));
  }, [roomBookings, values.startDate]);

  const hasConflict = useMemo(() => {
    if (!values.startDate || selectedDateRoomBookings.length === 0) return false;
    const [startMs, endMs] = slotRangeMs(values.startDate, values.startTime, values.endTime);
    return selectedDateRoomBookings.some((b) => overlaps(startMs, endMs, b));
  }, [values.startDate, values.startTime, values.endTime, selectedDateRoomBookings]);

  const occupiedSlugs = useMemo(() => {
    if (!values.startDate) return new Set<string>();
    return new Set(
      rooms
        .filter((room) =>
          isRoomOccupied(bookings, room.crescatRoomId, values.startDate, values.startTime, values.endTime),
        )
        .map((room) => room.slug),
    );
  }, [rooms, bookings, values.startDate, values.startTime, values.endTime]);

  const slotWithinHours = useMemo(() => {
    const hasConfiguredHours =
      hasOpeningHoursRows(openingHours) ||
      hasOpeningHoursRows(selectedRoom?.openingHours ?? null);
    if (!hasConfiguredHours || !values.startDate || !values.startTime || !values.endTime) {
      return !hasConfiguredHours;
    }
    return isSlotAllowedForCombinedHours(
      values.startDate,
      values.startTime,
      durationHoursBetween(values.startTime, values.endTime),
      openingHours,
      selectedRoom?.openingHours ?? null,
      closedDates,
    );
  }, [openingHours, selectedRoom, closedDates, values.startDate, values.startTime, values.endTime]);

  const canSubmit =
    canSubmitBooking(values, Boolean(selectedRoom), hasConflict) && slotWithinHours;

  if (form.state.isSubmitSuccessful) {
    return (
      <div className="max-w-2xl space-y-4 border-2 border-primary bg-primary/5 p-8">
        <p className="font-heading text-xl text-foreground">Forespørsel mottatt!</p>
        <p className="text-sm leading-6 text-foreground/70">
          Takk for din bookingforespørsel. Vi behandler den så fort vi kan og tar kontakt på e-post.
        </p>
        <Link
          className="inline-flex text-sm uppercase tracking-[0.18em] underline underline-offset-4 text-primary"
          href="/rom"
        >
          Tilbake til rom
        </Link>
      </div>
    );
  }

  const submitError = form.state.errorMap.onSubmit;

  return (
    <BookingFormContext.Provider value={form}>
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        className="min-w-0 space-y-14"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <BookingBookerTypeSection />
        <BookingScheduleSection
          rooms={rooms}
          selectedRoom={selectedRoom}
          roomBookings={roomBookings}
          selectedDateRoomBookings={selectedDateRoomBookings}
          occupiedSlugs={occupiedSlugs}
          openingHours={openingHours}
          closedDates={closedDates}
          hasConflict={hasConflict}
        />
        <BookingEventDetailsSection />
        <BookingNeedsSection />
        <BookingCateringBarSection />
        <BookingTicketSection />
        <BookingContactSection />
        <BookingTermsSection />

        <section className="space-y-4 border-t-2 border-border pt-8">
          {!slotWithinHours && values.startDate && (
            <p className="max-w-3xl text-sm text-destructive">
              Valgt start- eller sluttid er utenfor husets åpningstider for denne dagen.
            </p>
          )}
          {submitError && (
            <div className="flex max-w-3xl items-start gap-3 border-2 border-destructive bg-destructive/10 px-4 py-3">
              <X aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-heading text-destructive">Det oppstod en feil</p>
                <p className="mt-0.5 text-sm text-foreground/70">{String(submitError)}</p>
              </div>
            </div>
          )}
          <Button
            className="w-full sm:w-auto"
            disabled={form.state.isSubmitting || !canSubmit}
            size="lg"
            type="submit"
          >
            {form.state.isSubmitting ? (
              <>
                <Loader2 aria-hidden className="animate-spin" />
                Sender inn...
              </>
            ) : (
              <>
                <ArrowRight aria-hidden />
                Send bookingforespørsel
              </>
            )}
          </Button>
        </section>
      </form>

      <div className="order-first space-y-6 lg:order-none lg:sticky lg:top-24">
        <form.Subscribe selector={(s) => s.values}>
          {(values) => (
            <BookingOrderSummary selectedRoom={selectedRoom} state={values} />
          )}
        </form.Subscribe>
      </div>
    </div>
    </BookingFormContext.Provider>
  );
}
