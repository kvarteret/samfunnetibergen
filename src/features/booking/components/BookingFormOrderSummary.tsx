import { CalendarClock, DoorOpen, MapPin, Users } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";

import {
  type BookerType,
  type BookingFormState,
  composeCatering,
  composeTechEquipment,
} from "../domain/formState";
import type { BookingRoom } from "../types";

const BOOKER_LABELS: Record<BookerType, string> = {
  ekstern: "Ekstern / privat",
  studentorg: "Studentorganisasjon",
  intern: "Intern",
};

interface BookingOrderSummaryProps {
  state: BookingFormState;
  selectedRoom?: BookingRoom;
}

export function BookingFormOrderSummary({
  state,
  selectedRoom,
}: BookingOrderSummaryProps) {
  const tech = composeTechEquipment(state);
  const catering = composeCatering(state);
  const time = state.startDate
    ? `${state.startDate} · ${state.startTime}–${state.endTime}`
    : "Ikke valgt";

  return (
    <aside>
      <Surface>
        <SelectedRoomCard room={selectedRoom} />

        <div className="space-y-3 p-5">
          <p className="font-heading text-sm uppercase tracking-[0.18em] text-foreground/55">
            Bestillingsoversikt
          </p>

          <dl className="space-y-2.5 text-sm">
            <SummaryRow icon={Users} label="Booker">
              {BOOKER_LABELS[state.bookerType]}
              {state.bookerType === "studentorg" && state.studentOrgName
                ? ` · ${state.studentOrgName}`
                : ""}
            </SummaryRow>
            <SummaryRow icon={CalendarClock} label="Tidspunkt">
              {time}
            </SummaryRow>
            {state.doorsTime && (
              <SummaryRow icon={DoorOpen} label="Dørene åpner">
                {state.doorsTime}
              </SummaryRow>
            )}
            {state.eventName.trim() && (
              <SummaryRow label="Arrangement">{state.eventName}</SummaryRow>
            )}
            {state.audienceCount.trim() && (
              <SummaryRow label="Publikum">
                {state.audienceCount} personer
              </SummaryRow>
            )}
            <SummaryRow label="Teknisk">{tech}</SummaryRow>
            {catering && (
              <SummaryRow label="Mat og bar">
                <span className="whitespace-pre-line">{catering}</span>
              </SummaryRow>
            )}
            <SummaryRow label="Billett">
              {state.freeOrPaid === "Betalt" && state.ticketTypes.trim()
                ? `Betalt · ${state.ticketTypes}`
                : state.freeOrPaid}
            </SummaryRow>
          </dl>
        </div>
      </Surface>
    </aside>
  );
}

function SelectedRoomCard({ room }: { room?: BookingRoom }) {
  if (!room) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center bg-muted text-sm text-foreground/45">
        <MapPin aria-hidden className="mr-2 size-4" />
        Velg et rom
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[16/9] bg-muted">
        {room.image?.assetUrl && (
          <Image
            alt={room.image.alt ?? room.title ?? room.slug}
            className="object-cover"
            fill
            sizes="(min-width: 1024px) 360px, 100vw"
            src={room.image.assetUrl}
          />
        )}
      </div>
      <div className="border-b-2 border-border p-5">
        <p className="font-heading text-xl leading-tight text-foreground">
          {room.title ?? room.slug}
        </p>
        <p className="mt-1 text-xs text-foreground/50">
          {[
            room.capacityStanding && `${room.capacityStanding} stående`,
            room.capacitySeated && `${room.capacitySeated} sittende`,
          ]
            .filter(Boolean)
            .join(" / ")}
        </p>
      </div>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  icon?: typeof Users;
  children: ReactNode;
}

function SummaryRow({ label, icon: Icon, children }: SummaryRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground/45">
        {Icon && <Icon aria-hidden className="size-3.5" />}
        {label}
      </dt>
      <dd className="text-foreground/85">{children}</dd>
    </div>
  );
}
