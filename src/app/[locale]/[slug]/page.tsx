import { notFound } from "next/navigation";

import ReactMarkdown from "react-markdown";

import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale";
import { fetchPageBySlug, fetchPageSlugs } from "@/lib/sanity/fetch";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const locales = getLocaleStaticParams();
  const slugs = await fetchPageSlugs();
  return locales.flatMap(({ locale }) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale: localeParam } = await params;
  await resolvePageLocale(Promise.resolve({ locale: localeParam }));
  const page = await fetchPageBySlug(slug, { stega: false });
  if (!page) return {};

  return {
    title: `${page.seoTitle ?? page.title} | Samfunnet i Bergen`,
    description: page.seoDescription ?? undefined,
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug, locale: localeParam } = await params;
  const locale = await resolvePageLocale(
    Promise.resolve({ locale: localeParam }),
  );
  activateRequestLocale(locale);

  const page = await fetchPageBySlug(slug);
  if (!page) notFound();

  return (
    <div className="prose prose-neutral max-w-4xl dark:prose-invert">
      <ReactMarkdown>{page.content ?? ""}</ReactMarkdown>
    </div>
  );
}
