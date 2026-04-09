import type { Metadata } from "next"
import localFont from "next/font/local"
import { DM_Mono, Instrument_Serif } from "next/font/google"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { LanguageSelector } from "@/components/language-selector"
import { Providers } from "@/app/providers"
import { routing } from "@/i18n/routing"
import "../globals.css"

const hegvalDisplay = localFont({
    variable: "--font-hegval-display",
    display: "swap",
    src: [
        {
            path: "../../public/fonts/The Northern Block Ltd - Hegval Display Light.otf",
            weight: "300",
            style: "normal",
        },
        {
            path: "../../public/fonts/The Northern Block Ltd - Hegval Display Regular.otf",
            weight: "500",
            style: "normal",
        },
        {
            path: "../../public/fonts/The Northern Block Ltd - Hegval Display Medium.otf",
            weight: "400",
            style: "italic",
        },
    ],
})

const dmMono = DM_Mono({
    variable: "--font-dm-mono",
    subsets: ["latin"],
    weight: ["400", "500"],
})

const instrumentSerif = Instrument_Serif({
    variable: "--font-instrument-serif",
    subsets: ["latin"],
    weight: ["400"],
    style: ["normal", "italic"],
})

export const metadata: Metadata = {
    title: "Samfunnet i Bergen",
    description: "Studentenes kulturhus i Bergen.",
}

export function generateStaticParams() {
    return routing.locales.map(locale => ({ locale }))
}

export default async function LocaleLayout({
    children,
    params,
}: LayoutProps<"/[locale]">) {
    const { locale } = await params

    if (!hasLocale(routing.locales, locale)) {
        notFound()
    }

    setRequestLocale(locale)
    const messages = await getMessages()

    return (
        <html
            lang={locale}
            className={`${hegvalDisplay.className} ${hegvalDisplay.variable} ${dmMono.variable} ${instrumentSerif.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <NextIntlClientProvider messages={messages}>
                    <Providers>
                        <Suspense fallback={null}>
                            <LanguageSelector />
                        </Suspense>
                        {children}
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
