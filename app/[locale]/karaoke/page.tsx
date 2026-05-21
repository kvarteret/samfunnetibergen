import { Mic, Phone } from "lucide-react"

import { KaraokeBookingForm } from "@/features/karaoke/components/KaraokeBookingForm"
import type { KaraokeRoom } from "@/features/karaoke/types"
import { Link } from "@/i18n/navigation"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchRoomBySlug } from "@/lib/sanity/fetch"

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export async function generateMetadata() {
    return {
        title: "Booking av karaoke | Samfunnet i Bergen",
        description:
            "Book karaoke på Maos Lille Røde hos Studentersamfunnet i Bergen. Fyll ut skjemaet så behandler vi forespørselen din så fort vi ser den.",
    }
}

const MAOS_FALLBACK: KaraokeRoom = {
    slug: "maos",
    title: "Maos Lille Røde",
    summary: "En rød og intim stue med moderne teknikk.",
    capacitySeated: 50,
    capacityStanding: 75,
    images: [],
}

export default async function KaraokePage({ params }: { params: Promise<{ locale: string }> }) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)

    const roomData = await fetchRoomBySlug("maos")
    const room: KaraokeRoom = roomData
        ? {
              slug: roomData.slug ?? MAOS_FALLBACK.slug,
              title: roomData.title ?? MAOS_FALLBACK.title,
              summary: roomData.summary ?? null,
              capacitySeated: roomData.capacitySeated ?? null,
              capacityStanding: roomData.capacityStanding ?? null,
              images: (roomData.images ?? []).map(img => ({
                  _key: img._key ?? null,
                  assetUrl: img.assetUrl ?? null,
                  alt: img.alt ?? null,
                  caption: img.caption ?? null,
              })),
          }
        : MAOS_FALLBACK

    return (
        <article className="flex w-full flex-col gap-10">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <header className="space-y-4">
                <Link
                    className="inline-flex text-sm uppercase tracking-[0.18em] underline underline-offset-4 text-foreground/60 hover:text-foreground transition-colors"
                    href="/rom"
                >
                    ← Rom
                </Link>

                <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary flex items-center justify-center shrink-0">
                        <Mic className="size-5 text-primary-foreground" aria-hidden />
                    </div>
                    <p className="font-heading text-sm uppercase tracking-[0.18em] text-foreground/60">
                        Karaoke
                    </p>
                </div>
                <h1 className="font-heading text-4xl leading-tight text-foreground lg:text-5xl">
                    Booking av karaoke
                </h1>
                <p className="text-lg leading-7 text-foreground/70 max-w-xl">
                    Så gøy at du ønsker å booke karaoke hos oss! Fyll ut skjemaet under, så
                    behandler vi forespørselen din så fort vi ser den.
                </p>

                {/* ── Age limit notice ────────────────────────────────────── */}
                <p className="text-sm font-heading uppercase tracking-[0.12em] text-destructive">
                    Aldersgrense 18 år*{" "}
                    <span className="normal-case tracking-normal font-sans text-foreground/60">
                        (*18 år med studentbevis – 20 år for alle andre)
                    </span>
                </p>

                {/* ── Same-day notice ─────────────────────────────────────── */}
                <div className="border-2 border-border bg-card p-5 space-y-3 max-w-xl">
                    <p className="text-sm font-heading text-foreground">
                        Vil du booke et karaokerom i dag?
                    </p>
                    <ul className="space-y-1.5 text-sm text-foreground/75 leading-6">
                        <li>
                            På <strong className="font-heading text-foreground">hverdager</strong>{" "}
                            må bookinger for samme dag gjøres{" "}
                            <strong className="font-heading text-foreground">før kl. 12:00</strong>.
                        </li>
                        <li>
                            Etter kl. 12:00, eller på{" "}
                            <strong className="font-heading text-foreground">
                                lørdager og søndager
                            </strong>
                            , må du bestille på telefon:
                        </li>
                    </ul>
                    <a
                        className="flex items-center gap-2 text-sm font-heading text-primary hover:underline underline-offset-4 transition-colors"
                        href="tel:40626601"
                    >
                        <Phone className="size-4 shrink-0" aria-hidden />
                        406 26 601
                    </a>
                </div>
            </header>

            {/* ── Form + sidebar ──────────────────────────────────────────── */}
            <KaraokeBookingForm room={room} />
        </article>
    )
}
