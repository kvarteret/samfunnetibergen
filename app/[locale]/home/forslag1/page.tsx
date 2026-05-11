import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, resolvePageLocale } from "@/lib/app-locale"
import { type EventDetail, getPublicEvents } from "@/lib/events"
import { getVolunteerGroups, type VolunteerGroupContent } from "@/lib/volunteer-group-content"
import ExpandableText from "../components/ExpandableText"

type BarContent = { name: string; imageUrl: string | null; description: string }

const fallbackBars: BarContent[] = [
    {
        name: "Stjernesalen",
        imageUrl: null,
        description:
            "Kvarterets kafé er et vannhull som kan passe til så mangt - men kanskje først og fremst til et realt måltid eller en ekstra digg kaffe. \n \n Stjernesalen ligger i 2. etasje, og er åpent alle hverdager for å redde ditt blodsukker. Til hverdags er inngangen på oversiden av bygget (du som kommer ned bakken fra HF ramler lett inn). Barens åpningstider i Stjernesalen følger stort sett kjøkkenet. \n \n I Stjernesalen kan du delta på Kvarterets egne quiz hver tirsdag. Det er også et passende sted for å lese avisquiz sammen med venner, eller for å slå ihjel tid med laptop og kaffikopp på enmannshånd.",
    },
    {
        name: "Grøndahls",
        imageUrl: null,
        description: `Dette er Kvarterets egne pub i pålitelig pratestil og med stort utvalg.

Grøndahls ligger i byggets 1. etasje og er åpent alle dager utenom søndag. I hverdagene har puben inngang på gateplan i Håkonsgaten. I helgene må man benytte hovedinngang på siden av bygget. På mandager huser Grøndahls mikromandag - vårt faste konsept som gjør det enklere å bli kjent med mikrobrygg fra fjern og nær.

I Grøndahls er musikknivået alltid i favør for engasjerende samtaler. Her kan du enkelt samles med venner og bekjente - helt uformelt - når det skulle passe.`,
    },
    {
        name: "Halvtimen",
        imageUrl: null,
        description: `Vår cocktailbar holder kun åpent i helgene, og her er det 20-årsgrense for alle gjester.

Det kan godt være den heter Halvtimen fordi den tar litt tid å finne. Her står de frivillige klare med shakere og drinkglass for å gi deg en best mulig smaksopplevelse, og musikken er oppstemt. I Halvtimen selges det også rista brød til sultne natteravner. På torsdager arrangeres det faste konseptet TønneTorsdag, der fokuset er på alt som har vært lagra mellom planker og tønnebånd.

Halvtimen ligger i 3. etasje av bygget, opp den breie betongtrappa. Det er ID-sjekk i døra.`,
    },
]

const formatEventDate = (event: EventDetail, locale: AppLocale): string => (
    void locale,
    new Intl.DateTimeFormat("nb-NO", {
        day: "numeric",
        month: "long",
        timeZone: "Europe/Oslo",
    }).format(new Date(event.starts_at))
)

export default async function HomePage({ params }: PageProps<"/[locale]/home/forslag1">) {
    const locale = (await resolvePageLocale(params)) as AppLocale
    activateRequestLocale(locale)
    const [groups, eventsResult] = await Promise.all([
        getVolunteerGroups(locale),
        getPublicEvents(locale),
    ])
    const visibleBars = fallbackBars
    const visibleEvents = eventsResult.ok ? eventsResult.events.slice(0, 4) : []

    return (
        <div
            className="min-h-screen p-8"
            style={{
                backgroundImage: `
                    linear-gradient(#FF6669 1px, transparent 1px),
                    linear-gradient(90deg, #FF6669 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
            }}
        >
            <div className="flex h-full flex-col gap-8 border-1 border-destructive bg-background pb-12">
                <header className="p-4 text-center text-xl">
                    <h1>STUDENTERSAMFUNNET I BERGEN</h1>
                </header>

                <div className="my-2 h-42 w-full bg-gray-200"></div>

                <p className="px-6 text-center">
                    Studentersamfunnet i Bergen er byens eldste allmenne studentorgansisasjon og
                    Vestlandets største politisk uavhengige forum for samfunns- og kulturdebatt. Vi
                    er byens seudentkulturhus og holder til på Det akademiske Kvarter. Med over 100
                    frivillige og en rik historie driver vi med ett mål for øyet: &quot;Å samle
                    studenter og byen forøvrig til tiltak som kan fremme samhold, åndsdannelse og
                    interesse for allmennkulturelle spørsmål.&quot;
                </p>

                <Button className="m-auto w-32 bg-destructive" size={"lg"}>
                    BLI FRIVILLIG
                </Button>

                <HomeEvents events={visibleEvents} locale={locale} />

                <HomeBars bars={visibleBars} locale={locale} />

                <HomeGroups groups={groups} locale={locale} />
            </div>
        </div>
    )
}

interface HomeEventsProps {
    events: EventDetail[]
    locale: AppLocale
}

function HomeEvents({ events, locale }: HomeEventsProps) {
    return (
        <div className="mx-6 space-y-4">
            <Card className="flex flex-row justify-between bg-destructive p-2">
                <p>ARRANGEMENTER</p>
                <Link href={`/${locale}/arrangementer`}>SE MER</Link>
            </Card>

            <div className="flex w-full gap-4">
                {events.map(event => (
                    <Link className="flex-1" href={`/${locale}/arrangementer`} key={event.id}>
                        <Card className="relative h-24 overflow-hidden bg-gray-200">
                            {event.image_url && (
                                <Image
                                    alt={event.title}
                                    className="object-cover"
                                    fill
                                    src={event.image_url}
                                />
                            )}
                        </Card>
                        <div className="flex justify-between pt-2 text-xs">
                            <p>{event.event_type?.name ?? ""}</p>
                            <p>{formatEventDate(event, locale)}</p>
                        </div>
                        <p className="text-lg">{event.title}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}

interface HomeBarsProps {
    bars: BarContent[]
    locale: AppLocale
}

function HomeBars({ bars, locale }: HomeBarsProps) {
    return (
        <div className="mx-6 space-y-4">
            <Card className="flex flex-row justify-between bg-destructive p-2">
                <p>BARER</p>
                <Link href={`/${locale}/home`}>SE MER</Link>
            </Card>

            <div className="flex flex-col gap-12 pt-4">
                {bars.map(bar => (
                    <div className="flex flex-col gap-4" key={bar.name}>
                        <h3 className="text-center text-xl">{bar.name}</h3>
                        <div className="h-0.5 bg-destructive" />
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="relative h-48 overflow-hidden bg-gray-200">
                                {bar.imageUrl && (
                                    <Image
                                        alt={bar.name ?? ""}
                                        className="object-cover"
                                        fill
                                        src={bar.imageUrl}
                                    />
                                )}
                            </div>
                            <ExpandableText text={bar.description} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

interface HomeGroupsProps {
    groups: VolunteerGroupContent[]
    locale: AppLocale
}

function HomeGroups({ groups, locale }: HomeGroupsProps) {
    return (
        <div className="mx-6 space-y-4">
            <Card className="flex flex-row justify-between bg-destructive p-2">
                <p>GRUPPER</p>
                <Link href={`/${locale}/grupper`}>SE MER</Link>
            </Card>

            <div className="grid grid-cols-3 gap-4">
                {groups.map(group => (
                    <Link
                        className="flex flex-col gap-1"
                        href={`/${locale}/grupper/${group.slug}`}
                        key={group.slug}
                    >
                        <Card className="relative h-24 overflow-hidden bg-gray-200">
                            {group.imageUrl && (
                                <Image
                                    alt={group.name ?? ""}
                                    className="object-cover"
                                    fill
                                    src={group.imageUrl}
                                />
                            )}
                        </Card>
                        <p className="font-bold">{group.name}</p>
                        <p className="text-xs lg:text-base">{group.lead}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
