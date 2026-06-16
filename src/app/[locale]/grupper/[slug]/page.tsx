import { ExternalLink, Globe, Mail } from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { Avatar } from "@/components/ui/avatar"
import { GroupVolunteerForm } from "@/features/grupper"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { PortableTextContent } from "@/lib/portable-text-components"
import {
  fetchStudentGroupBySlug,
  fetchStudentGroupSlugs,
} from "@/lib/sanity/fetch"
import nbMessages from "@/messages/nb.json"

export const revalidate = 300

type GroupPageProps = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const locales = getLocaleStaticParams()
  const slugs = await fetchStudentGroupSlugs()
  return locales.flatMap(({ locale }) => slugs.map(slug => ({ locale, slug })))
}

export async function generateMetadata({ params }: GroupPageProps) {
  const { slug, locale: localeParam } = await params
  await resolvePageLocale(Promise.resolve({ locale: localeParam }))
  const group = await fetchStudentGroupBySlug(slug, { stega: false })
  if (!group) return {}

  return buildPageMetadata({
    content: group,
    canonicalPath: `/${localeParam}/grupper/${slug}`,
    fallbackTitle: `${group.name} | Grupper`,
    fallbackDescription: group.summary,
    fallbackImageUrl: group.image?.assetUrl,
  })
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { slug, locale: localeParam } = await params
  const locale = await resolvePageLocale(
    Promise.resolve({ locale: localeParam }),
  )
  activateRequestLocale(locale)

  const group = await fetchStudentGroupBySlug(slug)
  if (!group) notFound()

  const institutionOptions = nbMessages.InstitutionOptions as Array<{
    value: string
    label: string
  }>

  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-8">
        <GroupMasthead
          logoUrl={group.logoUrl}
          name={group.name}
          summary={group.summary}
        />

        {group.image?.assetUrl ? (
          <figure className="space-y-2">
            <div className="relative aspect-video w-full overflow-hidden border-2 border-border bg-muted">
              <Image
                alt={group.image.alt ?? group.name ?? ""}
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                src={group.image.assetUrl}
              />
            </div>
            {group.image.caption ? (
              <figcaption className="text-lg italic text-foreground-muted">
                {group.image.caption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        {group.body && group.body.length > 0 && (
          <PortableTextContent value={group.body} />
        )}
      </div>

      <aside className="space-y-6">
        {(group.email || group.website) && (
          <AsideSection title="Kontakt">
            {group.email && (
              <a
                className="flex items-center gap-2 underline underline-offset-4 hover:text-primary focus-brutal"
                href={`mailto:${group.email}`}
              >
                <Mail aria-hidden className="size-4 shrink-0" />
                {group.email}
              </a>
            )}
            {group.website && (
              <a
                className="flex items-center gap-2 underline underline-offset-4 hover:text-primary focus-brutal"
                href={group.website}
                rel="noreferrer"
                target="_blank"
              >
                <Globe aria-hidden className="size-4 shrink-0" />
                Nettside
                <ExternalLink aria-hidden className="size-3 shrink-0" />
              </a>
            )}
          </AsideSection>
        )}

        {group.parentGroup && (
          <AsideSection title="Del av">
            {group.parentGroup.slug ? (
              <a
                className="text-foreground underline underline-offset-4 hover:text-primary focus-brutal"
                href={`/${locale}/grupper/${group.parentGroup.slug}`}
              >
                {group.parentGroup.name}
              </a>
            ) : (
              <p className="text-foreground">{group.parentGroup.name}</p>
            )}
          </AsideSection>
        )}

        {group.subGroups?.length ? (
          <AsideSection title="Undergrupper">
            <ul className="flex flex-wrap gap-2">
              {group.subGroups.map(subGroup => (
                <li
                  className="border-2 border-border bg-background px-2 py-1 font-heading text-foreground"
                  key={subGroup.slug ?? subGroup.name}
                >
                  {subGroup.name}
                </li>
              ))}
            </ul>
          </AsideSection>
        ) : null}

        {group.slug && (
          <section className="panel">
            <GroupVolunteerForm
              groupSlug={group.slug}
              groupName={group.name ?? group.slug}
              institutionOptions={institutionOptions}
              subGroups={
                group.subGroups?.flatMap(sg =>
                  sg.slug && sg.name ? [{ slug: sg.slug, name: sg.name }] : [],
                ) ?? []
              }
            />
          </section>
        )}
      </aside>
    </article>
  )
}

interface GroupMastheadProps {
  logoUrl?: string | null
  name?: string | null
  summary?: string | null
}

function GroupMasthead({
  logoUrl,
  name,
  summary,
}: GroupMastheadProps) {
  return (
    <header className="space-y-5 border-b-2 border-border pb-8">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar
          alt={`${name ?? ""} logo`}
          className="size-9 bg-card"
          imageClassName="object-contain p-1"
          name={name}
          src={logoUrl}
        />
      </div>
      <h1 className="wrap-break-word font-heading text-5xl leading-[0.95] text-foreground sm:text-6xl">
        {name}
      </h1>
      {summary ? (
        <p className="max-w-2xl text-2xl leading-snug text-foreground sm:text-3xl">
          {summary}
        </p>
      ) : null}
    </header>
  )
}

interface AsideSectionProps {
  title: string
  children: ReactNode
}

function AsideSection({ title, children }: AsideSectionProps) {
  return (
    <section className="border-2 border-border bg-card">
      <h2 className="border-b-2 border-border bg-background px-4 py-2 font-heading text-sm uppercase tracking-widest text-foreground">
        {title}
      </h2>
      <div className="space-y-3 p-4 text-foreground">{children}</div>
    </section>
  )
}
