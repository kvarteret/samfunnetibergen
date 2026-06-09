"use client";

import { useForm } from "@tanstack/react-form";
import { ChevronDown, ExternalLink, Loader2, Mic, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useId, useMemo, useState } from "react";

import { fetchKaraokeAvailability } from "../actions/karaoke-availability";
import { submitKaraokeBooking } from "../actions/submit-karaoke-booking";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckboxSquare,
  FieldGroup,
  FieldHint,
  SectionHeader,
} from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import type { CresatBooking } from "@/lib/integrations/crescat/calendar";
import {
  type ClosedDate,
  isoDate,
  minutesToTime,
  type OpeningHours,
  slotRangesForDate,
} from "@/lib/opening-hours";
import { cn } from "@/lib/utils";
import {
  dateHasKaraokeSlot,
  KARAOKE_DATE_COUNT,
  slotOverlapsKaraokeBookings,
} from "../domain/availability";
import {
  buildKaraokePayload,
  canSubmitKaraokeBooking,
  deriveKaraokeState,
  formatKaraokeDate,
  initialKaraokeState,
  KARAOKE_DURATION_OPTIONS,
  KARAOKE_PRICING,
  type KaraokeDerivedState,
  type KaraokeFormState,
} from "../domain/formState";
import type { KaraokeRoom, KaraokeRoomImage, PriceType } from "../types";
import { KaraokeFormContext, useKaraokeForm } from "./karaokeFormContext";

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

/* ── Details section ─────────────────────────────────────────────────── */

function KaraokeDetailsSection({
  uid,
  derived,
  today,
  bookings,
  operationsManagerHours,
  houseClosedDates,
}: {
  uid: string;
  derived: KaraokeDerivedState;
  today: string;
  bookings: CresatBooking[];
  operationsManagerHours?: OpeningHours | null;
  houseClosedDates?: ClosedDate[] | null;
}) {
  const form = useKaraokeForm();
  const values = form.state.values;

  return (
    <section className="space-y-6">
      <SectionHeader number="01" title="Detaljer" />

      <FieldGroup>
        <Label htmlFor={`${uid}-eventName`}>Navn på arrangement *</Label>
        <Input
          autoComplete="off"
          id={`${uid}-eventName`}
          onChange={(event) =>
            form.setFieldValue("eventName", event.target.value)
          }
          placeholder="F.eks. Bursdagsfeiring"
          required
          value={values.eventName}
        />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-duration`}>Varighet</Label>
        <KaraokeSelect
          id={`${uid}-duration`}
          value={String(values.duration)}
          onChange={(value) =>
            form.setFieldValue("duration", Number(value))
          }
        >
          {KARAOKE_DURATION_OPTIONS.map((hours) => (
            <option key={hours} value={hours}>
              {hours} {hours === 1 ? "time" : "timer"}
            </option>
          ))}
        </KaraokeSelect>
      </FieldGroup>

      {today && (
        <FieldGroup>
          <Label>Dato og tidspunkt *</Label>
          <KaraokeSlotPicker
            bookings={bookings}
            duration={values.duration}
            selectedDate={values.startDate}
            selectedSlotMin={values.startSlotMin}
            today={today}
            operationsManagerHours={operationsManagerHours}
            houseClosedDates={houseClosedDates}
            onDateChange={(date) => {
              form.setFieldValue("startDate", date);
              form.setFieldValue("startSlotMin", null);
            }}
            onSlotChange={(slotMin) =>
              form.setFieldValue("startSlotMin", slotMin)
            }
          />
          {derived.startTime && (
            <p className="text-sm text-foreground/60 font-heading mt-1">
              {derived.startTime} → {derived.endTime}
            </p>
          )}
        </FieldGroup>
      )}
    </section>
  );
}

/* ── Package section ─────────────────────────────────────────────────── */

function KaraokePackageSection({
  uid,
  derived,
}: {
  uid: string;
  derived: KaraokeDerivedState;
}) {
  const form = useKaraokeForm();
  const values = form.state.values;

  return (
    <section className="space-y-6">
      <SectionHeader number="02" title="Karaokepakke" />
      <KaraokePriceTypeTabs
        priceType={values.priceType as PriceType}
        onChange={(v) => form.setFieldValue("priceType", v)}
      />
      <KaraokePackageNotice priceType={values.priceType as PriceType} />
      {values.priceType !== "frivillig" && (
        <KaraokePeopleField uid={uid} />
      )}
      {derived.people > 0 && values.priceType !== "frivillig" && (
        <KaraokeTotalPrice derived={derived} />
      )}
    </section>
  );
}

/* ── Contact section ─────────────────────────────────────────────────── */

function KaraokeContactSection({ uid }: { uid: string }) {
  const form = useKaraokeForm();

  return (
    <section className="space-y-6">
      <SectionHeader number="03" title="Kontaktinformasjon" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor={`${uid}-contactName`}>Navn *</Label>
          <Input
            autoComplete="name"
            id={`${uid}-contactName`}
            onChange={(event) =>
              form.setFieldValue("contactName", event.target.value)
            }
            placeholder="Fullt navn"
            required
            value={form.state.values.contactName}
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor={`${uid}-contactEmail`}>E-post *</Label>
          <Input
            autoComplete="email"
            id={`${uid}-contactEmail`}
            onChange={(event) =>
              form.setFieldValue("contactEmail", event.target.value)
            }
            placeholder="din@epost.no"
            required
            type="email"
            value={form.state.values.contactEmail}
          />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label htmlFor={`${uid}-contactPhone`}>Telefon</Label>
        <Input
          autoComplete="tel"
          id={`${uid}-contactPhone`}
          onChange={(event) =>
            form.setFieldValue("contactPhone", event.target.value)
          }
          placeholder="+47 55 55 55 55"
          type="tel"
          value={form.state.values.contactPhone}
        />
      </FieldGroup>
    </section>
  );
}

/* ── Terms section ───────────────────────────────────────────────────── */

function KaraokeTermsSection() {
  const form = useKaraokeForm();
  const values = form.state.values;
  const priceType = values.priceType as PriceType;

  return (
    <section className="space-y-4">
      <SectionHeader number="04" title="Vilkår" />
      <label className="group flex cursor-pointer items-start gap-3">
        <CheckboxSquare
          checked={values.acceptTerms}
          onChange={(v) => form.setFieldValue("acceptTerms", v)}
        />
        <span className="text-sm leading-6 text-foreground/80">
          Ved å krysse av denne boksen aksepterer jeg at jeg har lest, forstått
          og godkjenner{" "}
          <Link
            className="underline underline-offset-2 hover:text-foreground transition-colors"
            href="/vilkar-for-leie-av-karaoke"
          >
            bruksvilkårene
          </Link>
          .
        </span>
      </label>
      {priceType === "student" && (
        <label className="group flex cursor-pointer items-start gap-3">
          <CheckboxSquare
            checked={values.studentProofAccepted}
            onChange={(v) =>
              form.setFieldValue("studentProofAccepted", v)
            }
          />
          <span className="text-sm leading-6 text-foreground/80">
            Jeg lover å ta med studentbevis 🤞
          </span>
        </label>
      )}
    </section>
  );
}

/* ── Submit section ──────────────────────────────────────────────────── */

function KaraokeSubmitSection() {
  const form = useKaraokeForm();
  const values = form.state.values;
  const priceType = values.priceType as PriceType;
  const isPending = form.state.isSubmitting;
  const submitError = form.state.errorMap.onSubmit;

  return (
    <section className="space-y-4 border-t-2 border-border pt-8">
      {submitError && (
        <div className="flex items-start gap-3 border-2 border-destructive bg-destructive/10 px-4 py-3">
          <X
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-destructive"
          />
          <div>
            <p className="text-sm font-heading text-destructive">
              Det oppstod en feil
            </p>
            <p className="mt-0.5 text-sm text-foreground/70">
              {submitError.message}
            </p>
          </div>
        </div>
      )}
      <Button
        className="w-full sm:w-auto"
        disabled={
          isPending ||
          !values.acceptTerms ||
          (priceType === "student" && !values.studentProofAccepted)
        }
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
            <Mic aria-hidden />
            Send bookingforespørsel
          </>
        )}
      </Button>
    </section>
  );
}

/* ── Success view ────────────────────────────────────────────────────── */

function KaraokeBookingSuccess() {
  return (
    <Card className="space-y-4 border-primary bg-primary/5 p-8 py-8">
      <p className="font-heading text-xl text-foreground">
        Forespørsel mottatt!
      </p>
      <p className="text-sm leading-6 text-foreground/70">
        Takk for din bookingforespørsel. Vi behandler den så fort vi kan og tar
        kontakt på e-post.
      </p>
    </Card>
  );
}

/* ── Slot picker (prop-based — external data only) ───────────────────── */

function KaraokeSlotPicker({
  bookings,
  duration,
  selectedDate,
  selectedSlotMin,
  today,
  operationsManagerHours,
  houseClosedDates,
  onDateChange,
  onSlotChange,
}: {
  bookings: CresatBooking[];
  duration: number;
  selectedDate: string;
  selectedSlotMin: number | null;
  today: string;
  operationsManagerHours?: OpeningHours | null;
  houseClosedDates?: ClosedDate[] | null;
  onDateChange: (date: string) => void;
  onSlotChange: (slotMin: number | null) => void;
}) {
  const dates = useMemo(() => buildKaraokeDates(today), [today]);

  return (
    <div className="space-y-4">
      <KaraokeDateScroller
        bookings={bookings}
        dates={dates}
        duration={duration}
        houseClosedDates={houseClosedDates}
        operationsManagerHours={operationsManagerHours}
        selectedDate={selectedDate}
        today={today}
        onDateChange={onDateChange}
      />
      {selectedDate && (
        <KaraokeSlotGrid
          bookings={bookings}
          duration={duration}
          houseClosedDates={houseClosedDates}
          operationsManagerHours={operationsManagerHours}
          selectedDate={selectedDate}
          selectedSlotMin={selectedSlotMin}
          onSlotChange={onSlotChange}
        />
      )}
    </div>
  );
}

function KaraokeDateScroller({
  bookings,
  dates,
  duration,
  selectedDate,
  today,
  operationsManagerHours,
  houseClosedDates,
  onDateChange,
}: {
  bookings: CresatBooking[];
  dates: string[];
  duration: number;
  selectedDate: string;
  today: string;
  operationsManagerHours?: OpeningHours | null;
  houseClosedDates?: ClosedDate[] | null;
  onDateChange: (date: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1.5 pb-1 min-w-max">
        {dates.map((date) => (
          <KaraokeDateButton
            available={dateHasKaraokeSlot(
              date,
              duration,
              bookings,
              operationsManagerHours,
              houseClosedDates,
            )}
            date={date}
            isSelected={date === selectedDate}
            isToday={date === today}
            key={date}
            onClick={() => onDateChange(date)}
          />
        ))}
      </div>
    </div>
  );
}

function KaraokeDateButton({
  available,
  date,
  isSelected,
  isToday,
  onClick,
}: {
  available: boolean;
  date: string;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
}) {
  const parsedDate = new Date(date);
  const weekday = parsedDate.toLocaleDateString("nb-NO", {
    weekday: "short",
  });
  const month = parsedDate
    .toLocaleDateString("nb-NO", { month: "short" })
    .replace(".", "");

  return (
    <button
      key={date}
      type="button"
      disabled={!available}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2.5 py-2 border-2 min-w-[52px] transition-colors shrink-0",
        getDateButtonClass(isSelected, available, isToday),
      )}
    >
      <span className="text-[10px] uppercase tracking-widest">
        {weekday}
      </span>
      <span className="text-base font-heading leading-none">
        {parsedDate.getDate()}
      </span>
      <span className="text-[10px]">{month}</span>
    </button>
  );
}

function KaraokeSlotGrid({
  bookings,
  duration,
  selectedDate,
  selectedSlotMin,
  operationsManagerHours,
  houseClosedDates,
  onSlotChange,
}: {
  bookings: CresatBooking[];
  duration: number;
  selectedDate: string;
  selectedSlotMin: number | null;
  operationsManagerHours?: OpeningHours | null;
  houseClosedDates?: ClosedDate[] | null;
  onSlotChange: (slotMin: number | null) => void;
}) {
  const slots = slotRangesForDate(
    selectedDate,
    duration,
    operationsManagerHours,
    houseClosedDates,
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-heading uppercase tracking-[0.12em] text-foreground/50">
        Velg starttidspunkt
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {slots.map((slotMin) => (
          <KaraokeSlotButton
            date={selectedDate}
            bookings={bookings}
            duration={duration}
            isSelected={selectedSlotMin === slotMin}
            key={slotMin}
            slotMin={slotMin}
            onClick={() => onSlotChange(slotMin)}
          />
        ))}
      </div>
    </div>
  );
}

function KaraokeSlotButton({
  bookings,
  date,
  duration,
  isSelected,
  slotMin,
  onClick,
}: {
  bookings: CresatBooking[];
  date: string;
  duration: number;
  isSelected: boolean;
  slotMin: number;
  onClick: () => void;
}) {
  const taken = slotOverlapsKaraokeBookings(
    date,
    slotMin,
    duration,
    bookings,
  );

  return (
    <button
      key={slotMin}
      type="button"
      disabled={taken}
      onClick={onClick}
      className={cn(
        "py-2.5 text-sm font-heading border-2 text-center transition-colors",
        getSlotButtonClass(isSelected, taken),
      )}
    >
      {minutesToTime(slotMin)}
    </button>
  );
}

/* ── Price type tabs ─────────────────────────────────────────────────── */

function KaraokePriceTypeTabs({
  priceType,
  onChange,
}: {
  priceType: PriceType;
  onChange: (value: PriceType) => void;
}) {
  return (
    <div className="flex border-2 border-border" role="tablist">
      {(["ordinær", "student", "frivillig"] as const).map((type) => (
        <button
          aria-pressed={priceType === type}
          className={cn(
            "flex-1 py-2.5 text-sm font-heading uppercase tracking-[0.12em] transition-colors",
            priceType === type
              ? "bg-primary text-primary-foreground"
              : "text-foreground/60 hover:bg-muted hover:text-foreground",
          )}
          key={type}
          onClick={() => onChange(type)}
          type="button"
        >
          {type}
        </button>
      ))}
    </div>
  );
}

function KaraokePackageNotice({ priceType }: { priceType: PriceType }) {
  if (priceType === "frivillig") {
    return (
      <Card className="space-y-2 bg-card p-4 py-4">
        <p className="text-sm font-heading text-foreground">
          Gratis for interne frivillige
        </p>
        <p className="text-sm text-foreground/70 leading-6">
          Som intern frivillig kan du bruke karaokerommet gratis, men eksterne
          bookinger har alltid prioritet. En ekstern booking kan overta rommet
          ved å booke senest{" "}
          <strong className="font-heading text-foreground">
            12 timer før
          </strong>{" "}
          — i så fall vil du bli varslet og bookingen din kanselleres.
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-card p-4 py-4">
      <div className="flex justify-between text-sm">
        <span className="text-foreground/60">Timepris per person</span>
        <span className="font-heading">
          {KARAOKE_PRICING[priceType].perPerson} kr
        </span>
      </div>
    </Card>
  );
}

function KaraokePeopleField({ uid }: { uid: string }) {
  const form = useKaraokeForm();
  const values = form.state.values;

  return (
    <FieldGroup>
      <Label htmlFor={`${uid}-people`}>Antall personer *</Label>
      <KaraokeSelect
        id={`${uid}-people`}
        value={values.numberOfPeople}
        onChange={(v) => form.setFieldValue("numberOfPeople", v)}
      >
        {Array.from({ length: 25 }, (_, index) => index + 1).map(
          (count) => (
            <option key={count} value={count}>
              {count} {count === 1 ? "person" : "personer"}
            </option>
          ),
        )}
      </KaraokeSelect>
      <FieldHint>
        Minimumspris er{" "}
        {KARAOKE_PRICING[values.priceType as PriceType].minPerHour} kr per
        time.
      </FieldHint>
    </FieldGroup>
  );
}

function KaraokeSelect({
  children,
  id,
  value,
  onChange,
}: {
  children: ReactNode;
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative max-w-[180px]">
      <select
        className="w-full appearance-none border-2 border-border bg-background px-3 py-2 pr-9 text-sm font-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50"
      />
    </div>
  );
}

function KaraokeTotalPrice({ derived }: { derived: KaraokeDerivedState }) {
  return (
    <div className="border-2 border-primary bg-primary/5 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-foreground/70">Totalpris</span>
        <div className="text-right">
          <span className="font-heading text-2xl text-primary">
            {derived.totalPrice.toLocaleString("nb-NO")} kr
          </span>
          <p className="text-xs text-foreground/50 mt-0.5">
            {Math.round(
              derived.totalPrice / derived.people,
            ).toLocaleString("nb-NO")}{" "}
            kr per person
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Order preview ───────────────────────────────────────────────────── */

function KaraokeOrderPreview({
  derived,
}: {
  derived: KaraokeDerivedState;
}) {
  const form = useKaraokeForm();
  const values = form.state.values;
  const isEmpty = !values.eventName && !values.startDate && !derived.people;

  return (
    <Card className="space-y-4 bg-card p-5 py-5">
      <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/60">
        Bestillingsoversikt
      </p>
      {isEmpty ? (
        <p className="text-sm text-foreground/40 italic">
          Fyll ut skjemaet for å se en oversikt.
        </p>
      ) : (
        <div className="space-y-2 text-sm">
          {values.eventName && (
            <KaraokeSummaryRow label="Arrangement">
              {values.eventName}
            </KaraokeSummaryRow>
          )}
          <KaraokeSummaryRow label="Rom">
            Maos Lille Røde
          </KaraokeSummaryRow>
          {values.startDate && (
            <KaraokeSummaryRow label="Dato">
              <span className="capitalize">
                {formatKaraokeDate(values.startDate)}
              </span>
            </KaraokeSummaryRow>
          )}
          {derived.startTime && (
            <KaraokeSummaryRow label="Tid">
              {derived.startTime}
              {derived.endTime && ` → ${derived.endTime}`}
            </KaraokeSummaryRow>
          )}
          <KaraokeSummaryRow label="Varighet">
            {values.duration}{" "}
            {values.duration === 1 ? "time" : "timer"}
          </KaraokeSummaryRow>
          <KaraokeSummaryRow label="Pakke">
            <span className="capitalize">
              {values.priceType as string}
            </span>
          </KaraokeSummaryRow>
          {derived.people > 0 && (
            <KaraokeSummaryRow label="Antall">
              {derived.people}{" "}
              {derived.people === 1 ? "person" : "personer"}
            </KaraokeSummaryRow>
          )}
          <KaraokePriceSummary
            priceType={values.priceType as PriceType}
            people={derived.people}
            totalPrice={derived.totalPrice}
          />
        </div>
      )}
    </Card>
  );
}

function KaraokeSummaryRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-foreground/60 shrink-0">{label}</span>
      <span className="font-heading text-right truncate">{children}</span>
    </div>
  );
}

function KaraokePriceSummary({
  priceType,
  people,
  totalPrice,
}: {
  priceType: PriceType;
  people: number;
  totalPrice: number;
}) {
  if (priceType === "frivillig") {
    return (
      <div className="flex justify-between gap-4 border-t border-border pt-3 mt-3">
        <span className="text-foreground/60 shrink-0">Pris</span>
        <span className="font-heading text-primary text-lg">Gratis</span>
      </div>
    );
  }

  if (people <= 0) return null;

  return (
    <div className="flex justify-between gap-4 border-t border-border pt-3 mt-3">
      <span className="text-foreground/60 shrink-0">Pris</span>
      <span className="font-heading text-primary text-lg">
        {totalPrice.toLocaleString("nb-NO")} kr
      </span>
    </div>
  );
}

/* ── Room card ───────────────────────────────────────────────────────── */

function KaraokeRoomCard({ room }: { room: KaraokeRoom }) {
  const firstImage: KaraokeRoomImage | undefined = room.images?.[0];

  return (
    <Card className="space-y-4 bg-card p-5 py-5">
      <div className="aspect-video w-full bg-muted overflow-hidden border-2 border-border/50">
        {firstImage?.assetUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstImage.assetUrl}
            alt={firstImage.alt ?? room.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Mic className="size-10 text-foreground/20" aria-hidden />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <Link
          className="group flex items-center gap-1.5 font-heading text-base text-foreground hover:text-primary transition-colors"
          href={`/rom/${room.slug}`}
        >
          {room.title}
          <ExternalLink
            className="size-3.5 opacity-0 group-hover:opacity-60 transition-opacity"
            aria-hidden
          />
        </Link>
      </div>
      {room.summary && (
        <p className="text-sm leading-6 text-foreground/70">
          {room.summary}
        </p>
      )}
      {(room.capacitySeated || room.capacityStanding) && (
        <div className="border-t border-border pt-4 flex gap-6 text-sm">
          {room.capacitySeated && (
            <KaraokeRoomCapacity
              label="Sitteplasser"
              value={room.capacitySeated}
            />
          )}
          {room.capacityStanding && (
            <KaraokeRoomCapacity
              label="Ståplasser"
              value={room.capacityStanding}
            />
          )}
        </div>
      )}
    </Card>
  );
}

function KaraokeRoomCapacity({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <p className="font-heading text-xs uppercase tracking-[0.12em] text-foreground/50 mb-0.5">
        {label}
      </p>
      <p className="font-heading">{value}</p>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function buildKaraokeDates(today: string): string[] {
  return Array.from({ length: KARAOKE_DATE_COUNT }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() + index);
    return isoDate(date);
  });
}

function getDateButtonClass(
  isSelected: boolean,
  available: boolean,
  isToday: boolean,
): string {
  if (isSelected)
    return "bg-primary border-primary text-primary-foreground";
  if (available)
    return cn(
      "border-border hover:bg-muted cursor-pointer",
      isToday && "border-primary/50",
    );
  return "border-border/30 text-foreground/25 cursor-not-allowed";
}

function getSlotButtonClass(isSelected: boolean, taken: boolean): string {
  if (isSelected)
    return "bg-primary border-primary text-primary-foreground";
  if (taken) return "border-border/30 text-foreground/25 cursor-not-allowed";
  return "border-border hover:bg-muted";
}
