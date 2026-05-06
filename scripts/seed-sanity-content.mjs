import { getCliClient } from "sanity/cli"

const client = getCliClient({ apiVersion: "2024-01-01" })

const homePage = {
    _id: "homePage",
    _type: "homePage",
    badgeNb: "Samfunnet / Det Akademiske Kvarter",
    badgeEn: "Samfunnet / Det Akademiske Kvarter",
    heroDescriptionNb:
        "Studentersamfunnet i Bergen er studenthuset i Bergen og er et av Norges mest aktive kulturhus. Hvert år arrangeres det over 1500 arrangementer og alt blir driftet av frivillige studenter. Vi har tre barer som alle er frivilligdrevet samt utallige grupper for å dekke alle studenters behov. Samfunnet er et samlingssted for alle Bergens studenter om det er for morgenkaffen eller kveldsfesting!",
    heroDescriptionEn:
        "Studentersamfunnet i Bergen is the student house in Bergen and one of Norway's most active cultural venues. Every year, more than 1,500 events are arranged, all run by volunteer students. We have three bars that are entirely volunteer-operated, as well as countless groups that cover students' different interests and needs. Samfunnet is a meeting place for students across Bergen, whether it is for morning coffee or a late night out.",
    heroDescriptionFusionNb:
        "Samfunnet er en fusjon av Kvarteret og Samfunnet i Bergen. Vi holder til på samme plass som alltid, i det samme bygget kalt Det Akademiske Kvarter. Som student i Bergen er det å bli frivillig på Samfunnet en fantastisk måte å sette ditt preg på studentlivet.",
    heroDescriptionFusionEn:
        "Samfunnet is a merger of Kvarteret and Samfunnet i Bergen. We are still in the same place as always, in the same building called Det Akademiske Kvarter. As a student in Bergen, becoming a volunteer at Samfunnet is a fantastic way to leave your mark on student life.",
    eventsLinkNb: "Se arrangementer",
    eventsLinkEn: "See events",
}

const siteMetadata = {
    _id: "siteMetadata",
    _type: "siteMetadata",
    siteTitleNb: "Samfunnet i Bergen",
    siteTitleEn: "Samfunnet i Bergen",
    siteDescriptionNb: "Studentenes kulturhus i Bergen.",
    siteDescriptionEn: "The students' cultural house in Bergen.",
    homeTitleNb: "Bli frivillig | Samfunnet / Det Akademiske Kvarter",
    homeTitleEn: "Become a volunteer | Samfunnet / Det Akademiske Kvarter",
    homeDescriptionNb:
        "Meld interesse for Skjenkegruppen, Kraft eller Vaktetaten og kom i gang med prøvedugnad.",
    homeDescriptionEn:
        "Register your interest for Skjenkegruppen, Kraft or Vaktetaten and get started with a trial shift.",
    eventsTitleNb: "Arrangementer | Samfunnet / Det Akademiske Kvarter",
    eventsTitleEn: "Events | Samfunnet / Det Akademiske Kvarter",
    eventsDescriptionNb:
        "Se kommende arrangementer på Det Akademiske Kvarter, gruppert etter programtype.",
    eventsDescriptionEn:
        "See upcoming events at Det Akademiske Kvarter, grouped by programme type.",
    volunteerSignupTitleNb: "Bli frivillig | Oversikt over grupper",
    volunteerSignupTitleEn: "Become a volunteer | Group overview",
    volunteerSignupDescriptionNb: "Se gruppene på huset og meld interesse som frivillig.",
    volunteerSignupDescriptionEn:
        "Explore the groups in the house and register your interest as a volunteer.",
    groupPageTitleNb: "{group} | Bli frivillig",
    groupPageTitleEn: "{group} | Become a volunteer",
    groupPageDescriptionNb: "Les mer om {group} og velg gruppen i frivilligskjemaet.",
    groupPageDescriptionEn: "Learn more about {group} and choose the group in the volunteer form.",
}

const eventsPage = {
    _id: "eventsPage",
    _type: "eventsPage",
    eyebrowNb: "Program",
    eyebrowEn: "Programme",
    titleNb: "Arrangementer",
    titleEn: "Events",
    descriptionNb:
        "Kommende åpne arrangementer på Det Akademiske Kvarter, hentet direkte fra programdatabasen og sortert etter programkategori.",
    descriptionEn:
        "Upcoming public events at Det Akademiske Kvarter, fetched directly from the programme database and grouped by programme category.",
}

const keyed = (prefix, items) =>
    items.map((item, index) => ({ _key: `${prefix}-${index + 1}`, ...item }))

const link = (label, url) => ({ label, url })

const section = (prefix, title, paragraphs, links = []) => ({
    _key: prefix,
    _type: "editorialSection",
    title,
    paragraphs,
    links: keyed(`${prefix}-link`, links),
})

const image = (prefix, sourceUrl, alt, caption) => ({
    _key: prefix,
    _type: "sourcedImage",
    sourceUrl,
    alt,
    ...(caption ? { caption } : {}),
})

const assetUrl = id => `https://cms.kvarteret.no/assets/${id}?width=1600&quality=75`

const roomsPage = {
    _id: "roomsPage",
    _type: "roomsPage",
    eyebrow: "Rombooking",
    title: "Rom",
    description:
        "Se rommene på Det Akademiske Kvarter. Kortformen viser kapasitet og hva rommet passer til, mens romsidene samler detaljene fra Kvarterets bookinginformasjon.",
    sections: [
        section("rooms-how-to-book", "Hvordan booke et rom", [
            "Du må selv legge inn en forespørsel i vårt bookingsystem som deretter behandles av romkoordinator. Bookingen er først gyldig når du får godkjenning på mail.",
            "Detaljene om arrangementet må fylles ut så nøyaktig og fullstendig som mulig i booking-skjemaet. Det er viktig å inkludere hvilke fasiliteter du trenger.",
            "Bookingforespørsler for vårsemesteret behandles fom. 01/12. Høstsemesterets bookinger behandles fom. 01/06.",
        ]),
        section(
            "rooms-food-drinks-entertainment",
            "Mat, drikke og underholdning?",
            [
                "Kvarterets eget kjøkken skreddersyr gjerne en meny for diett, allergén, budsjett og ønske til både store og små tilstelninger. Legg ved litt info om hva du ønsker i bookingforespørselen din, så tar vi kontakt.",
                "Vi leier også ut underholdningspakker som karaoke og silent disco eller hjelper deg med å sette opp drømmekonserten.",
            ],
            [
                link("Les mer om catering", "https://kvarteret.no/catering/"),
                link("Underholdningspakker", "http://www.kvarteret.no/underholdningspakker"),
            ],
        ),
        section("rooms-opening-hours", "Tider du kan leie rom", [
            "Mandag til onsdag: 13:00-01:30",
            "Torsdag og fredag: 13:00-03:00",
            "Lørdag: 13:30-03:00",
            "Søndag: 16:00-22:00",
        ]),
        section(
            "rooms-faq-info",
            "FAQ & info",
            [
                "Gjør deg først kjent med våre avbestillingsvilkår.",
                "Gjør deg kjent med våre vilkår for leie av rom.",
            ],
            [
                link("Spørsmål om booking", "https://kvarteret.no/sporsmal-booking"),
                link("Vergeordningen", "https://kvarteret.no/vergeordningen/"),
                link("Krav til promo", "https://kvarteret.no/krav-promo/"),
                link(
                    "Tekniske spesifikasjoner",
                    "https://drive.google.com/drive/folders/16iF0CqfuUTknpzlhxRCnjmjdVR3Gtz78",
                ),
                link("Avbestillingsvilkår", "https://kvarteret.no/avbestillingsvilkar"),
                link("Vilkår for leie av rom", "https://kvarteret.no/leievilkaar"),
            ],
        ),
    ],
    bookingLink: link(
        "Book rom her",
        "https://app.crescat.io/venue-access/studentersamfunnet-i-bergen-bookingkalender",
    ),
}

const rooms = [
    {
        _id: "room-teglverket",
        _type: "room",
        order: 1,
        title: "Teglverket",
        slug: { _type: "slug", current: "teglverket" },
        summary:
            "Teglverket er vår største konsertsal, og er en av de beste intimscenene i landet.",
        capacity: "450 pers",
        suitedPurposes: ["konsert", "klubb", "fest", "revy", "standup", "konferanse", "messe"],
        floor: "1",
        sections: [
            section("teglverket-about", "Beskrivelse", [
                "Teglverket er vår største konsertsal, og er en av de beste intimscenene i landet. Rommet passer perfekt til alt fra debatter og møter til konserter og fester.",
            ]),
        ],
        images: [
            image(
                "teglverket-image-1",
                assetUrl("ca4b1135-9f8e-4c83-b35e-86edaace3989"),
                "Teglverket",
            ),
        ],
        sourceUrl: "https://kvarteret.no/teglverket/",
    },
    {
        _id: "room-tivoli",
        _type: "room",
        order: 2,
        title: "Tivoli",
        slug: { _type: "slug", current: "tivoli" },
        summary: "Tivoli er en black box og et av husets mest funksjonelle rom.",
        capacity: "Varierer etter oppsett",
        suitedPurposes: ["kino", "klubbarrangement", "teater", "konsert", "debatt"],
        floor: "1",
        sections: [
            section("tivoli-about", "Beskrivelse", [
                "Tivoli er vår black box, noe som gjør det til vårt mest funksjonelle rom.",
                "Det egner seg både til kino, klubbarrrangementer, teater, konserter, debatter og alt annet du måtte tenke deg.",
                "Salen er utstyrt med et amfi du kan gjemme helt bort om du ikke trenger det.",
            ]),
        ],
        images: [
            image("tivoli-image-1", assetUrl("54e1a425-8dd3-4648-aa18-d647cf669bca"), "Tivoli"),
            image("tivoli-image-2", assetUrl("110cf357-9d4e-41b0-95c7-40daed9b8fed"), "Tivoli"),
        ],
        sourceUrl: "https://kvarteret.no/tivoli/",
    },
    {
        _id: "room-storelogen",
        _type: "room",
        order: 3,
        title: "Storelogen",
        slug: { _type: "slug", current: "storelogen" },
        summary: "Storelogen er vår sal på toppen av bygget, med høyt tak og greit med plass.",
        capacity: "Stående: 245. Sittende u/bord: 100. Sittende m/bord: 40-70",
        suitedPurposes: ["jazzkonsert", "revy", "åpen scene", "debatt", "lukket fest"],
        floor: "3",
        sections: [
            section("storelogen-capacity", "Kapasitet", [
                "Kapasitet kan variere basert på type arrangement.",
                "Stående: 245.",
                "Sittende u/bord: 100.",
                "Sittende m/bord: 40-70 basert på bordoppsett.",
                "Kontakt booking@kvarteret.no for mer informasjon.",
            ]),
            section(
                "storelogen-about",
                "Beskrivelse",
                [
                    "Storelogen er vår sal på toppen av bygget, med høyt tak og greit med plass.",
                    "Her arrangeres det en rekke jazzkonserter, revyer, åpen scene-arrangementer, debatter og lignende. Det er også et bra lokale for lukkede fester, da det er litt avskjermet fra omgivelsene.",
                    "Storelogen vil ha 20-års aldersgrense på kveldstid torsdag, fredag og lørdag grunnet den umiddelbare nærheten til Halvtimen.",
                ],
                [
                    link(
                        "Se forslag til bord- og stoloppsett",
                        "https://drive.google.com/drive/folders/1M4GVW-hXvlL2mAYOMWcofVNFIcKT8JRj?usp=sharing",
                    ),
                ],
            ),
        ],
        images: [
            image(
                "storelogen-image-1",
                assetUrl("fd7f56b8-5d64-4896-aae6-532449dfdd96"),
                "Storelogen",
            ),
            image(
                "storelogen-image-2",
                assetUrl("f2af3f69-4781-4b07-990d-5868ae345e4a"),
                "Storelogen",
            ),
        ],
        sourceUrl: "https://kvarteret.no/storelogen/",
    },
    {
        _id: "room-speilsalen",
        _type: "room",
        order: 4,
        title: "Speilsalen",
        slug: { _type: "slug", current: "speilsalen" },
        summary: "Speilsalen passer til de fleste arrangement.",
        capacity: "Varierer etter arrangement",
        suitedPurposes: ["møte", "fest", "debatt", "foredrag", "konsert"],
        floor: "2",
        sections: [
            section("speilsalen-capacity", "Kapasitet", [
                "Kapasitet kan variere basert på type arrangement, kontakt booking@kvarteret.no for mer informasjon.",
            ]),
            section(
                "speilsalen-about",
                "Beskrivelse",
                [
                    "Speilsalen passer til de fleste arrangement - møter, fester, mindre debatter og foredrag, eller konserter.",
                    "Det er et multifunksjonelt rom med frisk interiørdesign og god belysning.",
                ],
                [
                    link(
                        "Se forslag til bord- og stoloppsett",
                        "https://drive.google.com/drive/folders/1ofZ3W16EJ6piqN7LcMsWWXHasj5slwmf?usp=sharing",
                    ),
                ],
            ),
        ],
        images: [
            image(
                "speilsalen-image-1",
                assetUrl("9de3e975-54a5-4e7a-93fb-cea2554c9223"),
                "Speilsalen",
            ),
            image(
                "speilsalen-image-2",
                assetUrl("9e6457a8-cb17-4341-ad3b-57294611a0bd"),
                "Speilsalen",
            ),
        ],
        sourceUrl: "https://kvarteret.no/speilsalen/",
    },
    {
        _id: "room-maos",
        _type: "room",
        order: 5,
        title: "Maos lille røde",
        slug: { _type: "slug", current: "maos" },
        summary: "Maos er et lite forsamlingslokale i 2. etasje med fast prosjektor og lerret.",
        capacity: "Stående: 75. Sittende u/bord: 50. Sittende m/bord: 35-40",
        suitedPurposes: ["møte", "filmvisning", "karaoke", "akustisk konsert"],
        floor: "2",
        sections: [
            section(
                "maos-about",
                "Beskrivelse",
                [
                    "Maos er et lite forsamlingslokale i 2. etasje med fast prosjektor og lerret. Rommet passer til de fleste mindre formål - om det skulle være møte, filmvisning, karaoke eller akustiske konserter.",
                    "Rommet har ikke egen bar.",
                ],
                [
                    link(
                        "Se forslag til bord- og stoloppsett",
                        "https://drive.google.com/drive/folders/1jYS88DgHn1og0_Hqs-OCpJ3-O28kQwUN?usp=sharing",
                    ),
                ],
            ),
            section("maos-capacity", "Kapasitet", [
                "Kapasitet kan variere basert på type arrangement.",
                "Stående: 75",
                "Sittende u/bord: 50",
                "Sittende m/bord: 35-40 basert på bordoppsett.",
                "Kontakt booking@kvarteret.no for mer informasjon.",
            ]),
        ],
        images: [
            image(
                "maos-image-1",
                assetUrl("4b553cd6-3a47-4189-adb4-ad8dd4d60321"),
                "Maos lille røde",
            ),
            image(
                "maos-image-2",
                assetUrl("070c84dc-9699-4f51-9aca-d66950c88508"),
                "Maos lille røde",
            ),
            image(
                "maos-image-3",
                assetUrl("dac37480-c756-4a4f-b8a9-c1543979208d"),
                "Maos lille røde",
            ),
            image(
                "maos-image-4",
                assetUrl("c501e7ff-95cb-4d42-aeb0-9323aabfa154"),
                "Maos lille røde",
            ),
        ],
        sourceUrl: "https://kvarteret.no/maos/",
    },
    {
        _id: "room-stillhet",
        _type: "room",
        order: 6,
        title: "Stillhet",
        slug: { _type: "slug", current: "stillhet" },
        summary: "Stillhet fungerer som både møtelokale og backstage.",
        capacity: "Mindre møter",
        suitedPurposes: ["møte", "backstage"],
        floor: "3",
        sections: [
            section("stillhet-about", "Beskrivelse", [
                "Stillhet fungerer som både møtelokale og backstage. Dette vil si at møblementet består både av sofaer og konferansebord.",
                "Godt belyst, men relativt bortgjemt, så det egner seg ikke i like stor grad til publikumsarrangementer.",
            ]),
        ],
        images: [
            image("stillhet-image-1", assetUrl("e57c4d3b-714b-4b65-bfa7-78c6ec0a5464"), "Stillhet"),
        ],
        sourceUrl: "https://kvarteret.no/stillhet/",
    },
    {
        _id: "room-stoy",
        _type: "room",
        order: 7,
        title: "Støy",
        slug: { _type: "slug", current: "stoy" },
        summary: "Støy er et lite forsamlingslokale i 3. etasje.",
        capacity: "Mindre møter og sosiale arrangement",
        suitedPurposes: ["møte", "sosialt arrangement", "øving", "teater", "sang"],
        floor: "3",
        sections: [
            section("stoy-about", "Beskrivelse", [
                "Støy er et lite forsamlingslokale i 3. etasje, som passer bra til all typer mindre møter og sosiale arrangement.",
                "Rommet har i tillegg blitt brukt til øving av både teater, sang og lignende. Rommet har en liten bar som kan brukes om det skulle være behov for det.",
            ]),
        ],
        images: [image("stoy-image-1", assetUrl("afd85b95-dd92-41ff-8a43-b3f8b6226e18"), "Støy")],
        sourceUrl: "https://kvarteret.no/stoy/",
    },
    {
        _id: "room-grondahls",
        _type: "room",
        order: 8,
        title: "Grøndahls",
        slug: { _type: "slug", current: "grondahls" },
        summary: "Grøndahls er Kvarterets pub, med et stort utvalg.",
        capacity: "Vanligvis ikke utleid til lukkede arrangementer i åpningstiden",
        suitedPurposes: ["gratisarrangement", "uformell samling"],
        floor: "1",
        sections: [
            section(
                "grondahls-about",
                "Beskrivelse",
                [
                    "Kvarterets pub, med et stort utvalg.",
                    "I utgangspunktet leier vi ikke ut dette rommet til lukkede arrangementer i åpningstiden, men enkelte gratisarrangementer kunne absolutt være interessant, så det er lov til å si ifra om en er interessert i å arrangere ting her.",
                ],
                [
                    link(
                        "Se forslag til bord- og stoloppsett",
                        "https://drive.google.com/drive/folders/1WSSg88CSH0ZFsFt2yE-QiTIUX92C4r76?usp=sharing",
                    ),
                ],
            ),
        ],
        images: [
            image(
                "grondahls-image-1",
                assetUrl("bcf56a5a-3928-4eb2-8e5c-c9c663d33251"),
                "Grøndahls",
            ),
        ],
        sourceUrl: "https://kvarteret.no/grondahls/",
    },
    {
        _id: "room-halvtimen",
        _type: "room",
        order: 9,
        title: "Halvtimen",
        slug: { _type: "slug", current: "halvtimen" },
        summary: "Halvtimen er cocktailbaren i 3. etasje.",
        capacity: "120 pers",
        suitedPurposes: ["fest", "foredrag", "debatt", "seminar", "workshop", "møte", "mottakelse"],
        floor: "3",
        sections: [
            section("halvtimen-about", "Beskrivelse", [
                "Cocktailbaren Halvtimen er åpen hver fredag og lørdag fra klokken 22:30 til 03:30, og har 20-årsgrense.",
                "På hverdager kan rommet brukes til mer uformelle møter og samlinger, men man må da være klar over at Halvtimen også er et gangareale, og at det derfor kan hende at folk må gå gjennom for å komme seg til andre rom.",
            ]),
        ],
        images: [
            image(
                "halvtimen-image-1",
                assetUrl("bdaebad9-98cc-409c-947f-d464ee4ed841"),
                "Halvtimen",
            ),
        ],
        sourceUrl: "https://kvarteret.no/halvtimen/",
    },
    {
        _id: "room-stjernesalen",
        _type: "room",
        order: 10,
        title: "Stjernesalen",
        slug: { _type: "slug", current: "stjernesalen" },
        summary:
            "Stjernesalen er vår kafé, restaurant og bar i 2. etasje, med inngang på baksiden av bygget.",
        capacity: "102 sitteplasser",
        suitedPurposes: [
            "kafé",
            "restaurant",
            "bar",
            "quiz",
            "brettspill",
            "åpent gratisarrangement",
        ],
        floor: "2",
        sections: [
            section("stjernesalen-about", "Beskrivelse", [
                "Foto: Eivind Senneset - UIB",
                "Stjernesalen er vår fantastiske kafé, restaurant og bar i 2. etasje, med inngang på baksiden av bygget.",
                "Fra 12:00 til 21:00 kan vi friste med et smakfullt og rimelig mattilbud, i tillegg til salg av kald og varm drikke helt til stengetid. Alt dette nytes i omgivelser med herlig atmosfære.",
                "Kjøkkenet er åpent fra 14.00-19.00.",
                "Rommet har 102 sitteplasser, og er tilrettelagt for at både store og små grupper skal kunne finne seg til rette. På mandager og onsdager kan du komme hit for å spille brettspill, og på tirsdager holder vi vår populære quiz.",
                "Vi booker normalt ikke vekk rommet til arrangementer, men om du ønsker å få til et åpent gratisarrangement som passer inn her, må du ikke nøle med å ta kontakt!",
            ]),
            section("stjernesalen-menu", "Meny", [
                "Stjernesalen har et bredt utvalg av mat og drikke. Vi har tilpasset menyen vår slik at du med allergener eller den som ønsker å prøve pingvinpoteter har det du trenger i vår kafe.",
            ]),
        ],
        images: [
            image(
                "stjernesalen-image-1",
                assetUrl("7aafdc26-5a3f-4049-9f7c-e4114f7eb9c6"),
                "Stjernesalen",
            ),
            image(
                "stjernesalen-image-2",
                assetUrl("9c8fd062-b86c-4458-a342-12222750a169"),
                "Stjernesalen",
            ),
            image(
                "stjernesalen-image-3",
                assetUrl("1c52b581-ba9a-49e2-93b2-c364178a3a46"),
                "Stjernesalen",
            ),
            image(
                "stjernesalen-image-4",
                assetUrl("65019c78-3bfa-4638-ba84-1cc115f0be18"),
                "Stjernesalen",
            ),
        ],
        sourceUrl: "https://kvarteret.no/stjernesalen/",
    },
]

const groupsPage = {
    _id: "groupsPage",
    _type: "groupsPage",
    eyebrow: "Bli kjent med oss",
    title: "Grupper",
    description:
        "Studentersamfunnet drives av frivillige grupper og komiteer. Her finner du kort informasjon om hva gruppene gjør og hvem du kan kontakte.",
    sections: [
        section("groups-intro", "Om komiteene og gruppene", [
            "Huset drives av frivillige som lager arrangementer, holder barer og kjøkken i gang, passer på teknikk og sikkerhet, og bygger organisasjonen rundt alt som skjer på Kvarteret.",
        ]),
    ],
    faq: keyed("groups-faq", [
        {
            _type: "faqItem",
            question: "Hva kreves for å være med i Studentersamfunnet?",
            answer: [
                "Man må være student eller ha tilknytning til studentmiljøet i Bergen. Det viktigste er at du har lyst til å bidra og være en del av fellesskapet.",
            ],
        },
        {
            _type: "faqItem",
            question: "Hvor mye tid bruker man på å være med i Samfunnet?",
            answer: [
                "Det varierer mellom gruppene, men de fleste har et fast komitémøte i uken i tillegg til arrangementer eller vakter.",
            ],
        },
        {
            _type: "faqItem",
            question: "Kan man være med i Samfunnet ett enkelt semester?",
            answer: [
                "Ja. Det er mulig å være med i ett semester, men mange velger å bli lenger fordi miljøet er sosialt og arbeidsoppgavene utvikler seg over tid.",
            ],
        },
        {
            _type: "faqItem",
            question: "Hvilke goder får man av å være med i Samfunnet?",
            answer: [
                "Som frivillig får du erfaring, opplæring, et sosialt miljø og mulighet til å være med på interne arrangementer.",
            ],
        },
        {
            _type: "faqItem",
            question: "Hvor mye koster det å være med i Samfunnet?",
            answer: ["Det koster ingenting å være frivillig i Studentersamfunnet."],
        },
    ]),
}

const studentGroups = [
    {
        _id: "studentGroup-skjenkegruppen",
        _type: "studentGroup",
        order: 1,
        name: "Skjenkegruppen",
        slug: { _type: "slug", current: "skjenkegruppen" },
        summary: "Skjenkegruppen er Kvarterets kokker, servitører og bartendere.",
        body: [
            "Skjenkegruppen (Skjenke) er Kvarterets kokker, servitører og bartendere. Naturlig nok drifter disse menneskene Kvarterets faste barer, i tillegg til kjøkkenet.",
            "Dette er den største arbeidsgruppen på Kvarteret og derfor et sted hvor man kan bli kjent med mange nye mennesker både på jobb og gjennom de ulike sosiale arrangementene.",
            "Du trenger ingen forhåndskunnskaper for å lykkes i Skjenke - selv på kjøkkenet får du all opplæringen du trenger! Skjenkegruppen har fire undergrupper.",
            "I Skjenke jobber man 1 skift i uka i nesten alle undergruppene. Skiftene fordeler seg på tidsrommene 12:00 - 01:00 i hverdager og til 04.00 i helgedager. Unntaket er Halvtimen som bare er åpen i helgedager. Her jobber man 3 skift i måneden.",
            "Er du nysgjerrig på hvordan det er å jobbe som frivillig på Kvarteret? Ta kontakt for å bli med på et uforpliktende prøveskift - her får du kjenne på stemningen, teste ut oppgavene og møte det fantastiske teamet vårt.",
            "De fleste som prøver, blir raskt hekta. Før du vet ordet av det, er du en fullverdig frivillig som både lærer masse, får nye venner og blir en viktig del av Kvarteret - og alt dette mens du har det skikkelig gøy!",
            "Stjernesalen er vår kafé hvor det serveres deilig mat, kaffe og kaker. Som del av betjeningen i Stjernesalen lærer du et og annet om både baristakunst, mocktailoppskrifter og vinutvalg.",
            "Som kokk på Kvarterets eget kjøkken blir du en del av et kreativt og sosialt matmiljø midt i hjertet av studentkulturen. Her får du ikke bare tilberede spennende retter til husets gjester, men også delta i gjennomføring av større cateringoppdrag til arrangementer, fester og konserter på huset.",
            "I Halvtimen må du være fylt 20 år for å være frivillig. Dette er Kvarterets egne drinkbar, og passer dermed for cocktailentusiasten. Her får du prøve deg som den type bartender som disker opp med pene farger og deilige smaker til folket.",
            "Kvarterets pub har et stort sortiment og passer godt for ølnerden som ikke er redd for litt tempo. Dette er også vannhullet for de aller fleste frivillige, perfekt for å slå seg ned med andre mennesker etter et skift.",
        ],
        email: "sjenke.leder@kvarteret.no",
        category: "arbeidsgruppe",
        sourceUrl: "https://kvarteret.no/skjenkegruppen/",
        sourceNote: "Arbeidsgruppe fra Kvarteret.",
    },
    {
        _id: "studentGroup-kraftetaten",
        _type: "studentGroup",
        order: 2,
        name: "Kraftetaten",
        slug: { _type: "slug", current: "kraftetaten" },
        summary: "Kraftetaten er Kvarterets lyd- og lysteknikere.",
        body: [
            "Kraftetaten (Kraft) er Kvarterets lyd- og lysteknikere. Her styrer man teknikk på både konserter, teaterforestillinger og debatter - alle som selvsagt skal se og høres best mulig ut.",
            "Som frivillig i Kraftetaten får man tilgang på en av byens kuleste utstyrsparker - inkludert streamingutstyr. Utstyret møter bransjestandarden rund om i landet og kommer godt med når man skal lære.",
            "Som frivillig i Kraftetaten trenger man ingen forkunnskaper. Kraftetaten er et sted for å lære, oppleve og bygge nettverk. Er du kreativ, utadvendt og sulten på å lære er dette stedet for deg.",
            "Som Krafter får du være med å planlegge og selv styre teknikken på en av Bergens beste intimscener. Her får vi titt og ofte besøk av noen av de beste teknikerne i bransjen, noe som gir unike muligheter for nettverksbygging og nye triks i repertoaret ditt.",
            "Foruten konserter får man prøve seg på både store og mindre produksjoner av variert art, eksempelvis TV-produksjoner. Det Akademiske Kvarter har 11 bruksrom hvor minst 4 av dem er egnet for store arrangementer.",
            "Kraftetaten har to undergrupper: lyd og lys. Her kan man kombinere som man selv vil, men det er anbefalt at man fokuserer på én av undergruppene det første semesteret man er med.",
            "Som frivillig i Kraftetaten jobber man minimum et skift i uka. Hver mandag treffes man for dugnad klokken 18:00-21:00. Her jobber man med vedlikehold av utstyr, driver opplæring, deltar på kurs og finner på noe sosialt sammen.",
        ],
        email: "kraft.leder@kvarteret.no",
        category: "arbeidsgruppe",
        sourceUrl: "https://kvarteret.no/kraft/",
        sourceNote: "Arbeidsgruppe fra Kvarteret.",
    },
    {
        _id: "studentGroup-vaktetaten",
        _type: "studentGroup",
        order: 3,
        name: "Vaktetaten",
        slug: { _type: "slug", current: "vaktetaten" },
        summary: "Vaktetaten ivaretar sikkerheten og trivselen for frivillige og gjester.",
        body: [
            "Vaktetaten (Vakt) er Kvarterets ordensvakter og vektere. Vakt har i hovedoppgave å ivareta sikkerheten og trivsel for alle våre frivillige og gjester.",
            "Som vakt jobber man aldri alene. Det gjør Vaktetaten til en veldig sammensveiset gjeng, hvor man dessuten lett blir kjent med andre frivillige på huset under skift.",
            "I Vaktetaten får du kurs i konflikthåndtering, førstehjelp og brannsikkerhet. Det finnes også muligheter for å ta ordensvaktkurs og vekterkurs gjennom Vaktetaten.",
            "Som vakt sørger man for at lover og regler overholdes, i tillegg til å ha ansvar for brannsikkerheten på huset. Under større konserter jobber vi også som scenevakter; da passer man på både band og publikum når stemningen er høy.",
            "Du trenger ingen tidligere erfaring for å prøve deg i vakt. Vaktetaten søker deg som er rolig og behersket, bestemt og rettferdig, ansvarsbevisst og sosial.",
            "Som vakt jobber du 3 skift i måneden, og du velger selv når det passer. Primært er skiftene i tidsrommene 20.45 - 01.00 torsdager og 20.45 - 03.00 fredager og lørdager.",
        ],
        email: "vakt.leder@kvarteret.no",
        category: "arbeidsgruppe",
        sourceUrl: "https://kvarteret.no/vaktetaten/",
        sourceNote: "Arbeidsgruppe fra Kvarteret.",
    },
    {
        _id: "studentGroup-e-tjenesten",
        _type: "studentGroup",
        order: 4,
        name: "E-tjenesten",
        slug: { _type: "slug", current: "e-tjenesten" },
        summary: "E-tjenesten er IT-gruppen vår og har ansvar for nettsiden og databaser.",
        body: [
            "E-tjenesten er IT-gruppen til Det Akademiske Kvarter. Gruppen drifter og videreutvikler Kvarterets nettsider og interne databaser.",
            "Oppgavene er allsidige og gjelder både frontend og backend. IT-gruppen er en sosial gjeng hvor du lett lærer av og sammen med andre. Her kan du jobbe med rammeverkt som Astro.js, Flutter, .net 8, React, Angular og hva enn andre rammeverk du kan selv.",
            "Det er hovedsakelig to typer frivillige vi trenger: utviklere som ønsker å skape og vedlikeholde ulike digitale tjenester som Kvarteret trenger for å fungere, og UX-designere som ønsker å skape design av nettsiden, brukeropplevelser og gi frontend-utviklerne en ramme å gå etter.",
            "I utgangspunktet trenger en ikke forkunnskaper for å bli med, så lenge en er interessert i å lære mer frontend-utvikling, spesielt Astro.js. Men det er anbefalt at du har erfaring med javascript, ettersom det blir lettere å sette seg inn i koden fra starten av.",
            "Vi er veldig fleksible når det gjelder arbeidsmengde i uken, men vi har en tendens til å bruke rundt 3-6 timer i uken på å jobbe med nettsiden. Det skjer som regel gjennom ukentlige dugnader, hvor vi møtes på Kvarteret for å kode sammen, men det kan også gjøres hjemmefra.",
            "Om du blir medlem i E-tjenesten, får du tilgang på intern-priser på mat og drikke hos Det Akademiske Kvarter. I tillegg blir du invitert til intern-fester, middager og sosiale kvelder.",
        ],
        email: "it.leder@kvarteret.no",
        category: "arbeidsgruppe",
        sourceUrl: "https://kvarteret.no/e-tjenesten/",
        sourceNote: "Arbeidsgruppe fra Kvarteret.",
    },
    {
        _id: "studentGroup-quiz-gruppen",
        _type: "studentGroup",
        order: 5,
        name: "Quiz-gruppen",
        slug: { _type: "slug", current: "quiz-gruppen" },
        summary: "Quiz-gruppen arrangerer quiz i Stjernesalen på huset.",
        body: [
            "Hver tirsdag kl. 19 arrangerer Quiz-gruppen quiz i Stjernesalen på huset. Dette er en gruppe for deg som har mange morsomme fakta på lur!",
        ],
        email: "produksjon.quiz@kvarteret.no",
        category: "arbeidsgruppe",
        sourceNote: "Fra Hvem er vi_.md.",
    },
    {
        _id: "studentGroup-hello",
        _type: "studentGroup",
        order: 6,
        name: "Hello",
        slug: { _type: "slug", current: "hello" },
        summary:
            "Hello danner et sosialt og inkluderende miljø for nye studenter, utvekslingsstudenter og unge immigranter.",
        body: [
            "Hello har som mål å danne et sosialt og inkluderende miljø for nye studenter, utvekslingsstudenter og unge immigranter.",
            "Komiteen arrangerer ulike sosiale møtepunkter som hjelper folk med å bli kjent med hverandre og senker terskelen for deltakelse. Arrangementene er koselig, sosialt og gratis!",
        ],
        email: "hello.samfunnet@gmail.com",
        category: "komitee",
        sourceNote: "Fra Hvem er vi_.md.",
    },
    {
        _id: "studentGroup-aktuelt",
        _type: "studentGroup",
        order: 7,
        name: "Aktuelt",
        slug: { _type: "slug", current: "aktuelt" },
        summary:
            "Aktuelt ser på det gjeldende nyhetsbildet og serverer innsikt til gratis frokost og kaffe.",
        body: [
            "Aktuelt er komiteen som ser på det gjeldende nyhetsbildet. Her får du innsikten du savner i sakene du burde visst mer om, servert til gratis frokost og kaffe.",
            "Denne gruppen morgenfugler disker opp med spennende panelsamtaler om det som rører seg i nyhetsbildet. Deres mantra er å forstå hva som preger aktuelle hendelser og se på den større sammenhengen de spiller inn i.",
            "Temaene for Aktuelt sine frokostmøter bestemmes fortløpende for å sikre at tematikken er aktuell. Aktuelt tar også ved jevne mellomrom på seg oppdraget med å aktualisere temaer som burde nådd ut til massene.",
            "Foruten det nyhetsbildet tvinger frem av samtaler har Aktuelt flere faste samarbeid. Særlig sterkt er samarbeidet med Raftostiftelsen i forbindelse med utdelingen av Raftoprisen hver høst.",
            "Komiteen har også videreført det kjente nyhetsfrokostkonseptet Frokost med Frank. Omdøpt til Frokost med Lise er det nå statsviteren og professoren Lise Rakner som har overtatt stafettpinnen.",
            "Arrangementer: Tirsdager kl 08.30-09.30.",
        ],
        email: "aktuelt@samfunnetibergen.no",
        category: "komitee",
        image: image(
            "aktuelt-image",
            "https://cdn.prod.website-files.com/62d7a1e8316da31eea2c3c9c/63c025587bdae53b6d0bb2c1_Frokostm%C3%B8te.jpg",
            "Aktuelt frokostmøte",
        ),
        sourceUrl: "https://www.samfunnetibergen.no/komiteer/aktuelt",
        sourceNote: "Komité fra Samfunnet i Bergen.",
    },
    {
        _id: "studentGroup-upop",
        _type: "studentGroup",
        order: 8,
        name: "Upop",
        slug: { _type: "slug", current: "upop" },
        summary:
            "Upop er Studentersamfunnets vitenskapskomite, der både små nisjetemaer og store naturvitenskapelige temaer får en scene.",
        body: [
            "Upop står for upopulær vitenskap, og som navnet hinter til er det folkeopplysning og det å løfte frem forskning som er sentralt her.",
            "Upopkomiteen inviterer dyktige forskere innen sine felt til å holde et foredrag om temaet sitt. Deretter følger en panelsamtale der temaet brytes ytterligere ned, og til sist en spørsmålsrunde der publikum selv kan pirre nysgjerrigheten.",
            "Siktemålet til Upop er å ta den til tider svevende forskningen ned på jorden og vise frem det som rører seg i kriker og kroker i forskningsverden. De er opptatte av å stille spørsmål og øke kunnskap, og mest av alt å få utløp for sin bunnløse nysgjerrighet.",
            "Alle vitenskaplige fenomener er interessante for en Upop-er. I sitt faste konsept I hodet på dykker de hvert semester ned i psykologiens verden og mekanismene bak ulike personlighetsforstyrrelser.",
            "De har også formidlingskonseptet PubHD der et utvalg av Bergens Phd-stipendiater inviteres til puben for å presentere sine prosjekter i et beintøft format: 10 minutter foredrag, 10 minutter spørsmål, deretter videre til neste deltaker.",
            "Arrangementer: Tirsdager kl 18.00.",
        ],
        email: "upop@samfunnetibergen.no",
        category: "komitee",
        image: image(
            "upop-image",
            "https://cdn.prod.website-files.com/62d7a1e8316da31eea2c3c9c/632432a7a7094a1ca498e703_D58A1638(1).jpg",
            "Upop-arrangement",
        ),
        sourceUrl: "https://www.samfunnetibergen.no/komiteer/upop",
        sourceNote: "Komité fra Samfunnet i Bergen.",
    },
    {
        _id: "studentGroup-kultur",
        _type: "studentGroup",
        order: 9,
        name: "Kultur",
        slug: { _type: "slug", current: "kultur" },
        summary:
            "Kultur løfter kulturelle uttrykk frem i lyset, fra kunst og litteratur til alternativbevegelse og akttegning.",
        body: [
            "Kulturkomiteen er komiteen det er vanskelig å beskrive kort. De saumfarer kulturverden på jakt etter inntrykk, og lar ideene løpe fritt.",
            "De arrangerer alt fra aktiviteter som akttegning og kunstvandring til samtaler om BDSM og frokostkultur. Her er det rom for både det dypt livsberikende og det gresselig banale, og alt midt imellom.",
            "Kultur tar utgangspunkt i det utvidede kulturbegrepet. I dette udefinerbare mylderet er kunst, litteratur, teater og film selvsagte gjengangere, men også kulturen vi omgir oss med daglig har en plass her.",
            "Så lenge en følelse fremprovoseres kan det meste løftes frem på scenen. De har blant annet hatt stor suksess med arrangementer som Dragshow med Haus of Friele, Paint & Sip-sessions og byvandring til Bergens styggeste bygg.",
            "Kultur har jevnlige samarbeid med KODE, Den Nationale Scene og Litteraturhuset i Bergen.",
            "Arrangementer: Onsdager kl 18.00.",
        ],
        email: "kultur@samfunnetibergen.no",
        category: "komitee",
        image: image(
            "kultur-image",
            "https://cdn.prod.website-files.com/62d7a1e8316da31eea2c3c9c/63243f1eda5fe6466b1fdd53_IMG_5032(1).jpg",
            "Kultur-arrangement",
        ),
        sourceUrl: "https://www.samfunnetibergen.no/komiteer/kultur",
        sourceNote: "Komité fra Samfunnet i Bergen.",
    },
    {
        _id: "studentGroup-debattkomiteen",
        _type: "studentGroup",
        order: 10,
        name: "Debattkomiteen",
        slug: { _type: "slug", current: "debattkomiteen" },
        summary:
            "Debattkomiteen forsyner uken med skarpe diskusjoner og ordskifter om norsk og internasjonalt samfunnsliv.",
        body: [
            "Det finnes som regel to sider ved alle saker - da kan de også debatteres. Debattkomiteen forsyner uken med skarpe diskusjoner og provoserende ordskifter om det som rører seg i norsk og internasjonalt samfunnsliv.",
            "Debattkomiteen arrangerer debattene i Studentersamfunnets program. De debatterer ikke sakene selv, men inviterer beslutningstakere og samfunnsdebattanter til å komme og forsvare sine standpunkter.",
            "Som i enhver sunn debatt er man opptatt av å få frem motsetningene i saken slik at publikum selv kan gjøre seg opp en mening.",
            "Debattkomiteen er derimot opptatt av å ta saken ned på et folkelig nivå, snakke forståelig og sørge for at du er klokere når du går enn da du kom.",
            "Selv om det kan gå hett for seg på scenen, er debattkomiteen kjent for å være en ordentlig hyggelig gjeng.",
            "Arrangementer: Torsdager kl. 18.00.",
        ],
        email: "debatt@samfunnetibergen.no",
        category: "komitee",
        image: image(
            "debatt-image",
            "https://cdn.prod.website-files.com/62d7a1e8316da31eea2c3c9c/63ce6d96e98ff62751db38e7_D58A1098.jpeg",
            "Debatt-arrangement",
        ),
        sourceUrl: "https://www.samfunnetibergen.no/komiteer/debatt",
        sourceNote: "Komité fra Samfunnet i Bergen.",
    },
    {
        _id: "studentGroup-festkomiteen",
        _type: "studentGroup",
        order: 11,
        name: "Festkomiteen",
        slug: { _type: "slug", current: "festkomiteen" },
        summary:
            "Festkomiteen lager liv og røre utvalgte lørdager i semesteret, fra temafester til mindre eventer.",
        body: [
            "Danse til beaten, synge til favorittlåten, vibe til konseptet. Når Fest står for festen er det bare å nyte kvelden.",
            "Festkomiteen steller i stand liv og røre utvalgte lørdager i semesteret. De arrangerer både større temafester med fullspekket program og mindre eventer som ølsmaking, stand up og Silent Disco.",
            "Fest arrangerer også konseptet helhus, der de tar over hele Det Akademiske Kvarter for ein heidundrandes kveld.",
            "Fest er en festglad gjeng med godt kameratskap langt ut i de sene nattestimer. De siste semestrene har de hatt suksess med konsepter som Skeivt Helhus, fremtidsfest under Helhus: År 3022 og friske temakonsepter under Silent Disco.",
            "Det er også Fest som står bak de beryktede valgvakene på Det Akademiske Kvarter i forbindelse med valg i inn- og utland.",
            "Arrangementer: Lørdager kl 21.00.",
            "Fest sine arrangementer krever som hovedregel egen billett og dekkes ikke av kjøpt medlemskap i Studentersamfunnet.",
        ],
        email: "helhus@samfunnetibergen.no",
        category: "komitee",
        image: image(
            "fest-image",
            "https://cdn.prod.website-files.com/62d7a1e8316da31eea2c3c9c/65d64bca575667c12c61c433_Fest%201.png",
            "Fest-arrangement",
        ),
        sourceUrl: "https://www.samfunnetibergen.no/komiteer/fest",
        sourceNote: "Komité fra Samfunnet i Bergen.",
    },
    {
        _id: "studentGroup-samklang",
        _type: "studentGroup",
        order: 12,
        name: "Samklang",
        slug: { _type: "slug", current: "samklang" },
        summary:
            "Samklang arrangerer konserter utenfor boksen og leter frem perlene den gjengse student kan gå glipp av.",
        body: [
            "Samklangkomiteen står for Studentersamfunnets musikalske program. Som konsertarrangør løfter Samklang frem artister som hører hjemme på scenen for en kveld i studentenes gunst.",
            "Målet er å vise Bergens studenter hva som foregår de ukjente delene av Bergens og Norges musikkmiljø. Samklang er svært så bevandret i jazz og klassisk, men komiteen har stadig en føler ute og utforsker nye sjangre.",
            "Samklangs kjærlighet er forbeholdt den gode konsertopplevelsen. Om de kan fylle et tomrom i studentenes repertoar henter Samklang med glede inn artister fra hele Norge så vel som perler fra Griegakademiet og byens musikkscener.",
            "Komiteen har stor frihet når de setter sitt konsertprogram. Gjennom konsertserien Jazzå inviterer Samklang hvert semester til jazzkonserter.",
            "De har også sterk tilknytning til Bergen Filharmoniske Orkester og har jevnlig konsertsamarbeid med dem.",
            "Konserter: Tirsdager kl 20.00.",
            "Samklang sine konserter krever som hovedregel egen billett og dekkes ikke av kjøpt medlemskap i Studentersamfunnet.",
        ],
        email: "musikk@samfunnetibergen.no",
        category: "komitee",
        image: image(
            "samklang-image",
            "https://cdn.prod.website-files.com/62d7a1e8316da31eea2c3c9c/63c73958ff22d12e715c64da_samklang.jpg",
            "Samklang-konsert",
        ),
        sourceUrl: "https://www.samfunnetibergen.no/komiteer/samklang",
        sourceNote: "Komité fra Samfunnet i Bergen.",
    },
    {
        _id: "studentGroup-pr-komiteen",
        _type: "studentGroup",
        order: 13,
        name: "PR-etaten",
        slug: { _type: "slug", current: "pr-etaten" },
        summary: "PR-etaten er Kvarterets markedsførere og sørger for synlighet blant studentene.",
        body: [
            "PR-etaten (PR) er Kvarterets markedsførere og sørger for at Kvarteret er synlig overalt for den jevne student.",
            "Man trenger alltid nye hoder med i dette arbeidet. PR-etaten er en allsidig gjeng som er godt utstyrt. Du trenger ingen forhåndskunnskaper for å være med.",
            "Vi har fotoutstyr, samt tilgang på en rekke verktøy og programvare som gjør det lett å leke seg med promotering i praksis.",
            "PR-etaten er delt inn i fire undergrupper. Gruppene jobber litt ulikt fra uke til uke, men sammen drifter man Kvarterets mange kanaler og sørger for at omverden lett kan holde seg oppdatert om studentkulturhuset.",
            "Foto tar bilder av konserter og arrangementer i løpet av året. Som fotograf får du delta på mange kule eventer - også de som er i regi av drifts- og brukerorganisasjoner, avhengig av om de har egen fotograf den dagen.",
            "Grafisk produserer grafisk materiale til trykk og display på skjermer og i sosiale medier. Det er nyttig om du har kjennskap til programmer i Adobe-pakken, men ingen krav.",
            "SoMe promoterer de ulike arrangementene som foregår på Kvarteret i sosiale medier og svarer på spørsmål fra publikum. Man driver i tillegg med idéutvikling og planlegging av kampanjer eller andre trekkplaster for spesielle eventer.",
        ],
        category: "arbeidsgruppe",
        sourceUrl: "https://kvarteret.no/pr/",
        sourceNote: "Arbeidsgruppe fra Kvarteret.",
    },
    {
        _id: "studentGroup-finansdepartementet",
        _type: "studentGroup",
        order: 14,
        name: "Finansdepartementet",
        slug: { _type: "slug", current: "finansdepartementet" },
        summary:
            "Økonomikomiteen håndterer regnskap, refusjoner, reisebestillinger, søknadsskriving og økonomisk rådgivning.",
        body: [
            "Også økonomien vår blir håndtert av dyktige, frivillige studenter. Regnskap, refusjoner, reisebestillinger og søknadskriving er blant de viktige oppgavene som tas hånd om her.",
            "Økonomikomiteen fikser alt som gjelder penger i Studentersamfunnet. De forvalter et millionbudsjett som de har det praktiske ansvaret for at vi håndhever, men de driver også med spennende oppgaver for Studentersamfunnets videreutvikling.",
            "De er blant annet ansvarlige for å søke midler og sponsoravtaler og har en stor finger med i spillet når vi søker midler fra Velferdstinget Vest.",
            "De er også gode rådgivere for resten av Samfunnets medlemmer og bidrar til å gjøre organisasjonen tryggere på pengebruken.",
            "Økonomikomiteen er en administrativ komite og består blant annet av en rekke ansvarsverv som faktureringsansvarlig, reisebestillingsansvarlig og refusjonsansvarlig.",
            "De har også følere ute i hver arrangementkomite for å sikre at det er orden i arrangementsdriften. Selv om arbeidet er viktig, er Økonomikomiteen en sosial og trivelig gjeng.",
        ],
        email: "okonomi@samfunnetibergen.no",
        category: "komitee",
        image: image(
            "okonomi-image",
            "https://cdn.prod.website-files.com/62d7a1e8316da31eea2c3c9c/63cea0b1c249523cf0156d0e_Design%20uten%20navn%20(4).png",
            "Økonomikomiteen",
        ),
        sourceUrl: "https://www.samfunnetibergen.no/komiteer/okonomi",
        sourceNote: "Komité fra Samfunnet i Bergen.",
    },
    {
        _id: "studentGroup-sosialdepartementet",
        _type: "studentGroup",
        order: 15,
        name: "Sosialdepartementet",
        slug: { _type: "slug", current: "sosialdepartementet" },
        summary: "Sosialdepartementet sikrer et godt arbeidsmiljø for frivillige.",
        body: [
            "Sosialdepartementet har ansvar for å sikre et godt arbeidsmiljø for organisasjonens frivillige. De har også hovedansvar for rekruttering.",
            "Denne gruppen arrangerer interne fester, ball og hyttetur. Dette er en gruppe for deg med mange gode temafest-ideer!",
        ],
        email: "intern@samunnfetibergen.no",
        category: "komitee",
        sourceNote: "Fra Hvem er vi_.md. E-post er bevart slik den står i kilden.",
    },
    {
        _id: "studentGroup-rettsvesenet",
        _type: "studentGroup",
        order: 16,
        name: "Rettsvesenet",
        slug: { _type: "slug", current: "rettsvesenet" },
        summary: "Rettsvesenet er Kvarterets juridiske arbeidsgruppe.",
        body: [
            "Rettsvesenet er Kvarterets juridiske arbeidsgruppe. Deres hovedoppgave er å bistå Kvarteret i alle juridiske spørsmål, herunder avtaleinngåelse i forbindelse med innkjøp, investeringer, bookinger, arbeidskontrakter og mer.",
            "Kvarteret har en bred virksomhetsportefølje og det er stor variasjon i de oppgaver som gruppens medlemmer må løse. Når Rettsvesenet har fått et oppdrag blir det satt sammen en arbeidsgruppe for den enkelte sak.",
            "Gruppen består som regel av minst ett erfarent medlem som fungerer som veileder og gruppens leder. Størrelsen på gruppen varierer etter oppdragets art.",
            "Rettsvesenet har en egen opptaksprosess, og medlemmer rekrutteres direkte fra Det Juridiske Fakultet ved UIB. Det er et stående krav til at de har fullført første avdeling da gruppens virksomhet krever kjennskap til grunnleggende juridiske fagemner.",
            "Opptak skjer bare på høsten, og det er et begrenset antall plasser. Rettsvesenet følges opp av Frivilligansvarlig i Kvarterstyret.",
        ],
        email: "rettsvesenet.arkiv@kvarteret.no",
        category: "arbeidsgruppe",
        sourceUrl: "https://kvarteret.no/rettsvesenet/",
        sourceNote: "Arbeidsgruppe fra Kvarteret.",
    },
    {
        _id: "studentGroup-markedsgruppen",
        _type: "studentGroup",
        order: 17,
        name: "Markedsgruppen",
        slug: { _type: "slug", current: "markedsgruppen" },
        summary: "Markedsgruppen er Kvarterets økonomiske rådgivere.",
        body: [
            "Markedsgruppen (MG) er Kvarterets økonomiske rådgivere. Gruppen gjennomfører ulike typer analyser og markedsundersøkelser som benyttes som beslutningsgrunnlag i organisasjonen.",
            "Dagens student har endrede utelivsvaner, og Kvarteret må dermed utforske nytt potensial fortløpende. Det utarbeides blant annet kostnadskalkyler, foretas lønnsomhets- og investeringsanalyser, og utvikles både kortsiktige og langsiktige strategier i samråd med styret.",
            "Man får friheten til å foreta egne analyser med utgangspunkt i en stor mengde tilgjengelig rådata, og komme med anbefalinger på tiltak som kan bedre lønnsomheten. Men også Kvarterets rolle som studentenes kulturhus skal ivaretas.",
            "Arbeidet er prosjektbasert, og gir mulighet til å innvirke på beslutninger som tas - og erfare hvordan de innvirker på de finansielle resultatene i organisasjonen.",
            "Markedsgruppen har prosjektbaserte oppgaver hvor møtehyppighet kan variere. Arbeidsoppgavene fordeles slik at det er mulig å kombinere engasjementet med krevende studier og/eller jobb.",
            "Markedsgruppen følges opp av Markedsansvarlig i Kvarterstyret.",
        ],
        category: "arbeidsgruppe",
        sourceUrl: "https://kvarteret.no/marked/",
        sourceNote: "Arbeidsgruppe fra Kvarteret.",
    },
    {
        _id: "studentGroup-produksjonsgruppen",
        _type: "studentGroup",
        order: 18,
        name: "Produksjonsgruppen",
        slug: { _type: "slug", current: "produksjonsgruppen" },
        summary: "Produksjonsgruppen står for Kvarterets eget arrangementstilbud.",
        body: [
            "Produksjonsavdelingen står for Kvarterets eget arrangementstilbud. Her får man mulighet til å sette preg på programmet vårt.",
            "Hovedvekten av kulturtilbudet på huset fylles av ulike studentorganisasjoner som arrangerer egne ting. Utover dette er det ofte rom for enda flere begivenheter hvor Kvarteret arrangerer selv.",
            "Produksjon er delt i tre undergrupper: Quizgruppen som står bak vår faste tirsdagsquiz, Diskodepartementet hvor man får DJ-erfaring og Arrangementsgruppen som står bak andre høydepunkt - både faste eventer og sporadiske nyvinninger.",
            "Dette kan være alt fra klubb og konsert til loppemarked eller musikkbingo. Arrangementsgruppen utvikler også Kvarterets faste konsepter. Mikromandag, Bobler og Brus og Tønnetorsdag er eksempler på slike.",
            "Tidsbruk varierer avhengig av undergruppe, men man har stort sett ukentlige samlinger av et slag. I tillegg jobber man selvsagt fysisk på de arrangementene som skal avvikles.",
            "Produksjonsavdelingen følges opp av Produksjonsansvarlig i Kvarterstyret.",
        ],
        category: "arbeidsgruppe",
        sourceUrl: "https://kvarteret.no/produksjon/",
        sourceNote: "Arbeidsgruppe fra Kvarteret.",
    },
    {
        _id: "studentGroup-romvesenet",
        _type: "studentGroup",
        order: 19,
        name: "Romvesenet",
        slug: { _type: "slug", current: "romvesenet" },
        summary:
            "Romvesenet bygger, reparerer, maler og snekrer på huset, og er et internt neste steg for erfarne frivillige.",
        body: [
            "Romvesenet er vår gruppe med frivillige som bygger, reparerer, maler og snekrer - kort sagt: de som setter sitt preg på huset og gjør det enda bedre for alle.",
            "Romvesenet er kun for de som allerede har vært frivillige internt i et semester eller mer. Opptak skjer internt blant de som allerede er engasjert, slik at gruppen består av folk med erfaring fra huset.",
            "Det betyr at hvis du er ny frivillig, kan du starte i en av våre andre grupper - og kanskje blir Romvesenet et naturlig neste steg når du har blitt kjent og fått erfaring.",
            "På den måten får du både et sosialt miljø og sjansen til å utvikle deg videre i huset.",
        ],
        category: "arbeidsgruppe",
        sourceUrl: "https://kvarteret.no/romvesenet/",
        sourceNote: "Arbeidsgruppe fra Kvarteret.",
    },
    {
        _id: "studentGroup-personalgruppen",
        _type: "studentGroup",
        order: 20,
        name: "Personalgruppen",
        slug: { _type: "slug", current: "personalgruppen" },
        summary:
            "Personalgruppen administrerer og ivaretar medlemsmassen som trenges for å drive Kvarteret.",
        body: [
            "Personalgruppen (PG) har ansvar for å administrere og ivareta medlemsmassen som trenges for å drive Kvarteret.",
            "Det er PG som står bak storslagne internfester, årsfester og andre felles begivenheter for de frivillige på huset. Her er det også flere lavterskel arrangementer på programmet.",
            "PG håndterer dessuten personalsaker, gjennomfører rekruttering av nye medlemmer og sørger for kursing og kompetanseoverføring.",
            "For å jobbe i Personalgruppen må du ha vært frivillig på Kvarteret eller i en av drifts- og brukerorganisasjonene i minst ett semester.",
            "Personalgruppen følges opp at Frivilligansvarlig i Kvarterstyret.",
        ],
        category: "arbeidsgruppe",
        sourceUrl: "https://kvarteret.no/personalgruppen/",
        sourceNote: "Arbeidsgruppe fra Kvarteret.",
    },
]

const homeBars = [
    {
        _id: "homeBar-stjernesalen",
        _type: "homeBar",
        order: 1,
        nameNb: "Stjernesalen",
        nameEn: "Stjernesalen",
        descriptionNb:
            "Kvarterets kafé er et vannhull som kan passe til så mangt - men kanskje først og fremst til et realt måltid eller en ekstra digg kaffe.\n\nStjernesalen ligger i 2. etasje, og er åpent alle hverdager for å redde ditt blodsukker. Til hverdags er inngangen på oversiden av bygget. Barens åpningstider i Stjernesalen følger stort sett kjøkkenet.\n\nI Stjernesalen kan du delta på Kvarterets egne quiz hver tirsdag. Det er også et passende sted for å lese avisquiz sammen med venner, eller for å slå ihjel tid med laptop og kaffikopp på enmannshånd.",
        descriptionEn:
            "Kvarteret's cafe is a gathering place that suits many occasions, but first and foremost a proper meal or an especially good coffee.\n\nStjernesalen is on the second floor and is open on weekdays. On weekdays, the entrance is on the upper side of the building. The bar's opening hours largely follow the kitchen.\n\nIn Stjernesalen you can join Kvarteret's own quiz every Tuesday. It is also a good place to read the newspaper quiz with friends, or to spend time with a laptop and a cup of coffee on your own.",
    },
    {
        _id: "homeBar-grondahls",
        _type: "homeBar",
        order: 2,
        nameNb: "Grøndahls",
        nameEn: "Grøndahls",
        descriptionNb:
            "Dette er Kvarterets egen pub i pålitelig pratestil og med stort utvalg.\n\nGrøndahls ligger i byggets 1. etasje og er åpent alle dager utenom søndag. I hverdagene har puben inngang på gateplan i Håkonsgaten. I helgene må man benytte hovedinngang på siden av bygget. På mandager huser Grøndahls mikromandag - vårt faste konsept som gjør det enklere å bli kjent med mikrobrygg fra fjern og nær.\n\nI Grøndahls er musikknivået alltid i favør for engasjerende samtaler. Her kan du enkelt samles med venner og bekjente - helt uformelt - når det skulle passe.",
        descriptionEn:
            "This is Kvarteret's own pub, built for conversation and a broad selection.\n\nGrondahls is on the first floor and is open every day except Sunday. On weekdays, the pub has a street-level entrance from Hakonsgaten. On weekends, use the main entrance on the side of the building. On Mondays, Grondahls hosts Micro Monday, our regular concept for getting to know microbrews from near and far.\n\nAt Grondahls, the music level always favors good conversations. It is an easy place to meet friends and acquaintances informally whenever it suits you.",
    },
    {
        _id: "homeBar-halvtimen",
        _type: "homeBar",
        order: 3,
        nameNb: "Halvtimen",
        nameEn: "Halvtimen",
        descriptionNb:
            "Vår cocktailbar holder kun åpent i helgene, og her er det 20-årsgrense for alle gjester.\n\nDet kan godt være den heter Halvtimen fordi den tar litt tid å finne. Her står de frivillige klare med shakere og drinkglass for å gi deg en best mulig smaksopplevelse, og musikken er oppstemt. I Halvtimen selges det også rista brød til sultne natteravner. På torsdager arrangeres det faste konseptet TønneTorsdag, der fokuset er på alt som har vært lagra mellom planker og tønnebånd.\n\nHalvtimen ligger i 3. etasje av bygget, opp den breie betongtrappa. Det er ID-sjekk i døra.",
        descriptionEn:
            "Our cocktail bar is open only on weekends, and all guests must be at least 20 years old.\n\nMaybe it is called Halvtimen because it takes a little while to find. Here, volunteers are ready with shakers and cocktail glasses to give you the best possible taste experience, and the music is upbeat. Halvtimen also sells toast for hungry night owls. On Thursdays, we host Cask Thursday, a regular concept focused on anything aged between planks and barrel hoops.\n\nHalvtimen is on the third floor, up the wide concrete stairs. ID is checked at the door.",
    },
]

const documents = [
    siteMetadata,
    homePage,
    eventsPage,
    roomsPage,
    groupsPage,
    ...homeBars,
    ...rooms,
    ...studentGroups,
]

for (const document of documents) {
    const { _id, ...fields } = document
    await client.createIfNotExists(document)
    await client.patch(_id).set(fields).commit()
    console.log(`Ensured ${document._id}`)
}

const homePagesWithFooter = await client.fetch(
    '*[_type == "homePage" && (defined(footerNb) || defined(footerEn))]._id',
)

for (const id of homePagesWithFooter) {
    await client.patch(id).unset(["footerNb", "footerEn"]).commit()
    console.log(`Removed hardcoded footer fields from ${id}`)
}
