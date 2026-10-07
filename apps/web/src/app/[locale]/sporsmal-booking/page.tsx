import { ArrowRight } from "lucide-react"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { BookingNotice } from "@/features/booking/components/BookingNotice"
import { BookingQuestions } from "@/features/booking/components/BookingQuestions"
import { Link } from "@/i18n/navigation"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { fetchPageBySlug } from "@/lib/sanity/fetch"

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = await resolvePageLocale(params)
  const t = await getTranslations({ locale, namespace: "RoomBooking" })
  const page = await fetchPageBySlug("sporsmal-booking", locale, {
    stega: false,
  })
  return buildPageMetadata({
    locale,
    canonicalPath: `/${locale}/sporsmal-booking`,
    title: page?.title ?? t("page.title"),
  })
}

export default async function BookingSubmittedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ submitted?: string }>
}) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "RoomBooking" })
  const page = await fetchPageBySlug("sporsmal-booking", locale)
  if (!page) notFound()
  const { submitted } = await searchParams
  return (
    <article className="w-full space-y-8">
      <Breadcrumbs
        path="/sporsmal-booking"
        current={page.title ?? "Spørsmål om booking"}
      />
      {(submitted === "1" || submitted === "karaoke") && (
        <>
          <BookingNotice karaoke={submitted === "karaoke"} locale={locale} />
          <section className="max-w-2xl space-y-5">
            <p className="text-lg">{t("form.promotionReminder")}</p>
            <Button
              render={
                <Link
                  href={
                    submitted === "1"
                      ? "/arrangementer/ny?fromBooking=1"
                      : "/arrangementer/ny"
                  }
                />
              }
              size="lg"
            >
              {t("form.promoteEvent")}
              <ArrowRight aria-hidden />
            </Button>
          </section>
        </>
      )}
      <BookingQuestions content={page.content ?? ""} faq={page.faq ?? []} />
      <Link
        className="inline-flex font-heading underline underline-offset-4 focus-brutal"
        href="/rom"
      >
        {t("form.backToRooms")}
      </Link>
    </article>
  )
}
