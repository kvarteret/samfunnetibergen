import Link from "next/link"

import type { fetchFooter } from "@/lib/sanity/fetch"

// ─── App store links ──────────────────────────────────────────────────────────

function IconApple() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4 shrink-0">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
    )
}

function IconAndroid() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4 shrink-0">
            <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396" />
        </svg>
    )
}

function AppColumn() {
    return (
        <div>
            <ColumnHeading>Skaff deg appen</ColumnHeading>
            <ul className="space-y-2">
                <li>
                    <Link
                        className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
                        href="/appen"
                    >
                        <IconApple />
                        App Store
                    </Link>
                </li>
                <li>
                    <Link
                        className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
                        href="/appen"
                    >
                        <IconAndroid />
                        Google Play
                    </Link>
                </li>
            </ul>
        </div>
    )
}

type FooterData = NonNullable<Awaited<ReturnType<typeof fetchFooter>>>
type SocialLink = NonNullable<FooterData["socialLinks"]>[number]
type RoomHours = NonNullable<FooterData["roomHours"]>[number]
type HoursRow = NonNullable<NonNullable<RoomHours["hours"]>["rows"]>[number]

const PLATFORM_LABELS: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    youtube: "YouTube",
    tiktok: "TikTok",
    snapchat: "Snapchat",
    flickr: "Flickr",
    other: "Lenke",
}

function IconInstagram() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
    )
}

function IconFacebook() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    )
}

function IconYouTube() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
    )
}

function IconTikTok() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
    )
}

function IconLink() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 shrink-0"
        >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    )
}

const PLATFORM_ICONS: Record<string, () => React.ReactElement> = {
    instagram: IconInstagram,
    facebook: IconFacebook,
    youtube: IconYouTube,
    tiktok: IconTikTok,
}

function ColumnHeading({ children }: { children: React.ReactNode }) {
    return (
        <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/50 mb-3">
            {children}
        </p>
    )
}

function SocialColumn({ links }: { links: SocialLink[] }) {
    if (!links.length) return null
    return (
        <div>
            <ColumnHeading>Følg oss</ColumnHeading>
            <ul className="space-y-2">
                {links.map(link => {
                    const Icon = PLATFORM_ICONS[link.platform ?? ""] ?? IconLink
                    return (
                        <li key={link._key}>
                            <a
                                className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
                                href={link.url ?? "#"}
                                rel="noreferrer"
                                target="_blank"
                            >
                                <Icon />
                                {link.label ??
                                    PLATFORM_LABELS[link.platform ?? "other"] ??
                                    link.platform}
                            </a>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

function ContactColumn({ generalContact }: { generalContact?: string | null }) {
    if (!generalContact) return null
    return (
        <div>
            <ColumnHeading>Kontakt oss</ColumnHeading>
            <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                {generalContact}
            </p>
        </div>
    )
}

function AddressColumn({ address }: { address?: string | null }) {
    if (!address) return null
    return (
        <div>
            <ColumnHeading>Besøk oss</ColumnHeading>
            <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                {address}
            </p>
        </div>
    )
}

function HoursRow({ row }: { row: HoursRow }) {
    const time =
        row.status === "closed"
            ? "Stengt"
            : row.duration?.start && row.duration?.end
              ? `${row.duration.start}–${row.duration.end}`
              : null
    return (
        <div className="flex justify-between gap-4 text-sm">
            <dt className="text-foreground/80">{row.label}</dt>
            {time && <dd className="text-foreground/60 shrink-0 tabular-nums">{time}</dd>}
        </div>
    )
}

function OpeningHoursColumn({ rooms }: { rooms: RoomHours[] }) {
    const roomsWithHours = rooms.filter(r => (r.hours?.rows?.length ?? 0) > 0)
    if (!roomsWithHours.length) return null
    return (
        <div>
            <ColumnHeading>Åpningstider</ColumnHeading>
            <div className="space-y-4">
                {roomsWithHours.map(room => (
                    <div key={room.slug}>
                        <p className="text-xs font-medium text-foreground/50 mb-1.5 uppercase tracking-wide">
                            {room.title}
                        </p>
                        <dl className="space-y-1">
                            {(room.hours?.rows ?? []).map((row: HoursRow) => (
                                <HoursRow key={row._key} row={row} />
                            ))}
                        </dl>
                    </div>
                ))}
            </div>
        </div>
    )
}

interface FooterProps {
    data: FooterData | null
    locale: string
}

export function Footer({ data, locale }: FooterProps) {
    if (!data) return null

    const socialLinks = data.socialLinks ?? []
    const roomHours = data.roomHours ?? []

    return (
        <footer className="border-t border-border bg-card">
            <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-14">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto]">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        <SocialColumn links={socialLinks} />
                        <AppColumn />
                        <ContactColumn generalContact={data.generalContact} />
                        <AddressColumn address={data.visitAddress} />
                    </div>
                    <OpeningHoursColumn rooms={roomHours} />
                </div>

                <div className="mt-8 border-t border-border pt-5">
                    <Link
                        className="text-xs text-foreground hover:text-foreground/70 transition-colors"
                        href={`/${locale}/grupper/e-tjenesten`}
                    >
                        Med 💛 fra E-tjenesten
                    </Link>
                </div>
            </div>
        </footer>
    )
}
