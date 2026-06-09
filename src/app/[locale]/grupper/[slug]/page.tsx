import { ExternalLink, Globe, Mail } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Surface } from "@/components/ui/surface";
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale";
import { PortableTextContent } from "@/lib/portable-text-components";
import {
  fetchStudentGroupBySlug,
  fetchStudentGroupSlugs,
} from "@/lib/sanity/fetch";

export const revalidate = 300;

const CATEGORY_LABELS: Record<string, string> = {
  arbeidsgruppe: "Arbeidsgruppe",
  komitee: "Komité",
  dorg: "Driftsorganisasjon",
  borg: "Brukerorganisasjon",
};

type GroupPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const [locales, slugs] = await Promise.all([
    getLocaleStaticParams(),
    fetchStudentGroupSlugs(),
  ]);
  return locales.flatMap(({ locale }) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({ params }: GroupPageProps) {
  const { slug, locale: localeParam } = await params;
  await resolvePageLocale(Promise.resolve({ locale: localeParam }));
  const group = await fetchStudentGroupBySlug(slug, { stega: false });
  if (!group) return {};

  return {
    title: `${group.name} | Grupper | Samfunnet i Bergen`,
    description: group.summary,
  };
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { slug, locale: localeParam } = await params;
  const locale = await resolvePageLocale(
    Promise.resolve({ locale: localeParam }),
  );
  activateRequestLocale(locale);

  const group = await fetchStudentGroupBySlug(slug);
  if (!group) notFound();

  const categoryLabel = group.category
    ? (CATEGORY_LABELS[group.category] ?? null)
    : null;

  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-8">
        <header className="space-y-5">
          {categoryLabel && (
            <p className="w-fit bg-primary px-3 py-1.5 font-heading text-sm text-primary-foreground">
              {categoryLabel}
            </p>
          )}
          <div className="flex items-start gap-4">
            {group.logoUrl ? (
              <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
                <Image
                  alt={`${group.name} logo`}
                  className="object-contain p-1.5"
                  fill
                  src={group.logoUrl}
                />
              </div>
            ) : null}
            <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
              {group.name}
            </h1>
          </div>
          <p className="text-xl leading-8 text-foreground">{group.summary}</p>
        </header>

        {group.image?.assetUrl ? (
          <figure className="space-y-2">
            <div className="relative aspect-[16/9] w-full overflow-hidden border-2 border-border bg-muted">
              <Image
                alt={group.image.alt ?? group.name ?? ""}
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                src={group.image.assetUrl}
              />
            </div>
            {group.image.caption ? (
              <figcaption className="text-sm text-muted-foreground">
                {group.image.caption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        {group.body && group.body.length > 0 && (
          <div className="text-lg leading-8 text-foreground">
            <PortableTextContent value={group.body} />
          </div>
        )}
      </div>

      <aside className="space-y-6">
        {(group.email || group.website) && (
          <Surface as="section" className="space-y-3">
            <h2 className="font-heading text-xl text-foreground">Kontakt</h2>
            {group.email && (
              <a
                className="flex items-center gap-2 underline underline-offset-4"
                href={`mailto:${group.email}`}
              >
                <Mail aria-hidden className="size-4" />
                {group.email}
              </a>
            )}
            {group.website && (
              <a
                className="flex items-center gap-2 underline underline-offset-4"
                href={group.website}
                rel="noreferrer"
                target="_blank"
              >
                <Globe aria-hidden className="size-4" />
                Nettside
                <ExternalLink aria-hidden className="size-3" />
              </a>
            )}
          </Surface>
        )}

        {group.parentGroup && (
          <Surface as="section" className="space-y-2">
            <h2 className="font-heading text-xl text-foreground">Del av</h2>
            {group.parentGroup.slug ? (
              <a
                className="text-base text-foreground underline underline-offset-4"
                href={`/${locale}/grupper/${group.parentGroup.slug}`}
              >
                {group.parentGroup.name}
              </a>
            ) : (
              <p className="text-base text-foreground">
                {group.parentGroup.name}
              </p>
            )}
          </Surface>
        )}

        {group.subGroups?.length ? (
          <Surface as="section" className="space-y-3">
            <h2 className="font-heading text-xl text-foreground">
              Undergrupper
            </h2>
            <ul className="flex flex-wrap gap-2">
              {group.subGroups.map((subGroup) => (
                <li
                  className="border-2 border-border bg-background px-2 py-1 font-heading text-sm text-foreground"
                  key={subGroup.slug ?? subGroup.name}
                >
                  {subGroup.name}
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}
      </aside>
    </article>
  );
}
