"use client"

import {
  Building2,
  CalendarClock,
  Check,
  Info,
  type LucideIcon,
  Wand2,
} from "lucide-react"
import Image from "next/image"
import { type ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { CheckboxSquare } from "@/components/ui/form-fields"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import { cn } from "@/lib/utils"
import { formatBookingTime } from "../domain/availability"
import type { BookingRoom } from "../types"

// ─── BookingSelectableCard ───────────────────────────────────────────────────

interface BookingSelectableCardProps {
  selected: boolean
  onSelect: () => void
  disabled?: boolean
  children: ReactNode
  className?: string
}

export function BookingSelectableCard({
  selected,
  onSelect,
  disabled,
  children,
  className,
}: BookingSelectableCardProps) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "flex min-h-32 cursor-pointer flex-col gap-2 border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted",
        disabled && "cursor-not-allowed opacity-45 hover:bg-transparent",
        className,
      )}
      disabled={disabled}
      onClick={onSelect}
      type="button"
    >
      {children}
    </button>
  )
}

// ─── BookingRoomPicker ───────────────────────────────────────────────────────

interface BookingRoomPickerProps {
  rooms: BookingRoom[]
  selectedSlug: string
  occupiedSlugs: Set<string>
  onChange: (slug: string) => void
}

export function BookingRoomPicker({
  rooms,
  selectedSlug,
  occupiedSlugs,
  onChange,
}: BookingRoomPickerProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rooms.map(room => {
        const selected = selectedSlug === room.slug
        const occupied = occupiedSlugs.has(room.slug)
        return (
          <button
            aria-pressed={selected}
            className={cn(
              "group cursor-pointer overflow-hidden border-2 bg-card text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary"
                : "border-border hover:border-primary",
              occupied && "cursor-not-allowed opacity-45 hover:border-border",
            )}
            disabled={occupied}
            key={room.slug}
            onClick={() => onChange(room.slug)}
            type="button"
          >
            <div className="relative aspect-[16/9] bg-muted">
              {room.image?.assetUrl ? (
                <Image
                  alt={room.image.alt ?? room.title ?? room.slug}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 768px) 40vw, 100vw"
                  src={room.image.assetUrl}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-foreground/30">
                  <Building2 aria-hidden className="size-8" />
                </div>
              )}
              {selected && !occupied && (
                <span className="absolute right-3 top-3 flex size-7 items-center justify-center bg-primary text-primary-foreground">
                  <Check aria-hidden className="size-4" />
                </span>
              )}
              {occupied && (
                <span className="absolute left-3 top-3 bg-foreground px-2 py-1 font-heading text-xs uppercase tracking-wide text-background">
                  Opptatt
                </span>
              )}
            </div>
            <div className="space-y-2 p-4">
              <p className="font-heading text-lg text-foreground">
                {room.title ?? room.slug}
              </p>
              {room.summary && (
                <p className="line-clamp-2 text-sm leading-5 text-foreground/65">
                  {room.summary}
                </p>
              )}
              <p className="text-xs text-foreground/50">
                {[
                  room.capacityStanding && `${room.capacityStanding} stående`,
                  room.capacitySeated && `${room.capacitySeated} sittende`,
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── BookingToggleOption ─────────────────────────────────────────────────────

interface BookingToggleOptionProps {
  checked: boolean
  icon: LucideIcon
  label: string
  children?: ReactNode
  onChange: (checked: boolean) => void
}

export function BookingToggleOption({
  checked,
  icon: Icon,
  label,
  children,
  onChange,
}: BookingToggleOptionProps) {
  return (
    <div
      className={cn(
        "border-2 transition-colors",
        checked ? "border-primary bg-primary/5" : "border-border bg-card",
      )}
    >
      <button
        aria-pressed={checked}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
        onClick={() => onChange(!checked)}
        type="button"
      >
        <CheckboxSquare checked={checked} onChange={onChange} />
        <span className="flex min-w-0 flex-1 items-center gap-2 font-heading text-sm text-foreground">
          <Icon aria-hidden className="size-4 text-primary" />
          {label}
        </span>
      </button>
      {children && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

// ─── BookingTechnicianOption ─────────────────────────────────────────────────

interface BookingTechnicianOptionProps {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}

export function BookingTechnicianOption({
  checked,
  label,
  onChange,
}: BookingTechnicianOptionProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-2 p-4 transition-colors",
        checked ? "border-primary bg-primary/5" : "border-border bg-card",
      )}
    >
      <button
        aria-pressed={checked}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
        onClick={() => onChange(!checked)}
        type="button"
      >
        <CheckboxSquare checked={checked} onChange={onChange} />
        <span className="flex min-w-0 items-center gap-2 font-heading text-sm text-foreground">
          <Wand2 aria-hidden className="size-4 text-primary" />
          {label}
        </span>
      </button>
      <Popover>
        <PopoverTrigger
          aria-label={`Info om ${label}`}
          className="cursor-pointer text-foreground/50 hover:text-foreground"
        >
          <Info aria-hidden className="size-4" />
        </PopoverTrigger>
        <PopoverContent className="w-72 text-sm leading-6">
          Dedikert tekniker koster <strong>3500 kr eks. mva</strong> per
          tekniker. Avbestilling må skje senest <strong>10 dager</strong> før
          arrangementet.
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ─── BookingRoomAvailability ─────────────────────────────────────────────────

interface BookingRoomAvailabilityProps {
  bookings: CresatBooking[]
  hasConflict: boolean
  roomTitle: string
}

export function BookingRoomAvailability({
  bookings,
  hasConflict,
  roomTitle,
}: BookingRoomAvailabilityProps) {
  return (
    <Card
      className={cn(
        "max-w-3xl gap-2 p-4",
        hasConflict && "border-destructive bg-destructive/10",
      )}
    >
      <p className="flex items-center gap-2 font-heading text-sm text-foreground">
        <CalendarClock aria-hidden className="size-4 text-primary" />
        {roomTitle} – opptatt denne dagen
      </p>
      {bookings.length === 0 ? (
        <p className="text-sm text-foreground/60">
          Ingen registrerte bookinger denne dagen.
        </p>
      ) : (
        <ul className="space-y-1 text-sm text-foreground/75">
          {bookings.map(booking => (
            <li key={booking.id} className="flex justify-between gap-4">
              <span className="font-heading">
                {formatBookingTime(booking.start)}–
                {formatBookingTime(booking.end)}
              </span>
              <span className="truncate text-foreground/55">
                {booking.title}
              </span>
            </li>
          ))}
        </ul>
      )}
      {hasConflict && (
        <p className="text-sm font-heading text-destructive">
          Valgt tidsrom overlapper en eksisterende booking. Velg et annet
          tidspunkt.
        </p>
      )}
    </Card>
  )
}

// ─── BookingTextarea ─────────────────────────────────────────────────────────

interface BookingTextareaProps {
  id: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

export function BookingTextarea({
  id,
  value,
  placeholder,
  onChange,
}: BookingTextareaProps) {
  return (
    <textarea
      className="w-full resize-y border-2 border-border bg-background px-3 py-2 text-sm font-base text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      id={id}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      value={value}
    />
  )
}
