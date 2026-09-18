"use client"

import { ExternalLink, Mic } from "lucide-react"

import { Card } from "@/components/ui/card"
import { ContentImage } from "@/components/ui/content-image"
import { Link } from "@/i18n/navigation"
import { sanityImageUrl } from "@/lib/sanity/image-url"
import type { KaraokeRoom, KaraokeRoomImage } from "../types"

interface KaraokeFormRoomCardProps {
  room: KaraokeRoom
}

export function KaraokeFormRoomCard({ room }: KaraokeFormRoomCardProps) {
  const firstImage: KaraokeRoomImage | undefined = room.images?.[0]

  return (
    <Card className="space-y-4 bg-card p-5 py-5">
      <ContentImage
        alt={firstImage?.alt ?? room.title}
        className="border-2 border-border/50"
        fallback={<Mic className="size-10 text-foreground-muted" aria-hidden />}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        src={
          firstImage?.assetUrl
            ? sanityImageUrl(firstImage.assetUrl, {
                height: 600,
                width: 800,
              })
            : null
        }
      />
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
