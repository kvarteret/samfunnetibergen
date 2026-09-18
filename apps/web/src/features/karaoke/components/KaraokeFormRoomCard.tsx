"use client"

import { ExternalLink, Mic } from "lucide-react"

import { Card } from "@/components/ui/card"
import { SanityImage } from "@/components/ui/sanity-image"
import { Link } from "@/i18n/navigation"
import type { KaraokeRoom, KaraokeRoomImage } from "../types"

interface KaraokeFormRoomCardProps {
  room: KaraokeRoom
}

export function KaraokeFormRoomCard({ room }: KaraokeFormRoomCardProps) {
  const firstImage: KaraokeRoomImage | undefined = room.images?.[0]

  return (
    <Card className="space-y-4 bg-card p-5 py-5">
      {firstImage?.id ? (
        <SanityImage
          alt={firstImage.alt ?? room.title}
          className="h-auto w-full border-2 border-border/50"
          crop={firstImage.crop ?? undefined}
          hotspot={firstImage.hotspot ?? undefined}
          id={firstImage.id}
          mode="contain"
          preview={firstImage.lqip ?? undefined}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          width={800}
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-muted">
          <Mic className="size-10 text-foreground-muted" aria-hidden />
        </div>
      )}
      <div className="space-y-1">
        <Link
          className="group flex items-center gap-1.5 font-heading text-foreground hover:text-primary transition-colors focus-brutal"
          href={`/rom/${room.slug}`}
        >
          {room.title}
          <ExternalLink
            className="size-3.5 opacity-0 group-hover:opacity-60 transition-opacity"
            aria-hidden
          />
        </Link>
      </div>
      {room.summary && <p>{room.summary}</p>}
      {(room.capacitySeated || room.capacityStanding) && (
        <div className="border-t border-border pt-4 flex gap-6">
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
  )
}

function KaraokeRoomCapacity({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div>
      <p className="font-heading uppercase tracking-widest text-foreground-muted mb-0.5">
        {label}
      </p>
      <p className="font-heading">{value}</p>
    </div>
  )
}
