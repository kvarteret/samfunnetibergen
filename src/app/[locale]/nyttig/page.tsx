import { notFound } from "next/navigation"

import { NyttigPage } from "@/features/nyttig"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { fetchUsefulInfoPage } from "@/lib/sanity/fetch"

export const revalidate = 300

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/nyttig">) {
  const locale = await resolvePageLocale(params)
  const page = await fetchUsefulInfoPage()
  return buildPageMetadata({
    content: page,
    canonicalPath: `/${locale}/nyttig`,
    fallbackTitle: page?.title ?? "Nyttig info",
    fallbackDescription:
      "Praktisk informasjon om Samfunnet i Bergen – adkomst, billetter, booking, servering og tilgjengelighet.",
  })
}

export default async function UsefulInfoPage({
  params,
}: PageProps<"/[locale]/nyttig">) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)

  const page = await fetchUsefulInfoPage()
  if (!page) {
    notFound()
  }

  return <NyttigPage page={page} />
}
