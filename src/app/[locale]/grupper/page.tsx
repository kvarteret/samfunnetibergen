import { Disclosure } from "@/components/ui/disclosure"
import { GroupsFilter } from "@/features/grupper"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import type { GroupsPageContent, StudentGroupSummary } from "@/lib/sanity/fetch"
import { fetchGroupsPageContent, fetchStudentGroups } from "@/lib/sanity/fetch"

export const revalidate = 300

type GroupCategory = NonNullable<StudentGroupSummary["category"]>

type GroupSection = {
  title: string
  categories: GroupCategory[]
}

const GROUP_SECTIONS: GroupSection[] = [
  {
    title: "Arbeidsgrupper & Komiteer",
    categories: ["arbeidsgruppe", "komitee"],
  },
  {
    title: "Samarbeidspartnere",
    categories: ["dorg", "borg"],
  },
]

const groupCategories = new Set<string>(
  GROUP_SECTIONS.flatMap(section => section.categories),
)

const groupBySection = (groups: StudentGroupSummary[]) =>
  GROUP_SECTIONS.map(section => ({
    ...section,
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
  await resolvePageLocale(params)
  const content = await fetchGroupsPageContent({ stega: false })

  return {
    title: `${content?.seoTitle ?? content?.title ?? "Grupper"} | Samfunnet i Bergen`,
    description:
      content?.seoDescription ??
      content?.description ??
      "Se gruppene i Samfunnet.",
  }
}

export default async function GroupsPage({ params }: GroupsPageProps) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)

  const [content, groups] = await Promise.all([
    fetchGroupsPageContent(),
    fetchStudentGroups(),
  ])

  const sections = [
    ...groupBySection(groups),
    { title: "Andre grupper", groups: uncategorizedGroups(groups) },
  ].filter(section => section.groups.length > 0)

  const allLabels = Array.from(
    new Set(groups.flatMap(g => g.labels ?? [])),
  ).toSorted((a, b) => a.localeCompare(b, "nb"))

  return (
    <div className="space-y-12">
      <header className="space-y-5">
        {content?.eyebrow ? (
          <p className="w-fit bg-primary px-3 py-1.5 font-heading text-sm text-primary-foreground">
            {content.eyebrow}
          </p>
        ) : null}
        <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
          {content?.title ?? "Grupper"}
        </h1>
        {content?.description ? (
          <p className="max-w-3xl text-xl leading-8 text-foreground">
            {content.description}
          </p>
        ) : null}
      </header>

      <GroupsFilter allLabels={allLabels} sections={sections} />

      {content?.faq?.length ? (
        <section className="space-y-5">
          <h2 className="font-heading text-4xl leading-none text-foreground">
            Ofte stilte spørsmål
          </h2>
          <div className="grid gap-4">
            {content.faq.map(
              (item: NonNullable<GroupsPageContent["faq"]>[number]) => (
                <Disclosure key={item._key} summary={item.question}>
                  <div className="paper-prose text-base text-foreground">
                    {item.answer?.map((paragraph: string) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </Disclosure>
              ),
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}
