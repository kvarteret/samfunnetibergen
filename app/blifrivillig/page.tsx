"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// ADD THIS IN SUPABASE
const groups = [
    {
        name: "Skjenkegruppen",
        description:
            "Vi drifter kvarterets faste skjenkepunkter og er med på å skape den gode stemningen på hus. Hos oss kan du få gjøre alt fra å tappe eksotisk øl i Grøndahls, lage kaffekunst og servere både søtt og salt i stjernesalen, og shake himmelske drinker i halvtimen. Medbrakt kunnskap er alltid velkommen, men er man åpen for å lære triks og tips så står vi klar for å hjelpe deg.",
    },
    {
        name: "Vaktetaten",
        description:
            "Vi sørger for at Kvarterets gjester og frivillige er trygge når de er på huset. Vi har fokus på situasjonsmestring og våre frivillige får både ordensvaktkurs og intern opplæring. Hos oss opplever du natten fra en annen side.",
    },
    {
        name: "Kraftetaten",
        description:
            "Vi styrer lyd og lys på Kvarterets arrangementer og har en stor utstyrspark vi kan leke med. Kvarteret har en av landets beste intimscener og hos oss kan du styre teknikk både for konserter, teater, revy og debatter.",
    },
    {
        name: "Kokkegruppen",
        description:
            "Kokkegruppen er strengt tatt en del av Skjenkegruppen, men for den matglade! Her lærer du grunnleggende kjøkkenferdigheter, som hvordan den klassiske stjerneburgeren blir til! Man får også kreativ frihet til å bake noe godt til kafeén. Uansett om du er en nybegynner eller allerede er flink på kjøkkenet, så er du hjertelig velkommen hos oss! Du får all opplæringen du trenger. ",
    },
    {
        name: "E-tjenesten",
        description:
            "E-tjenesten er IT-gruppen til Det Akademiske Kvarter. Gruppen drifter og videreutvikler Kvarterets nettsider og vår interne databaser. Oppgavene er allsidige og gjelder både frontend og backend. IT-gruppen er en sosial gjeng hvor du lett lærer av og sammen med andre.",
    },
    {
        name: "PR-etaten",
        description:
            "Vi sørger for at Kvarteret er synlig overalt. Vi har undergruppene So-Me, grafisk design og foto. Vi drifter våre kanaler på sosiale medier, dokumenterer alt som skjer på hus, lager annonseringsplaner for digitale flater, skriver pressemeldinger og designer alle trykksaker. Her lærer du markedsføring i praksis.",
    },
    {
        name: "Produksjonavdelingene",
        description:
            "Vi står bak Kvarterets egne program i løpet av semesteret. Her er det rom for nye påfunn - både hverdag og helg! Oppgavene er varierte og studentbergen venter i spenning. Produksjonsavdelingen består av tre undergrupper: Quizgruppen, DJ-gruppen og Arrangementsgruppen.",
    },
    {
        name: "Personalgruppen",
        description:
            "Personalgruppen har ansvar for sosiale høydepunkter, rekruttering, kortproduksjon, kurs- og kompetansetiltak på huset. Gruppen består av et styre og Kvarterets egne band - Villa People - som gjerne opptrer på internfester og andre arrangementer. For å være med i Personalgruppen må man ha vært aktiv i Kvarteret eller en tilknyttet drifts- eller brukerorganisasjon i minst ett semester.",
    },
    {
        name: "Rettsvesenet",
        description:
            "Rettsvesenet er en gruppe jusstudenter som bistår Det Akademiske Kvarter med juridisk rådgivning. Som medlem i Rettsvesenet vil du få nyttig erfaring som kommer godt med både i de videre studiene, og senere i arbeidslivet. Gjennom Rettsvesenet blir du også kjent med studenter fra andre studieår enn ditt eget. Vervet hos oss lar seg godt kombinere med både studier og deltidsjobb. Vi er mange saksbehandlere, så arbeidet fordeles godt, men det er nok til at alle får prøvd seg i rollen.",
    },
]

export default function BlifilvrilligPage() {
    const [selectedGroup, setSelectedGroup] = React.useState<string>("")
    const [name, setName] = React.useState<string>("")
    const [email, setEmail] = React.useState<string>("")
    const [message, setMessage] = React.useState<string>("")
    const [consent, setConsent] = React.useState<boolean>(false)

    const [error, setError] = React.useState<string>("")
    const [success, setSuccess] = React.useState<string>("")

    function isValidEmail(value: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    }

    function onSubmit() {
        setError("")
        setSuccess("")

        if (!selectedGroup) return setError("Velg en gruppe du vil bli med i.")
        if (!name.trim()) return setError("Skriv inn navn.")
        if (!isValidEmail(email)) return setError("Skriv inn en gyldig e-post.")
        if (!consent) {
            return setError("Du må samtykke for å sende inn skjemaet.")
        }

        setSuccess("Vi har mottatt søknaden. Vi vil ta kontakt snartest.")
        setName("")
        setEmail("")
        setMessage("")
        setSelectedGroup("")
        setConsent(false)
    }

    return (
        <div className="p-6 sm:p-10">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                    BLI FRIVILLIG
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    Velg en gruppe og send inn informasjonen din. Vi svarer så
                    snart vi kan.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-secondary-background">
                    <CardHeader>
                        <CardTitle>Velg gruppe</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3">
                            {groups.map((group, i) => {
                                const active = selectedGroup === group.name
                                return (
                                    <Button
                                        key={i}
                                        type="button"
                                        onClick={() =>
                                            setSelectedGroup(group.name)
                                        }
                                        className="h-14 justify-start px-4"
                                        variant={active ? "default" : "neutral"}
                                    >
                                        {group.name.toUpperCase()}
                                    </Button>
                                )
                            })}
                        </div>

                        <div className="mt-4 text-xs text-muted-foreground">
                            {selectedGroup
                                ? `Du har valgt: ${selectedGroup}`
                                : "Velg en av gruppene for å fortsette."}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-secondary-background">
                    <CardHeader>
                        <CardTitle>Kontaktinfo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Navn</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="NAME"
                                    autoComplete="name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">E-post</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="EMAIL"
                                    autoComplete="email"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">
                                    Melding (valgfritt)
                                </Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Si litt om hva du ønsker å bidra med..."
                                    rows={4}
                                />
                            </div>

                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="consent"
                                    checked={consent}
                                    onCheckedChange={(v) =>
                                        setConsent(Boolean(v))
                                    }
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label
                                        htmlFor="consent"
                                        className="cursor-pointer"
                                    >
                                        Jeg samtykker til at dere kan kontakte
                                        meg om frivillighetsrolen.
                                    </Label>
                                </div>
                            </div>

                            <Button type="submit" className="h-14 w-full">
                                SUBMIT
                            </Button>

                            {error ? (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertTitle>Noe gikk galt</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            ) : null}

                            {success ? (
                                <Alert className="mb-4">
                                    <AlertTitle>Sendt!</AlertTitle>
                                    <AlertDescription>
                                        {success}
                                    </AlertDescription>
                                </Alert>
                            ) : null}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
