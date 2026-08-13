import { ExternalLink, Globe, Mail } from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { ComponentType, ReactNode } from "react"
import { getTranslations } from "next-intl/server"
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
import enMessages from "@/messages/en.json"

export const revalidate = 300

const platformIcons: Record<string, ComponentType<{ className?: string }>> = {
  email: Mail,
  website: Globe,
}

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
  const locale = await resolvePageLocale(
    Promise.resolve({ locale: localeParam }),
  )
  const group = await fetchStudentGroupBySlug(slug, locale, { stega: false })
  if (!group) return {}

  return buildPageMetadata({
    locale,
    canonicalPath: `/${localeParam}/grupper/${slug}`,
    title: `${group.name} | ${locale === "en" ? "Groups" : "Grupper"}`,
    description: group.summary,
    imageUrl: group.image?.assetUrl,
  })
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { slug, locale: localeParam } = await params
  const locale = await resolvePageLocale(
    Promise.resolve({ locale: localeParam }),
  )
  activateRequestLocale(locale)
  const t = await getTranslations("GroupPage")

  const group = await fetchStudentGroupBySlug(slug, locale)
  if (!group) notFound()

  const hasLinks =
    "links" in group && Array.isArray(group.links) && group.links.length > 0

  const institutionOptions = (locale === "en" ? enMessages : nbMessages)
    .InstitutionOptions as Array<{
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
                alt={
                  group.image.alt ?? t("logoAlt", { group: group.name ?? "" })
                }
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
        {group.slug && (
          <section className="panel">
            <GroupVolunteerForm
              groupSlug={group.slug}
              groupName={group.name ?? group.slug}
              institutionOptions={institutionOptions}
              subGroups={
                group.subGroups?.flatMap(
                  (sg: { slug?: string; name?: string }) =>
                    sg.slug && sg.name
                      ? [{ slug: sg.slug, name: sg.name }]
                      : [],
                ) ?? []
              }
            />
          </section>
        )}

        {(hasLinks || group.email || group.website) && (
          <AsideSection title={t("contact")}>
            {hasLinks ? (
              group.links.map((link, i) => {
                const platformKey = `platform${link.platform.charAt(0).toUpperCase()}${link.platform.slice(1)}`
                const platformLabel = link.customLabel || t(platformKey)
                const isEmail = link.platform === "email"
                const href = isEmail ? `mailto:${link.url}` : link.url
                const Icon = platformIcons[link.platform] || ExternalLink
                return (
                  <a
                    className="flex items-center gap-2 underline underline-offset-4 hover:text-primary focus-brutal"
                    href={href}
                    key={i}
                    rel={isEmail ? undefined : "noreferrer"}
                    target={isEmail ? undefined : "_blank"}
                  >
                    <Icon aria-hidden className="size-4 shrink-0" />
                    {platformLabel}
                    {!isEmail && (
                      <ExternalLink aria-hidden className="size-3 shrink-0" />
                    )}
                  </a>
                )
              })
            ) : (
              <>
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
                    {t("website")}
                    <ExternalLink aria-hidden className="size-3 shrink-0" />
                  </a>
                )}
              </>
            )}
          </AsideSection>
        )}

        {group.parentGroup && (
          <AsideSection title={t("partOf")}>
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
      </aside>
    </article>
  )
}

interface GroupMastheadProps {
  logoUrl?: string | null
  name?: string | null
  summary?: string | null
}

function GroupMasthead({ logoUrl, name, summary }: GroupMastheadProps) {
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
