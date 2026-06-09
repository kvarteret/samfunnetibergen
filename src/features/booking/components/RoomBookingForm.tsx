"use client";

import { ArrowRight, Loader2, X } from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useState,
  useTransition,
} from "react";

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
import {
  type BookingFormState,
  buildBookingPayload,
  canSubmitBooking,
  initialBookingState,
  reducer,
} from "../domain/formState";
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
  const uid = useId();
  const [isPending, startTransition] = useTransition();
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [bookings, setBookings] = useState<CresatBooking[]>([]);
  const today = useMemo(() => isoDate(new Date()), []);
  const [state, dispatch] = useReducer(reducer, rooms, (currentRooms) => ({
    ...initialBookingState,
    roomSlug: currentRooms[0]?.slug ?? "",
  }));

  const setField =
    <Key extends keyof BookingFormState>(key: Key) =>
    (value: BookingFormState[Key]) => {
      dispatch({ type: "SET", key, value });
    };

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.slug === state.roomSlug),
    [rooms, state.roomSlug],
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
    if (!state.startDate) return [];
    const [dayStartMs, dayEndMs] = slotRangeMs(
      state.startDate,
      "00:00",
      "00:00",
    );
    return roomBookings.filter((booking) =>
      overlaps(dayStartMs, dayEndMs, booking),
    );
  }, [roomBookings, state.startDate]);

  const hasConflict = useMemo(() => {
    if (!state.startDate || selectedDateRoomBookings.length === 0) return false;
    const [startMs, endMs] = slotRangeMs(
      state.startDate,
      state.startTime,
      state.endTime,
    );
    return selectedDateRoomBookings.some((b) => overlaps(startMs, endMs, b));
  }, [
    state.startDate,
    state.startTime,
    state.endTime,
    selectedDateRoomBookings,
  ]);

  const occupiedSlugs = useMemo(() => {
    if (!state.startDate) return new Set<string>();
    return new Set(
      rooms
        .filter((room) =>
          isRoomOccupied(
            bookings,
            room.crescatRoomId,
            state.startDate,
            state.startTime,
            state.endTime,
          ),
        )
        .map((room) => room.slug),
    );
  }, [rooms, bookings, state.startDate, state.startTime, state.endTime]);

  // When house hours are known, the chosen slot must fit inside an open
  // range; with no hours configured we don't constrain.
  const slotWithinHours = useMemo(() => {
    const hasConfiguredHours =
      hasOpeningHoursRows(openingHours) ||
      hasOpeningHoursRows(selectedRoom?.openingHours ?? null);
    if (
      !hasConfiguredHours ||
      !state.startDate ||
      !state.startTime ||
      !state.endTime
    ) {
      return !hasConfiguredHours;
    }
    return isSlotAllowedForCombinedHours(
      state.startDate,
      state.startTime,
      durationHoursBetween(state.startTime, state.endTime),
      openingHours,
      selectedRoom?.openingHours ?? null,
      closedDates,
    );
  }, [
    openingHours,
    selectedRoom,
    closedDates,
    state.startDate,
    state.startTime,
    state.endTime,
  ]);

  const canSubmit =
    canSubmitBooking(state, Boolean(selectedRoom), hasConflict) &&
    slotWithinHours;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !selectedRoom) return;

    startTransition(async () => {
      const result = await submitRoomBooking(
        buildBookingPayload(state, selectedRoom),
      );
      if (result.ok) {
        setSubmitStatus("success");
      } else {
        setSubmitStatus("error");
        setErrorMessage(result.error);
      }
    });
  };

  if (submitStatus === "success") {
    return <BookingSuccess />;
  }

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form className="min-w-0 space-y-14" noValidate onSubmit={handleSubmit}>
        <BookingBookerTypeSection setField={setField} state={state} uid={uid} />
        <BookingScheduleSection
          closedDates={closedDates}
          hasConflict={hasConflict}
          occupiedSlugs={occupiedSlugs}
          openingHours={openingHours}
          roomBookings={roomBookings}
          rooms={rooms}
          selectedDateRoomBookings={selectedDateRoomBookings}
          selectedRoom={selectedRoom}
          selectedRoomTitle={selectedRoom?.title ?? selectedRoom?.slug}
          setField={setField}
          state={state}
          uid={uid}
        />
        <BookingEventDetailsSection
          setField={setField}
          state={state}
          uid={uid}
        />
        <BookingNeedsSection setField={setField} state={state} uid={uid} />
        <BookingCateringBarSection
          setField={setField}
          state={state}
          uid={uid}
        />
        <BookingTicketSection setField={setField} state={state} uid={uid} />
        <BookingContactSection setField={setField} state={state} uid={uid} />
        <BookingTermsSection setField={setField} state={state} />

        <section className="space-y-4 border-t-2 border-border pt-8">
          {!slotWithinHours && state.startDate && (
            <p className="max-w-3xl text-sm text-destructive">
              Valgt start- eller sluttid er utenfor husets åpningstider for
              denne dagen.
            </p>
          )}
          {submitStatus === "error" && (
            <div className="flex max-w-3xl items-start gap-3 border-2 border-destructive bg-destructive/10 px-4 py-3">
              <X
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-destructive"
              />
              <div>
                <p className="text-sm font-heading text-destructive">
                  Det oppstod en feil
                </p>
                <p className="mt-0.5 text-sm text-foreground/70">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}
          <Button
            className="w-full sm:w-auto"
            disabled={isPending || !canSubmit}
            size="lg"
            type="submit"
          >
            {isPending ? (
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
        <BookingOrderSummary selectedRoom={selectedRoom} state={state} />
      </div>
    </div>
  );
}

function BookingSuccess() {
  return (
    <div className="max-w-2xl space-y-4 border-2 border-primary bg-primary/5 p-8">
      <p className="font-heading text-xl text-foreground">
        Forespørsel mottatt!
      </p>
      <p className="text-sm leading-6 text-foreground/70">
        Takk for din bookingforespørsel. Vi behandler den så fort vi kan og tar
        kontakt på e-post.
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
