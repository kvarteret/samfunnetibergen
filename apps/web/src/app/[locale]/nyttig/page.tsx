import { notFound } from "next/navigation"

import { JsonLd } from "@/components/JsonLd"
import { NyttigPage } from "@/features/nyttig"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { fetchUsefulInfoPage } from "@/lib/sanity/fetch"
import { buildFaqPageStructuredData } from "@/lib/structured-data"

export const revalidate = 300

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/nyttig">) {
  const locale = await resolvePageLocale(params)
  const page = await fetchUsefulInfoPage(locale)
  return buildPageMetadata({
    locale,
    canonicalPath: `/${locale}/nyttig`,
    title: page?.title ?? "Nyttig info",
    description:
      "Praktisk informasjon om Samfunnet i Bergen – adkomst, billetter, booking, servering og tilgjengelighet.",
  })
}

export default async function UsefulInfoPage({
  params,
}: PageProps<"/[locale]/nyttig">) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)

  const page = await fetchUsefulInfoPage(locale)
  if (!page) {
    notFound()
  }

  const faqJsonLd = buildFaqPageStructuredData(page.sections ?? [])

  return (
    <>
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <NyttigPage page={page} />
    </>
  )
}
