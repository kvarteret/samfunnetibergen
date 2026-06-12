import { ExternalLink } from "lucide-react"
import Image from "next/image"

import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { PortableTextContent } from "@/lib/portable-text-components"
import { fetchSponsorsPageContent } from "@/lib/sanity/fetch"

export const revalidate = 300

type SponsorsPageProps = {
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return getLocaleStaticParams()
}

export async function generateMetadata({ params }: SponsorsPageProps) {
  await resolvePageLocale(params)
  const content = await fetchSponsorsPageContent({ stega: false })

  return {
    title: `${content?.seoTitle ?? content?.title ?? "Sponsorer"} | Samfunnet i Bergen`,
    description:
      content?.seoDescription ??
      content?.description ??
      "Se sponsorer for Samfunnet i Bergen.",
  }
}

export default async function SponsorsPage({ params }: SponsorsPageProps) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)

  const content = await fetchSponsorsPageContent()
  const sponsors = content?.sponsors ?? []

  return (
    <div className="space-y-12">
      <header className="space-y-5">
        {content?.eyebrow ? (
          <p className="w-fit bg-primary px-3 py-1.5 font-heading text-primary-foreground">
            {content.eyebrow}
          </p>
        ) : null}
        <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
          {content?.title ?? "Sponsorer"}
        </h1>
        {content?.description ? (
          <p className="max-w-3xl text-xl leading-8 text-foreground">
            {content.description}
          </p>
        ) : null}
      </header>

      {sponsors.length ? (
        <section className="grid gap-6 md:grid-cols-2">
          {sponsors.map(sponsor => (
            <article
              className="flex min-h-full flex-col gap-5 panel shadow-shadow"
              key={sponsor._key}
            >
              {sponsor.logoUrl ? (
                <div className="relative flex h-28 items-center justify-start">
                  <Image
                    alt={sponsor.logoAlt ?? sponsor.title ?? ""}
                    className="object-contain object-left"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    src={sponsor.logoUrl}
                  />
                </div>
              ) : null}
              <div className="space-y-3">
                <h2 className="font-heading text-3xl leading-none text-foreground">
                  {sponsor.title}
                </h2>
                <PortableTextContent value={sponsor.description} />
              </div>
              {sponsor.website ? (
                <a
                  className="mt-auto inline-flex w-fit items-center gap-2 font-heading text-foreground underline underline-offset-4"
                  href={sponsor.website}
                  rel="noreferrer"
                  target="_blank"
                >
                  Nettsted
                  <ExternalLink aria-hidden className="size-4" />
                </a>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  )
}
