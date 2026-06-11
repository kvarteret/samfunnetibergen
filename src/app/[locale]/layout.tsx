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
import { fetchFooter, fetchNavbar } from "@/lib/sanity/fetch"

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)
  const [messages, navbar, footer] = await Promise.all([
    getMessages(),
    fetchNavbar(),
    fetchFooter(),
  ])

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <div
          className="min-h-full"
          style={{
            backgroundImage: `
                            linear-gradient(#FF6669 1px, transparent 1px),
                            linear-gradient(90deg, #FF6669 1px, transparent 1px)
                        `,
            backgroundSize: "20px 20px",
          }}
        >
          <div className="flex min-h-screen flex-col bg-background/95 backdrop-blur-soft">
            <Navbar navbar={navbar} />
            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-10 sm:px-10 lg:px-14">
              {children}
            </main>
            <Footer data={footer} locale={locale} />
          </div>
        </div>
      </Providers>
    </NextIntlClientProvider>
  )
}
