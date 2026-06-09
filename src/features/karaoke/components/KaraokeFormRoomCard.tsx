"use client";

import { ExternalLink, Mic } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { KaraokeRoom, KaraokeRoomImage } from "../types";

interface KaraokeFormRoomCardProps {
  room: KaraokeRoom;
}

export function KaraokeFormRoomCard({ room }: KaraokeFormRoomCardProps) {
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
