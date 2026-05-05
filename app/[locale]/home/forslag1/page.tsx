import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { activateRequestLocale, resolvePageLocale } from "@/lib/app-locale"
import Link from "next/link"

function Footer() {
    return <div></div>
}

// should be in own components folder but chose not to, to to minimize mental effort while prototyping
// ALSO NO LANGUAGE TRANSLATION FOR THE SAME REASON STATED ABOVE

function HomeGroups() {
    const group = {
        name: "lorem ipsum",
        description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris ex eros, consectetur in hendrerit eu.",
    }

    const groups = [group, group, group, group, group, group]

    return (
        <div className="mx-6 space-y-4">
            <Card className="bg-destructive p-2 flex flex-row justify-between">
                <p>BARER</p>
                <Link href={"/bars"}>SE MER</Link>
            </Card>

            <div className="grid grid-cols-3 gap-4">
                {groups.map((group, i) => {
                    return (
                        <Link
                            className="flex flex-col gap-1"
                            key={i}
                            href={"/groups"}
                        >
                            <Card className="h-24 bg-gray-200"></Card>
                            <p className="font-bold">{group.name}</p>
                            <p className="text-xs lg:text-base">
                                {group.description}
                            </p>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

function HomeBars() {
    // FETCH FROM SANITY CMS
    type Bar = { name: string; description: string }
    const bars: Bar[] = [
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

    return (
        <div className="mx-6 space-y-4">
            <Card className="bg-destructive p-2 flex flex-row justify-between">
                <p>BARER</p>
                <Link href={"/bars"}>SE MER</Link>
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

function HomeEvents() {
    // FETCH FROM SUPABASE
    const event = {
        name: "DJ LOOKA GRØNDALHS SET",
        type: "konsert",
        when: "4. April",
        slug: "DJ-LOOKA-GRØNDAHLS-SET",
    }

    const events = [event, event, event, event]

    return (
        <div className="mx-6 space-y-4">
            <Card className="bg-destructive p-2 flex flex-row justify-between">
                <p>ARRANGEMENTER</p>
                <Link href={"/events"}>SE MER</Link>
            </Card>

            <div className="flex w-full gap-4">
                {events.map((event, i) => {
                    return (
                        <Link
                            key={i}
                            className="flex-1 "
                            href={`/${event.slug}`}
                        >
                            <Card className="h-24 bg-gray-200"></Card>
                            <div className="flex justify-between pt-2 text-xs">
                                <p>{event.type}</p>
                                <p>{event.when}</p>
                            </div>
                            <p className="text-lg">{event.name}</p>
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
    const locale = await resolvePageLocale(params)
    activateRequestLocale(locale)

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
                    mål for øyet: "Å samle studenter og byen forøvrig til tiltak
                    som kan fremme samhold, åndsdannelse og interesse for
                    allmennkulturelle spørsmål."
                </p>

                <Button className="bg-destructive w-32 m-auto" size={"lg"}>
                    BLI FRIVILLIG
                </Button>

                <HomeEvents />

                <HomeBars />

                <HomeGroups />
            </div>
        </div>
    )
}
