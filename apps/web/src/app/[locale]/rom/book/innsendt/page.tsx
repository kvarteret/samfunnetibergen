import { ArrowRight, Check } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"

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
  return {
    ...buildPageMetadata({
      locale,
      canonicalPath: `/${locale}/rom/book/innsendt`,
      title: t("form.successTitle"),
    }),
    robots: { index: false, follow: false },
  }
}

export default async function BookingSubmittedPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "RoomBooking" })
  return (
    <article className="w-full space-y-8">
      <Breadcrumbs path="/rom/book" />
      <Alert className="max-w-2xl p-8" variant="success">
        <Check aria-hidden />
        <AlertTitle>
          <h1 className="text-2xl">{t("form.successTitle")}</h1>
        </AlertTitle>
        <AlertDescription>{t("form.successDescription")}</AlertDescription>
      </Alert>
      <section className="max-w-2xl space-y-5">
        <p className="text-lg">{t("form.promotionReminder")}</p>
        <Button render={<Link href="/arrangementer/ny" />} size="lg">
          {t("form.promoteEvent")}
          <ArrowRight aria-hidden />
        </Button>
      </section>
      <Link
        className="inline-flex font-heading underline underline-offset-4 focus-brutal"
        href="/rom"
      >
        {t("form.backToRooms")}
      </Link>
    </article>
  )
}
