import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { Suspense } from "react"
import { Providers } from "@/app/providers"
import { LanguageSelector } from "@/components/language-selector"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)
    const messages = await getMessages()

    return (
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
    )
}
