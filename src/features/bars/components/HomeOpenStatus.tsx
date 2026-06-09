"use client";

import { useEffect, useState } from "react";

import {
  type ClosedDate,
  isHouseClosed,
  isOpenAt,
  isoDate,
  type OpeningHours,
} from "@/lib/opening-hours";

export interface HomeOpenStatusRoom {
  openingHours?: OpeningHours | null;
}

interface HomeOpenStatusProps {
  rooms: HomeOpenStatusRoom[];
  houseClosedDates?: ClosedDate[] | null;
}

export function HomeOpenStatus({
  rooms,
  houseClosedDates,
}: HomeOpenStatusProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  if (isHouseClosed(isoDate(now), houseClosedDates)) return null;

  const isOpen = rooms.some((room) =>
    isOpenAt(now, room.openingHours, houseClosedDates),
  );

  if (!isOpen) return null;

  return (
    <p className="mt-2 font-heading text-xs uppercase tracking-[0.18em] text-primary">
      er åpent!!
    </p>
  );
}
