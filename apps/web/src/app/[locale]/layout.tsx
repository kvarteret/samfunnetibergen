import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { Providers } from "@/app/providers"
import { Footer } from "@/components/footer/Footer"
import { Navbar } from "@/components/navbar/Navbar"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { fetchFooter, fetchHouseHours } from "@/lib/sanity/fetch"

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)
  const [messages, footer, houseHours] = await Promise.all([
    getMessages(),
    fetchFooter(locale),
    fetchHouseHours(locale),
  ])
  const initialNow = new Date().toISOString()

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <div className="paper-canvas min-h-full [overflow-x:clip]">
          <div className="paper-surface flex min-h-screen flex-col">
            <Navbar houseHours={houseHours} initialNow={initialNow} />
            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-10 sm:px-10 lg:px-14">
              {children}
            </main>
            <Footer data={footer} initialNow={initialNow} locale={locale} />
          </div>
        </div>
      </Providers>
    </NextIntlClientProvider>
  )
}
