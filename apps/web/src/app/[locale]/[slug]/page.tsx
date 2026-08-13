import { notFound } from "next/navigation"

import ReactMarkdown from "react-markdown"

import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { fetchPageBySlug, fetchPageSlugs } from "@/lib/sanity/fetch"

export const revalidate = 300

type PageProps = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const locales = getLocaleStaticParams()
  const slugs = await fetchPageSlugs()
  return locales.flatMap(({ locale }) => slugs.map(slug => ({ locale, slug })))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale: localeParam } = await params
  const locale = await resolvePageLocale(Promise.resolve({ locale: localeParam }))
  const page = await fetchPageBySlug(slug, { locale, stega: false })
  if (!page) return {}

  return buildPageMetadata({
    canonicalPath: `/${locale}/${slug}`,
    title: page.title,
  })
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug, locale: localeParam } = await params
  const locale = await resolvePageLocale(
    Promise.resolve({ locale: localeParam }),
  )
  activateRequestLocale(locale)

  const page = await fetchPageBySlug(slug, { locale })
  if (!page) notFound()

  return (
    <div className="paper-prose prose prose-neutral max-w-4xl dark:prose-invert">
      <ReactMarkdown>{page.content ?? ""}</ReactMarkdown>
    </div>
  )
}
