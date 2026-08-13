import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { GroupsFilter, ValgomatenInfobox } from "@/features/grupper"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import { PortableTextContent } from "@/lib/portable-text-components"
import type { GroupsPageContent, StudentGroupSummary } from "@/lib/sanity/fetch"
import { fetchGroupsPageContent, fetchStudentGroups } from "@/lib/sanity/fetch"
import { getTranslations } from "next-intl/server"

export const revalidate = 300

type GroupCategory = NonNullable<StudentGroupSummary["category"]>

const GROUP_SECTION_CATEGORIES: Array<{
  key: "categoryWork" | "categoryPartners"
  categories: GroupCategory[]
}> = [
  {
    key: "categoryWork",
    categories: ["arbeidsgruppe", "komitee"],
  },
  {
    key: "categoryPartners",
    categories: ["dorg", "borg"],
  },
]

const groupCategories = new Set<string>(
  GROUP_SECTION_CATEGORIES.flatMap(section => section.categories),
)

const groupBySection = (
  groups: StudentGroupSummary[],
  t: (key: string) => string,
) =>
  GROUP_SECTION_CATEGORIES.map(section => ({
    title: t(section.key),
    categories: section.categories,
    groups: groups.filter(
      group => group.category && section.categories.includes(group.category),
    ),
  })).filter(section => section.groups.length > 0)

const uncategorizedGroups = (groups: StudentGroupSummary[]) =>
  groups.filter(
    group => !group.category || !groupCategories.has(group.category),
  )

export function generateStaticParams() {
  return getLocaleStaticParams()
}

type GroupsPageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: GroupsPageProps) {
  const locale = await resolvePageLocale(params)

  return buildPageMetadata({
    locale,
    canonicalPath: `/${locale}/grupper`,
    title: locale === "en" ? "Volunteer" : "Bli frivillig",
    description:
      locale === "en"
        ? "Find a student group that matches your interests and register your interest in volunteering."
        : "Bli frivillig i Bergen og finn studentgruppen som passer for deg.",
  })
}

export default async function GroupsPage({ params }: GroupsPageProps) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)
  const t = await getTranslations("GroupsPage")

  const [content, groups] = await Promise.all([
    fetchGroupsPageContent(locale),
    fetchStudentGroups(locale),
  ])

  const sections = [
    ...groupBySection(groups, t),
    { title: t("categoryOther"), groups: uncategorizedGroups(groups) },
  ].filter(section => section.groups.length > 0)

  const allLabels = Array.from(
    new Set(groups.flatMap(g => g.labels ?? [])),
  ).toSorted((a, b) => a.localeCompare(b, "nb"))

  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <header className="space-y-5">
          {content?.eyebrow &&
          (locale === "nb" || content.hasEnglishTranslation) ? (
            <p className="w-fit bg-primary px-3 py-1.5 font-heading text-primary-foreground">
              {content.eyebrow}
            </p>
          ) : null}
          <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
            {locale === "nb" || content?.hasEnglishTranslation
              ? (content?.title ?? t("title"))
              : t("title")}
          </h1>
          <p className="max-w-3xl text-xl leading-8 text-foreground">
            {locale === "nb" || content?.hasEnglishTranslation
              ? (content?.description ?? t("intro"))
              : t("intro")}
          </p>
        </header>
        <ValgomatenInfobox />
      </div>

      {content?.sections?.length ? (
        <section className="grid gap-6 md:grid-cols-2">
          {content.sections.map(section => (
            <article className="panel space-y-4" key={section._key}>
              {section.title ? (
                <h2 className="font-heading text-3xl leading-none text-foreground">
                  {section.title}
                </h2>
              ) : null}
              <PortableTextContent value={section.body} />
            </article>
          ))}
        </section>
      ) : null}

      <GroupsFilter
        allLabel={t("all")}
        allLabels={allLabels}
        sections={sections}
      />

      {content?.faq?.filter(
        item => locale === "nb" || item.hasEnglishTranslation,
      ).length ? (
        <section className="space-y-5">
          <h2 className="font-heading text-4xl leading-none text-foreground">
            {t("faq")}
          </h2>
          <Accordion>
            {content.faq
              .filter(item => locale === "nb" || item.hasEnglishTranslation)
              .map((item: NonNullable<GroupsPageContent["faq"]>[number]) => (
                <AccordionItem key={item._key} value={item._key}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionPanel>
                    <div className="paper-prose !bg-transparent !p-0 text-foreground">
                      {item.answer?.map((paragraph: string) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              ))}
          </Accordion>
        </section>
      ) : null}
    </div>
  )
}
