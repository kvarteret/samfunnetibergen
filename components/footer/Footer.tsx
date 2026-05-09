import Link from "next/link"

import type { fetchFooter } from "@/lib/sanity/queries"

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
                {links.map(link => (
                    <li key={link._key}>
                        <a
                            className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                            href={link.url ?? "#"}
                            rel="noreferrer"
                            target="_blank"
                        >
                            {link.label ??
                                PLATFORM_LABELS[link.platform ?? "other"] ??
                                link.platform}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function ContactColumn({
    generalContact,
}: {
    generalContact?: string | null
}) {
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
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <SocialColumn links={socialLinks} />
                    <ContactColumn generalContact={data.generalContact} />
                    <AddressColumn address={data.visitAddress} />
                    <OpeningHoursColumn rooms={roomHours} />
                </div>

                <div className="mt-8 border-t border-border pt-5">
                    <Link
                        className="text-xs text-foreground/30 hover:text-foreground/50 transition-colors"
                        href={`/${locale}/grupper/e-tjenesten`}
                    >
                        Med 💛 fra E-tjenesten
                    </Link>
                </div>
            </div>
        </footer>
    )
}
