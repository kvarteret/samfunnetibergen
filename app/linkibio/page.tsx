import Link from "next/link"
import { fetchLinkInBio } from "@/lib/sanity/queries"

// ─── Fallback data shown before the Sanity doc is created ─────────────────────

const FALLBACK = {
    heading: "Kvarteret",
    bio: "Studentenes hus i Bergen",
    links: [
        {
            _key: "app",
            label: "Last ned appen",
            url: "/appen",
            emoji: "📱",
            highlight: true,
        },
        {
            _key: "blifrivillig",
            label: "Bli frivillig",
            url: "/nb/blifrivillig",
            emoji: "🙌",
            highlight: false,
        },
    ],
}

export default async function LinkInBioPage() {
    const data = (await fetchLinkInBio()) ?? FALLBACK

    const heading = data.heading ?? FALLBACK.heading
    const bio = data.bio ?? FALLBACK.bio
    const links = (data.links ?? FALLBACK.links) as Array<{
        _key: string
        label: string
        url: string
        emoji?: string | null
        highlight?: boolean | null
    }>

    return (
        <main className="flex min-h-svh flex-col items-center justify-start gap-0 px-4 pt-16 pb-12 bg-background">
            {/* Profile block */}
            <div className="mb-8 text-center space-y-2">
                <h1 className="font-heading text-2xl">{heading}</h1>
                {bio && <p className="text-sm text-foreground/60 max-w-xs">{bio}</p>}
            </div>

            {/* Link list */}
            <ul className="w-full max-w-sm space-y-3">
                {links.map(link => {
                    const isExternal = typeof link.url === "string" && link.url.startsWith("http")
                    const label = (
                        <span className="flex items-center gap-2 justify-center">
                            {link.emoji && <span aria-hidden>{link.emoji}</span>}
                            {link.label}
                        </span>
                    )
                    const className = [
                        "flex w-full items-center justify-center px-5 py-4 text-sm font-medium border-2 border-border transition-colors",
                        link.highlight
                            ? "bg-foreground text-background hover:bg-foreground/90"
                            : "bg-card text-foreground hover:bg-muted",
                    ].join(" ")

                    return (
                        <li key={link._key}>
                            {isExternal ? (
                                <a
                                    href={link.url}
                                    rel="noreferrer"
                                    target="_blank"
                                    className={className}
                                >
                                    {label}
                                </a>
                            ) : (
                                <Link href={link.url} className={className}>
                                    {label}
                                </Link>
                            )}
                        </li>
                    )
                })}
            </ul>

            <p className="mt-10 text-xs text-foreground/30">samfunnetibergen.no</p>
        </main>
    )
}
