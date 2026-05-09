import Link from "next/link"

import type { fetchFooter } from "@/lib/sanity/queries"

type FooterData = NonNullable<Awaited<ReturnType<typeof fetchFooter>>>
type SocialLink = NonNullable<FooterData["socialLinks"]>[number]
type OpeningHoursRow = NonNullable<
    NonNullable<FooterData["openingHours"]>["rows"]
>[number]

const PLATFORM_LABELS: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    youtube: "YouTube",
    tiktok: "TikTok",
    snapchat: "Snapchat",
    other: "Lenke",
}

function SocialLinks({ links }: { links: SocialLink[] }) {
    if (!links.length) return null
    return (
        <div className="space-y-2">
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/60">
                Følg oss
            </p>
            <ul className="space-y-1">
                {links.map(link => (
                    <li key={link._key}>
                        <a
                            className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                            href={link.url ?? "#"}
                            rel="noreferrer"
                            target="_blank"
                        >
                            {link.label ?? PLATFORM_LABELS[link.platform ?? "other"] ?? link.platform}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function ContactColumn({ phone, email }: { phone?: string | null; email?: string | null }) {
    if (!phone && !email) return null
    return (
        <div className="space-y-2">
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/60">
                Kontakt oss
            </p>
            <div className="space-y-1">
                {phone && (
                    <a
                        className="block text-sm text-foreground/80 hover:text-foreground transition-colors"
                        href={`tel:${phone.replace(/\s/g, "")}`}
                    >
                        {phone}
                    </a>
                )}
                {email && (
                    <a
                        className="block text-sm text-foreground/80 hover:text-foreground transition-colors"
                        href={`mailto:${email}`}
                    >
                        {email}
                    </a>
                )}
            </div>
        </div>
    )
}

function AddressColumn({ address }: { address?: string | null }) {
    if (!address) return null
    return (
        <div className="space-y-2">
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/60">
                Besøk oss
            </p>
            <p className="text-sm text-foreground/80 whitespace-pre-line">{address}</p>
        </div>
    )
}

function OpeningHoursColumn({ rows }: { rows: OpeningHoursRow[] }) {
    if (!rows.length) return null
    return (
        <div className="space-y-2">
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/60">
                Åpningstider
            </p>
            <dl className="space-y-1">
                {rows.map(row => {
                    const time =
                        row.status === "closed"
                            ? "Stengt"
                            : row.duration?.start && row.duration?.end
                              ? `${row.duration.start}–${row.duration.end}`
                              : null
                    return (
                        <div className="flex justify-between gap-4 text-sm" key={row._key}>
                            <dt className="text-foreground/80">{row.label}</dt>
                            {time && <dd className="text-foreground/60 shrink-0">{time}</dd>}
                        </div>
                    )
                })}
            </dl>
        </div>
    )
}

interface FooterProps {
    data: FooterData | null
    locale: string
}

export function Footer({ data, locale }: FooterProps) {
    const socialLinks = data?.socialLinks ?? []
    const openingRows = data?.openingHours?.rows ?? []

    return (
        <footer className="border-t border-border bg-card mt-auto">
            <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-14">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <SocialLinks links={socialLinks} />
                    <ContactColumn phone={data?.contactPhone} email={data?.contactEmail} />
                    <AddressColumn address={data?.visitAddress} />
                    <OpeningHoursColumn rows={openingRows} />
                </div>

                <div className="mt-8 border-t border-border pt-6">
                    <Link
                        className="text-xs text-foreground/40 cursor-default select-none"
                        href={`/${locale}/grupper/e-tjenesten`}
                        tabIndex={-1}
                    >
                        Med 💛 fra E-tjenesten
                    </Link>
                </div>
            </div>
        </footer>
    )
}
