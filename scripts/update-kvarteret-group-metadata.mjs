import { createClient } from "@sanity/client"
import { config } from "dotenv"

config({ path: ".env.local", quiet: true })

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "mkjoahvv",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    apiVersion: "2024-01-01",
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false,
})

if (!process.env.SANITY_WRITE_TOKEN) {
    throw new Error("SANITY_WRITE_TOKEN is required")
}

const block = (text, style = "normal") => ({
    _key: key(`block-${text}`),
    _type: "block",
    style,
    markDefs: [],
    children: [
        {
            _key: key(`span-${text}`),
            _type: "span",
            marks: [],
            text,
        },
    ],
})

const key = value =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 12)
        .padEnd(12, "0")

const groupUpdates = [
    {
        slug: "skjenkegruppen",
        summary:
            "Skjenkegruppen er Kvarterets kokker, servitører og bartendere, og drifter de faste barene og kjøkkenet.",
        website: "https://kvarteret.no/skjenkegruppen/",
        body: [
            block(
                "Skjenkegruppen er Kvarterets kokker, servitører og bartendere. De drifter de faste barene og kjøkkenet på huset.",
            ),
            block(
                "Dette er den største arbeidsgruppen på Kvarteret og et sted hvor du blir kjent med mange nye mennesker både på jobb og gjennom sosiale arrangementer.",
            ),
            block(
                "Du trenger ingen forhåndskunnskaper for å lykkes i Skjenke. Også på kjøkkenet får du opplæringen du trenger.",
            ),
            block("Tidsbruk", "h2"),
            block(
                "I Skjenke jobber man som regel ett skift i uken. Skiftene ligger typisk mellom 12:00 og 01:00 på hverdager og til 04:00 i helgene. Halvtimen er unntaket, siden baren bare er åpen i helgene og vanligvis har tre skift i måneden.",
            ),
            block("Undergrupper", "h2"),
            block("Stjernesalen", "h3"),
            block(
                "Stjernesalen er kafeen hvor det serveres mat, kaffe og kaker. Som frivillig lærer du blant annet baristaarbeid, mocktailoppskrifter og vinutvalg.",
            ),
            block("Kokkegruppen", "h3"),
            block(
                "Kokkegruppen jobber på Kvarterets kjøkken med mat til gjester, arrangementer, fester og konserter på huset.",
            ),
            block("Halvtimen", "h3"),
            block(
                "Halvtimen er Kvarterets cocktailbar. Du må ha fylt 20 år for å være frivillig her, og får prøve deg med drinker, farger og smaker i helgene.",
            ),
            block("Grøndahls", "h3"),
            block(
                "Grøndahls er puben med stort sortiment og høyt tempo. Det er også et naturlig samlingssted for frivillige etter endt skift.",
            ),
        ],
    },
    {
        slug: "vaktetaten",
        summary: "Vaktetaten ivaretar sikkerhet og trivsel for frivillige og gjester på Kvarteret.",
        website: "https://kvarteret.no/vaktetaten/",
        body: [
            block(
                "Vaktetaten er Kvarterets ordensvakter og vektere. Hovedoppgaven er å ivareta sikkerheten og trivselen for både frivillige og gjester.",
            ),
            block(
                "Som vakt jobber du aldri alene. Det gjør Vaktetaten til en sammensveiset gruppe hvor du lett blir kjent med andre frivillige på huset under skift.",
            ),
            block(
                "I Vaktetaten får du kurs i konflikthåndtering, førstehjelp og brannsikkerhet. Det finnes også muligheter for å ta ordensvaktkurs og vekterkurs.",
            ),
            block(
                "Som vakt sørger du for at lover og regler overholdes, og du har ansvar for brannsikkerheten på huset. Under større konserter jobber gruppen også som scenevakter.",
            ),
            block(
                "Du trenger ingen tidligere erfaring for å prøve deg. Vaktetaten søker deg som er rolig, behersket, bestemt, rettferdig, ansvarsbevisst og sosial.",
            ),
            block("Tidsbruk", "h2"),
            block(
                "Som vakt jobber du tre skift i måneden, og du velger selv når det passer. Skiftene ligger primært på kveldstid torsdag, fredag og lørdag.",
            ),
        ],
    },
    {
        slug: "kraftetaten",
        summary:
            "Kraftetaten er Kvarterets lyd- og lysteknikere for konserter, teater, debatter og andre produksjoner.",
        website: "https://kvarteret.no/kraft/",
        body: [
            block(
                "Kraftetaten er Kvarterets lyd- og lysteknikere. Her styrer man teknikk på konserter, teaterforestillinger og debatter slik at arrangementene ser og høres best mulig ut.",
            ),
            block(
                "Som frivillig får du tilgang på en av byens kuleste utstyrsparker, inkludert streamingutstyr. Utstyret følger bransjestandard og brukes både til opplæring og gjennomføring.",
            ),
            block(
                "Du trenger ingen forkunnskaper for å bli med. Kraftetaten er et sted for å lære, oppleve og bygge nettverk, særlig hvis du er kreativ, praktisk anlagt og sulten på å lære.",
            ),
            block("Hva gjør en krafter?", "h2"),
            block(
                "Som krafter planlegger og styrer du teknikken på en av Bergens beste intimscener. I tillegg til konserter får du prøve deg på både store og små produksjoner, inkludert teater, debatter og TV-produksjoner.",
            ),
            block(
                "Kraftetaten har undergrupper for lyd og lys. Du kan kombinere dem, men det anbefales ofte å fokusere på én undergruppe det første semesteret.",
            ),
            block("Tidsbruk", "h2"),
            block(
                "Som frivillig i Kraftetaten jobber man minimum ett skift i uken. Hver mandag møtes gruppen til dugnad, vedlikehold, opplæring, kurs og sosialt fellesskap.",
            ),
        ],
    },
    {
        slug: "e-tjenesten",
        summary:
            "E-tjenesten drifter og videreutvikler Kvarterets nettsider, apper og interne systemer.",
        website: "https://kvarteret.no/e-tjenesten/",
        body: [
            block(
                "E-tjenesten er IT-gruppen til Det Akademiske Kvarter. Gruppen drifter og videreutvikler Kvarterets nettsider og interne databaser.",
            ),
            block(
                "Oppgavene er allsidige og gjelder både frontend, backend, app og interne verktøy. Gruppen er sosial, og du lærer av og sammen med andre.",
            ),
            block("Hvem trenger vi?", "h2"),
            block(
                "Vi trenger utviklere som vil skape og vedlikeholde digitale tjenester Kvarteret trenger for å fungere, og UX-designere som vil forme brukeropplevelser og visuelle rammer.",
            ),
            block("Forkunnskaper", "h2"),
            block(
                "Du trenger ikke nødvendigvis forkunnskaper hvis du er interessert i å lære. Erfaring med JavaScript, React, Angular, Flutter eller .NET gjør det likevel lettere å komme i gang.",
            ),
            block("Tidsbruk", "h2"),
            block(
                "Arbeidsmengden er fleksibel, men gruppen bruker ofte noen timer i uken på nettside og interne tjenester. Arbeidet skjer både på ukentlige dugnader og hjemmefra.",
            ),
        ],
    },
    {
        slug: "markedsgruppen",
        summary:
            "Markedsgruppen analyserer økonomi, marked og studentvaner som beslutningsgrunnlag for Kvarteret.",
        website: "https://kvarteret.no/marked/",
        body: [
            block(
                "Markedsgruppen er Kvarterets økonomiske rådgivere. Gruppen gjennomfører analyser og markedsundersøkelser som brukes som beslutningsgrunnlag i organisasjonen.",
            ),
            block(
                "Studenters utelivsvaner endrer seg, og Kvarteret må utforske nytt potensial fortløpende. Gruppen lager kostnadskalkyler, lønnsomhetsanalyser, investeringsanalyser og strategier i samarbeid med styret.",
            ),
            block(
                "Som frivillig får du frihet til å analysere tilgjengelige data og komme med anbefalinger som kan bedre lønnsomheten, samtidig som Kvarterets rolle som studentenes kulturhus ivaretas.",
            ),
            block("Tidsbruk", "h2"),
            block(
                "Arbeidet er prosjektbasert, og møtehyppigheten varierer. Oppgavene fordeles slik at engasjementet kan kombineres med studier eller jobb.",
            ),
        ],
    },
    {
        slug: "personalgruppen",
        summary:
            "Personalgruppen administrerer medlemsmassen, rekruttering, kurs og sosiale tiltak for frivillige.",
        website: "https://kvarteret.no/personalgruppen/",
        body: [
            block(
                "Personalgruppen har ansvar for å administrere og ivareta medlemsmassen som trengs for å drive Kvarteret.",
            ),
            block(
                "Gruppen står bak internfester, årsfester og andre felles begivenheter for frivillige på huset. De arrangerer også lavterskeltilbud, håndterer personalsaker, rekrutterer nye medlemmer og sørger for kursing og kompetanseoverføring.",
            ),
            block("Kvalifikasjoner", "h2"),
            block(
                "For å jobbe i Personalgruppen må du ha vært frivillig på Kvarteret eller i en av drifts- og brukerorganisasjonene i minst ett semester.",
            ),
        ],
    },
    {
        slug: "rettsvesenet",
        summary:
            "Rettsvesenet bistår Kvarteret med juridiske spørsmål, avtaler, innkjøp, investeringer og kontrakter.",
        website: "https://kvarteret.no/rettsvesenet/",
        body: [
            block(
                "Rettsvesenet er Kvarterets juridiske arbeidsgruppe. Hovedoppgaven er å bistå Kvarteret i juridiske spørsmål, blant annet avtaleinngåelse ved innkjøp, investeringer, bookinger og arbeidskontrakter.",
            ),
            block(
                "Kvarteret har en bred virksomhetsportefølje, og oppgavene varierer. Når Rettsvesenet får et oppdrag, settes det sammen en arbeidsgruppe for den aktuelle saken.",
            ),
            block(
                "Gruppen består som regel av minst ett erfarent medlem som veileder og leder arbeidet. Størrelsen varierer etter oppdragets art.",
            ),
            block("Opptak", "h2"),
            block(
                "Rettsvesenet har en egen opptaksprosess, og medlemmer rekrutteres direkte fra Det juridiske fakultet ved UiB. Det er et krav at søkerne har fullført første avdeling, siden arbeidet krever kjennskap til grunnleggende juridiske fag.",
            ),
        ],
    },
    {
        slug: "romvesenet",
        summary:
            "Romvesenet bygger, reparerer, maler og snekrer på huset for frivillige som allerede kjenner Kvarteret.",
        website: "https://kvarteret.no/romvesenet/",
        body: [
            block(
                "Romvesenet er gruppen med frivillige som bygger, reparerer, maler og snekrer. Kort sagt er dette gruppen som setter sitt preg på huset og gjør det bedre for alle.",
            ),
            block(
                "Romvesenet er for frivillige som allerede har vært aktive internt i minst ett semester. Opptak skjer internt blant engasjerte frivillige, slik at gruppen består av folk med praktisk erfaring fra huset.",
            ),
            block(
                "Hvis du er ny frivillig, starter du derfor i en av de andre gruppene. Etter hvert kan Romvesenet bli et naturlig neste steg når du har blitt kjent med huset og fått erfaring.",
            ),
        ],
    },
    {
        slug: "produksjonsgruppen",
        summary:
            "Produksjonsgruppen står for Kvarterets egne arrangementer, fra quiz og klubb til nye konsepter.",
        website: "https://kvarteret.no/produksjon/",
        body: [
            block(
                "Produksjonsgruppen står for Kvarterets eget arrangementstilbud. Her får du mulighet til å sette preg på programmet.",
            ),
            block(
                "Mye av kulturtilbudet på huset fylles av studentorganisasjoner, men det er også rom for arrangementer Kvarteret lager selv. Har du ideer til hva studentkulturhuset bør ha i kalenderen, er dette gruppen for deg.",
            ),
            block("Undergrupper", "h2"),
            block(
                "Produksjon er delt i Quizgruppen, Diskodepartementet og Arrangementsgruppen. Sammen lager de alt fra fast tirsdagsquiz og DJ-konsepter til klubb, konserter, loppemarked og musikkbingo.",
            ),
            block("Tidsbruk", "h2"),
            block(
                "Tidsbruken varierer med undergruppe, men man har stort sett ukentlige samlinger og jobber fysisk på arrangementene som skal avvikles.",
            ),
        ],
    },
    {
        slug: "pr-etaten",
        summary:
            "PR-etaten markedsfører Kvarteret og sørger for at studentene får med seg det som skjer.",
        email: "pr@kvarteret.no",
        website: "https://kvarteret.no/pr/",
        body: [
            block(
                "PR-etaten er Kvarterets markedsførere og sørger for at Kvarteret er synlig for studentene i Bergen.",
            ),
            block(
                "Gruppen trenger alltid nye hoder. Du trenger ingen forhåndskunnskaper for å være med, og får tilgang på fotoutstyr, verktøy og programvare som gjør det lett å jobbe praktisk med promotering.",
            ),
            block(
                "PR-etaten er delt i flere undergrupper som jobber litt ulikt fra uke til uke. Sammen drifter de Kvarterets kanaler og hjelper publikum med å holde seg oppdatert.",
            ),
            block("Undergrupper", "h2"),
            block(
                "Foto tar bilder av konserter og arrangementer. Grafisk produserer materiale til trykk, skjermer og sosiale medier. SoMe promoterer arrangementer, svarer publikum og utvikler kampanjer og innhold.",
            ),
        ],
    },
]

const groupsPageUpdate = {
    eyebrow: "Grupper på huset",
    title: "Grupper",
    description:
        "Bli kjent med arbeidsgruppene, komiteene og samarbeidspartnerne som fyller Kvarteret med arrangementer, servering, sikkerhet, teknikk og frivillig fellesskap.",
    sections: [
        {
            _key: "arbeidsgrupper",
            _type: "editorialSection",
            title: "Arbeidsgrupper og frivillighet",
            paragraphs: [
                "Arbeidsgruppene holder huset i gang i hverdagen. Her finner du alt fra bar, kjøkken, vakt og teknikk til IT, markedsføring, produksjon og personalarbeid.",
                "Noen grupper tar inn helt nye frivillige, mens andre passer best når du allerede har erfaring fra huset. Bruk gruppesidene til å finne ut hvor du vil starte.",
            ],
        },
        {
            _key: "samarbeidspartnere",
            _type: "editorialSection",
            title: "Komiteer og samarbeidspartnere",
            paragraphs: [
                "I tillegg til Kvarterets egne arbeidsgrupper har huset komiteer, driftsorganisasjoner og brukerorganisasjoner som arrangerer konserter, debatter, teater, film, quiz og andre studentkulturelle tilbud.",
            ],
        },
    ],
}

const pageSeoUpdates = {
    avbestillingsvilkar: {
        seoTitle: "Avbestillingsvilkår",
        seoDescription:
            "Les vilkårene for avbestilling av catering, rombooking og eksterne tjenester ved Det Akademiske Kvarter.",
    },
    catering: {
        seoTitle: "Catering på Kvarteret",
        seoDescription:
            "Se cateringmuligheter for møter, arrangementer og selskaper på Det Akademiske Kvarter.",
    },
    "krav-promo": {
        seoTitle: "Krav til promotering",
        seoDescription:
            "Praktiske krav og frister for promotering av arrangementer på Det Akademiske Kvarter.",
    },
    leievilkaar: {
        seoTitle: "Vilkår for leie av lokaler",
        seoDescription:
            "Vilkår for leie av rom og lokaler på Det Akademiske Kvarter, inkludert ansvar og praktiske rammer.",
    },
    "sporsmal-booking": {
        seoTitle: "Ofte stilte spørsmål om booking",
        seoDescription:
            "Svar på vanlige spørsmål om rombooking, catering og gjennomføring av arrangementer på Kvarteret.",
    },
    underholdningspakker: {
        seoTitle: "Underholdningspakker",
        seoDescription:
            "Se underholdningspakker og praktiske alternativer for arrangementer på Det Akademiske Kvarter.",
    },
    vergeordningen: {
        seoTitle: "Vergeordningen",
        seoDescription:
            "Informasjon om vergeordningen og adgang for yngre gjester ved arrangementer på Kvarteret.",
    },
}

const siteMetadataUpdate = {
    homeTitle: "Samfunnet i Bergen",
    homeDescription:
        "Studentenes kulturhus på Det Akademiske Kvarter, med arrangementer, barer, frivillighet og grupper for hele Bergens studentmiljø.",
    eventsTitle: "Arrangementer | Samfunnet i Bergen",
    eventsDescription:
        "Se kommende arrangementer på Det Akademiske Kvarter, fra konserter og debatter til quiz, klubb og studentkultur.",
}

async function patchMatchingDocuments(query, params, update) {
    const docs = await client.fetch(query, params, { perspective: "raw" })
    for (const doc of docs) {
        await client.patch(doc._id).set(update).commit({ autoGenerateArrayKeys: true })
        console.log(`Updated ${doc._id}`)
    }
}

try {
    for (const group of groupUpdates) {
        const { slug, ...update } = group
        await patchMatchingDocuments(
            `*[_type == "studentGroup" && slug.current == $slug]{_id}`,
            { slug },
            update,
        )
    }

    await patchMatchingDocuments(
        `*[_type == "groupsPage" && _id in ["groupsPage", "drafts.groupsPage"]]{_id}`,
        {},
        groupsPageUpdate,
    )

    for (const [slug, update] of Object.entries(pageSeoUpdates)) {
        await patchMatchingDocuments(
            `*[_type == "page" && slug.current == $slug]{_id}`,
            { slug },
            update,
        )
    }

    await patchMatchingDocuments(
        `*[_type == "siteMetadata" && _id in ["siteMetadata", "drafts.siteMetadata"]]{_id}`,
        {},
        siteMetadataUpdate,
    )
} catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown Sanity update error")
    process.exit(1)
}
