import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { Providers } from "@/app/providers"
import { Navbar } from "@/components/navbar/Navbar"
import { activateRequestLocale, getLocaleStaticParams, resolvePageLocale } from "@/lib/app-locale"
import { fetchNavbar } from "@/lib/sanity/queries"

export function generateStaticParams() {
    return getLocaleStaticParams()
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)
    const [messages, navbar] = await Promise.all([getMessages(), fetchNavbar()])

    return (
        <NextIntlClientProvider messages={messages}>
            <Providers>
                <div className="flex min-h-full flex-col">
                    <Navbar navbar={navbar} />
                    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-10 sm:px-10 lg:px-14">
                        {children}
                    </main>
                </div>
            </Providers>
        </NextIntlClientProvider>
    )
}
