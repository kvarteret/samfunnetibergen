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
import type { GroupsPageContent, StudentGroupSummary } from "@/lib/sanity/fetch"
import { fetchGroupsPageContent, fetchStudentGroups } from "@/lib/sanity/fetch"
import {
  VOLUNTEER_LISTING_PATH,
  VOLUNTEER_PAGE_DESCRIPTION,
  VOLUNTEER_PAGE_INTRO,
  VOLUNTEER_PAGE_TITLE,
} from "@/lib/volunteer-routes"

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

type VolunteerPageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: VolunteerPageProps) {
  const locale = await resolvePageLocale(params)

  return buildPageMetadata({
    canonicalPath: `/${locale}${VOLUNTEER_LISTING_PATH}`,
    title: VOLUNTEER_PAGE_TITLE,
    description: VOLUNTEER_PAGE_DESCRIPTION,
  })
}

export default async function VolunteerPage({ params }: VolunteerPageProps) {
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
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <header className="space-y-5">
          {content?.eyebrow ? (
            <p className="w-fit bg-primary px-3 py-1.5 font-heading text-primary-foreground">
              {content.eyebrow}
            </p>
          ) : null}
          <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
            {VOLUNTEER_PAGE_TITLE}
          </h1>
          <p className="max-w-3xl text-xl leading-8 text-foreground">
            {VOLUNTEER_PAGE_INTRO}
          </p>
          {content?.title || content?.description ? (
            <div className="max-w-3xl space-y-2">
              {content?.title ? (
                <h2 className="font-heading text-3xl leading-none text-foreground">
                  {content.title}
                </h2>
              ) : null}
              {content?.description ? (
                <p className="text-lg leading-7 text-foreground">
                  {content.description}
                </p>
              ) : null}
            </div>
          ) : null}
        </header>
        <ValgomatenInfobox />
      </div>

      <GroupsFilter allLabels={allLabels} sections={sections} />

      {content?.faq?.length ? (
        <section className="space-y-5">
          <h2 className="font-heading text-4xl leading-none text-foreground">
            Ofte stilte spørsmål
          </h2>
          <Accordion>
            {content.faq.map(
              (item: NonNullable<GroupsPageContent["faq"]>[number]) => (
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
              ),
            )}
          </Accordion>
        </section>
      ) : null}
    </div>
  )
}
