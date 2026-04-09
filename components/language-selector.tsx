"use client"

import { useSearchParams } from "next/navigation"
import { useLocale } from "next-intl"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

export function LanguageSelector() {
    const locale = useLocale()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const queryString = searchParams.toString()
    const href = queryString ? `${pathname}?${queryString}` : pathname

    return (
        <nav
            aria-label="Language selector"
            className="fixed right-4 top-4 z-50 flex overflow-hidden border-2 border-border bg-card shadow-shadow sm:right-6 sm:top-6"
        >
            <Link
                className={cn(
                    "px-3 py-2 text-xs uppercase tracking-[0.2em] sm:px-4",
                    locale === "nb"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-card text-foreground",
                )}
                href={href}
                locale="nb"
                prefetch={false}
            >
                Norsk
            </Link>
            <Link
                className={cn(
                    "border-l-2 border-border px-3 py-2 text-xs uppercase tracking-[0.2em] sm:px-4",
                    locale === "en"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-card text-foreground",
                )}
                href={href}
                locale="en"
                prefetch={false}
            >
                English
            </Link>
        </nav>
    )
}
