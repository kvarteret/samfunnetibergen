import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { Suspense } from "react"
import { Providers } from "@/app/providers"
import { LanguageSelector } from "@/components/language-selector"
import {
    activateRequestLocale,
    getLocaleStaticParams,
    resolvePageLocale,
} from "@/lib/app-locale"

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export default async function LocaleLayout({
    children,
    params,
}: LayoutProps<"/[locale]">) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)
    const messages = await getMessages()

    return (
        <NextIntlClientProvider messages={messages}>
            <Providers>
                <div className="flex min-h-full flex-col bg-[linear-gradient(to_right,var(--color-destructive)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-destructive)_1px,transparent_1px)] bg-[size:60px_60px]">
                    <Suspense fallback={null}>
                        <LanguageSelector />
                    </Suspense>
                    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
                        <div className="mx-6 my-10 sm:mx-10 lg:mx-14">
                            {children}
                        </div>
                    </main>
                </div>
            </Providers>
        </NextIntlClientProvider>
    )
}
