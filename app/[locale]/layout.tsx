import type { Metadata } from "next"
import { DM_Mono, Instrument_Serif } from "next/font/google"
import localFont from "next/font/local"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { Suspense } from "react"
import { Providers } from "@/app/providers"
import { LanguageSelector } from "@/components/language-selector"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
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
    return getLocaleStaticParams()
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)
    const messages = await getMessages()

    return (
        <html
            lang={locale}
            className={`${hegvalDisplay.className} ${hegvalDisplay.variable} ${dmMono.variable} ${instrumentSerif.variable} h-full antialiased`}
        >
            <body className="min-h-full">
                <NextIntlClientProvider messages={messages}>
                    <Providers>
                        <div className="flex min-h-full flex-col">
                            <Suspense fallback={null}>
                                <LanguageSelector />
                            </Suspense>
                            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-10 sm:px-10 lg:px-14">
                                {children}
                            </main>
                        </div>
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
