import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, resolvePageLocale } from "@/lib/app-locale"
import { getPublicEvents, type EventDetail } from "@/lib/events"
import { fetchHomeBars } from "@/lib/sanity/queries"
import type { HomeBarContent } from "@/lib/sanity/types"
import { getLaunchGroups, type LaunchGroupContent } from "@/lib/volunteer-launch-content"
import Link from "next/link"

// should be in own components folder but chose not to, to to minimize mental effort while prototyping
// ALSO NO LANGUAGE TRANSLATION FOR THE SAME REASON STATED ABOVE

const fallbackBars: HomeBarContent[] = [
    {
        name: "Stjernesalen",
        description:
            "Kvarterets kafé er et vannhull som kan passe til så mangt - men kanskje først og fremst til et realt måltid eller en ekstra digg kaffe. \n \n Stjernesalen ligger i 2. etasje, og er åpent alle hverdager for å redde ditt blodsukker. Til hverdags er inngangen på oversiden av bygget (du som kommer ned bakken fra HF ramler lett inn). Barens åpningstider i Stjernesalen følger stort sett kjøkkenet. \n \n I Stjernesalen kan du delta på Kvarterets egne quiz hver tirsdag. Det er også et passende sted for å lese avisquiz sammen med venner, eller for å slå ihjel tid med laptop og kaffikopp på enmannshånd.",
    },
    {
        name: "Grøndahls",
        description: `Dette er Kvarterets egne pub i pålitelig pratestil og med stort utvalg.

Grøndahls ligger i byggets 1. etasje og er åpent alle dager utenom søndag. I hverdagene har puben inngang på gateplan i Håkonsgaten. I helgene må man benytte hovedinngang på siden av bygget. På mandager huser Grøndahls mikromandag - vårt faste konsept som gjør det enklere å bli kjent med mikrobrygg fra fjern og nær.

I Grøndahls er musikknivået alltid i favør for engasjerende samtaler. Her kan du enkelt samles med venner og bekjente - helt uformelt - når det skulle passe.`,
    },
    {
        name: "Halvtimen",
        description: `Vår cocktailbar holder kun åpent i helgene, og her er det 20-årsgrense for alle gjester.

Det kan godt være den heter Halvtimen fordi den tar litt tid å finne. Her står de frivillige klare med shakere og drinkglass for å gi deg en best mulig smaksopplevelse, og musikken er oppstemt. I Halvtimen selges det også rista brød til sultne natteravner. På torsdager arrangeres det faste konseptet TønneTorsdag, der fokuset er på alt som har vært lagra mellom planker og tønnebånd.

Halvtimen ligger i 3. etasje av bygget, opp den breie betongtrappa. Det er ID-sjekk i døra.`,
    },
]

const formatEventDate = (event: EventDetail, locale: AppLocale): string =>
    new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nb-NO", {
        day: "numeric",
        month: "long",
        timeZone: "Europe/Oslo",
    }).format(new Date(event.starts_at))

function HomeGroups({ groups, locale }: { groups: LaunchGroupContent[]; locale: AppLocale }) {
    return (
        <div className="mx-6 space-y-4">
            <Card className="bg-destructive p-2 flex flex-row justify-between">
                <p>GRUPPER</p>
                <Link href={`/${locale}/blifrivillig`}>SE MER</Link>
            </Card>

            <div className="grid grid-cols-3 gap-4">
                {groups.map(group => {
                    return (
                        <Link
                            className="flex flex-col gap-1"
                            key={group.slug}
                            href={`/${locale}/blifrivillig/${group.slug}`}
                        >
                            <Card className="h-24 bg-gray-200"></Card>
                            <p className="font-bold">{group.name}</p>
                            <p className="text-xs lg:text-base">
                                {group.lead}
                            </p>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

function HomeBars({ bars, locale }: { bars: HomeBarContent[]; locale: AppLocale }) {
    return (
        <div className="mx-6 space-y-4">
            <Card className="bg-destructive p-2 flex flex-row justify-between">
                <p>BARER</p>
                <Link href={`/${locale}/home`}>SE MER</Link>
            </Card>

            <div className="flex flex-col pt-4 gap-12">
                {bars.map((bar, i) => {
                    return (
                        <div className="flex flex-col gap-4" key={i}>
                            <h3 className="text-center text-xl">{bar.name}</h3>
                            <div className="h-0.5 bg-destructive" />
                            <div className="flex gap-4">
                                <div className="h-48 bg-gray-200 flex-1"></div>
                                <p className="flex-1 lg:flex-2 text-xs md:text-sm lg:text-base whitespace-pre-wrap">
                                    {bar.description}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function HomeEvents({ events, locale }: { events: EventDetail[]; locale: AppLocale }) {
    return (
        <div className="mx-6 space-y-4">
            <Card className="bg-destructive p-2 flex flex-row justify-between">
                <p>ARRANGEMENTER</p>
                <Link href={`/${locale}/arrangementer`}>SE MER</Link>
            </Card>

            <div className="flex w-full gap-4">
                {events.map(event => {
                    return (
                        <Link
                            key={event.id}
                            className="flex-1 "
                            href={`/${locale}/arrangementer`}
                        >
                            <Card className="h-24 bg-gray-200"></Card>
                            <div className="flex justify-between pt-2 text-xs">
                                <p>{event.event_type?.name ?? ""}</p>
                                <p>{formatEventDate(event, locale)}</p>
                            </div>
                            <p className="text-lg">{event.title}</p>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

export default async function HomePage({
    params,
}: PageProps<"/[locale]/home/forslag1">) {
    const locale = (await resolvePageLocale(params)) as AppLocale
    activateRequestLocale(locale)
    const [bars, groups, eventsResult] = await Promise.all([
        fetchHomeBars(locale),
        getLaunchGroups(locale),
        getPublicEvents(locale),
    ])
    const visibleBars = bars.length > 0 ? bars : fallbackBars
    const visibleEvents = eventsResult.ok ? eventsResult.events.slice(0, 4) : []

    return (
        <div
            className="p-8 min-h-screen"
            style={{
                backgroundImage: `
                    linear-gradient(#FF6669 1px, transparent 1px),
                    linear-gradient(90deg, #FF6669 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
            }}
        >
            <div className="h-full bg-background border-1 border-destructive flex flex-col gap-8 pb-12">
                <header className="p-4 text-center text-xl">
                    <h1>STUDENTERSAMFUNNET I BERGEN</h1>
                </header>

                <div className="h-42 bg-gray-200 my-2 w-full"></div>

                <p className="text-center px-6">
                    Studentersamfunnet i Bergen er byens eldste allmenne
                    studentorgansisasjon og Vestlandets største politisk
                    uavhengige forum for samfunns- og kulturdebatt. Vi er byens
                    seudentkulturhus og holder til på Det akademiske Kvarter.
                    Med over 100 frivillige og en rik historie driver vi med ett
                    mål for øyet: &quot;Å samle studenter og byen forøvrig til tiltak
                    som kan fremme samhold, åndsdannelse og interesse for
                    allmennkulturelle spørsmål.&quot;
                </p>

                <Button className="bg-destructive w-32 m-auto" size={"lg"}>
                    BLI FRIVILLIG
                </Button>

                <HomeEvents events={visibleEvents} locale={locale} />

                <HomeBars bars={visibleBars} locale={locale} />

                <HomeGroups groups={groups} locale={locale} />
            </div>
        </div>
    )
}
