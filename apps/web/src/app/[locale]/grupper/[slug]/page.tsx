import { ExternalLink, Globe, Mail } from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import type { ComponentType, ReactNode } from "react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ContentPageViewTracking } from "@/components/content-page-view-tracking"
import { SanityImage } from "@/components/sanity-image"
import { GroupEvents } from "@/features/events/components/GroupEvents"
import {
  closedApplicationStatus,
  GroupApplicationsClosed,
  GroupVolunteerForm,
} from "@/features/grupper"
import type { AppLocale } from "@/i18n/routing"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { PortableTextContent } from "@/lib/portable-text-components"
import { groupTrackingAttributes } from "@/lib/posthog/tracking-attributes"
import {
  fetchStudentGroupBySlug,
  fetchStudentGroupSlugs,
} from "@/lib/sanity/fetch"
import enMessages from "@/messages/en.json"
import nbMessages from "@/messages/nb.json"

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

  const closedStatus = closedApplicationStatus(group.applicationStatus)

  const institutionOptions = (locale === "en" ? enMessages : nbMessages)
    .InstitutionOptions as Array<{
    value: string
    label: string
  }>

  return (
    <article
      className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]"
      {...groupTrackingAttributes(group, "group-detail")}
    >
      <div className="space-y-8">
        <ContentPageViewTracking
          content={{ _id: group._id, slug: group.slug, title: group.name }}
          contentType="group"
          locale={locale}
        />
        <Breadcrumbs
          className="mb-8"
          current={group.name ?? group.slug}
          path={`/grupper/${slug}`}
        />
        <GroupMasthead
          hideName={group.hideName}
          logoUrl={group.logoUrl}
          name={group.name}
          summary={group.summary}
        />

        {group.image?.assetUrl ? (
          <figure className="space-y-2">
            <div className="relative aspect-video w-full overflow-hidden border-2 border-border bg-muted">
              <SanityImage
                alt={
                  group.image.alt ?? t("logoAlt", { group: group.name ?? "" })
                }
                aspectRatio={16 / 9}
                frame={group.image.frame}
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

        <GroupEvents groupId={group._id} locale={locale as AppLocale} />
      </div>

      <aside className="min-w-0 space-y-6">
        {group.slug && (
          <section className="panel">
            {closedStatus ? (
              <GroupApplicationsClosed status={closedStatus} />
            ) : (
              <GroupVolunteerForm
                groupId={group._id}
                groupSlug={group.slug}
                groupName={group.name ?? group.slug}
                institutionOptions={institutionOptions}
                subGroups={
                  group.subGroups?.flatMap(sg =>
                    sg.slug &&
                    sg.name &&
                    !closedApplicationStatus(sg.applicationStatus)
                      ? [{ slug: sg.slug, name: sg.name }]
                      : [],
                  ) ?? []
                }
              />
            )}
          </section>
        )}

        {(hasLinks || group.email || group.website) && (
          <AsideSection title={t("contact")}>
            {hasLinks ? (
              group.links.map((link, i) => {
                if (!link.platform || !link.url) return null
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
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {platformLabel}
                    </span>
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
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {group.email}
                    </span>
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
  hideName?: boolean | null
  logoUrl?: string | null
  name?: string | null
  summary?: string | null
}

function GroupMasthead({
  hideName,
  logoUrl,
  name,
  summary,
}: GroupMastheadProps) {
  const logoOnly = Boolean(hideName && logoUrl)

  return (
    <header className="space-y-6 border-b-2 border-border pb-8">
      {logoOnly && logoUrl ? (
        <>
          <div className="relative h-32 w-full max-w-md sm:h-40">
            <Image
              alt=""
              className="object-contain object-left"
              fill
              priority
              sizes="28rem"
              src={logoUrl}
            />
          </div>
          <h1 className="sr-only">{name}</h1>
        </>
      ) : (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6 lg:flex-col lg:items-start xl:flex-row xl:items-center">
          {logoUrl ? (
            <div className="relative size-24 shrink-0 sm:size-28">
              <Image
                alt=""
                className="object-contain"
                fill
                priority
                sizes="112px"
                src={logoUrl}
              />
            </div>
          ) : null}
          <h1 className="min-w-0 wrap-break-word text-page-title text-foreground">
            {name}
          </h1>
        </div>
      )}
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
