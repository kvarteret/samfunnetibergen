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
        summary: "Skjenkegruppen bemanner husets faste skjenkepunkter og kjøkkenet.",
        body: [
            "Skjenkegruppen bemanner husets faste skjenkepunkter og kjøkkenet og drifter disse.",
            "Dette er gjengen som lager alle de gode måltidene i Stjernesalen og som du hver kveld ser bak baren i Grøndahls. Bli med da vel!",
        ],
        email: "sjenke.leder@kvarteret.no",
        category: "drift",
        sourceNote: "Fra Hvem er vi_.md.",
    },
    {
        _id: "studentGroup-kraftetaten",
        _type: "studentGroup",
        order: 2,
        name: "Kraftetaten",
        slug: { _type: "slug", current: "kraftetaten" },
        summary: "Kraftetaten er husets lyd- og lysteknikere.",
        body: [
            "Kraftetaten er husets lyd- og lysteknikere. De styrer og avvikler teknikk på husets arrangementer.",
            "Vil du ha relevant erfaring innen lys og lyd? Da er dette gruppen for deg!",
        ],
        email: "kraft.leder@kvarteret.no",
        category: "drift",
        sourceNote: "Fra Hvem er vi_.md.",
    },
    {
        _id: "studentGroup-vaktetaten",
        _type: "studentGroup",
        order: 3,
        name: "Vaktetaten",
        slug: { _type: "slug", current: "vaktetaten" },
        summary: "Vaktetaten ivaretar sikkerheten og trivselen for frivillige og gjester.",
        body: [
            "Vaktetaten er husets ordensvakter og vektere. Vaktene har i hovedoppgave å ivareta sikkerheten og trivselen for alle husets frivillige og gjester.",
            "Har du erfaring som vekter eller vil få det? Vaktetaten er stedet for deg.",
        ],
        email: "vakt.leder@kvarteret.no",
        category: "drift",
        sourceNote: "Fra Hvem er vi_.md.",
    },
    {
        _id: "studentGroup-e-tjenesten",
        _type: "studentGroup",
        order: 4,
        name: "E-tjenesten",
        slug: { _type: "slug", current: "e-tjenesten" },
        summary: "E-tjenesten er IT-gruppen vår og har ansvar for nettsiden og databaser.",
        body: [
            "E-tjenesten er IT-gruppen vår og har ansvar for nettsiden og våre databaser. Oppgavene er allsidige og gjelder både frontend og backend.",
            "IT-gruppen er en sosial gjeng hvor du lett lærer av og sammen med andre. Her kan du jobbe med rammeverk som Astro.js, Flutter, .net 8, React, Angular og hva enn andre rammeverk du kan selv. Det er ingen krav til forkunnskaper.",
        ],
        email: "it.leder@kvarteret.no",
        category: "drift",
        sourceNote: "Fra Hvem er vi_.md.",
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
        category: "program",
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
        category: "program",
        sourceNote: "Fra Hvem er vi_.md.",
    },
    {
        _id: "studentGroup-aktuelt",
        _type: "studentGroup",
        order: 7,
        name: "Aktuelt",
        slug: { _type: "slug", current: "aktuelt" },
        summary: "Aktuelt arrangerer frokostmøter om samfunnet rundt oss.",
        body: [
            "Aktuelt arrangerer frokostmøter på tirsdager kl 08.30-09.30 i Stjernesalen på Kvarteret.",
            "Frokostmøtene er sentrert rundt å gi innsikt om samfunnet rundt oss og belyser et tema som er - gjett hva - aktuelt. Aktuelt byr på en herlig morgenstund med kaffe, frokost og spennende samtaler. Komiteen møtes hver tirsdag 18.30.",
        ],
        email: "aktuelt@samfunnetibergen.no",
        category: "program",
        sourceNote: "Fra Hvem er vi_.md.",
    },
    {
        _id: "studentGroup-upop",
        _type: "studentGroup",
        order: 8,
        name: "Upop",
        slug: { _type: "slug", current: "upop" },
        summary: "Upop er Studentersamfunnets vitenskapskomité.",
        body: [
            "Upop er Studentersamfunnets vitenskapskomité! Deres arrangementer spenner fra populærvitenskap til de minste nisjetemaene.",
            "Alt kan løftes frem på scenen, så lenge det finnes forskning på feltet. Arrangementene deres holdes tirsdag kveld kl 18.00, og komitémøte holdes kl 16.30 på onsdager.",
        ],
        email: "upop@samfunnetibergen.no",
        category: "program",
        sourceNote: "Fra Hvem er vi_.md.",
    },
    {
        _id: "studentGroup-kultur",
        _type: "studentGroup",
        order: 9,
        name: "Kultur",
        slug: { _type: "slug", current: "kultur" },
        summary: "Kultur lager opplysende diskusjoner om det som rører seg i kulturlivet.",
        body: [
            "Kultur er komiteen som supplerer uka med opplysende diskusjoner om det som rører seg i kulturlivet.",
            "De saumfarer både det grenseløst pretensiøse og det gresselig banale etter innsikter som beriker tilværelsen. Her får alle kulturelle uttrykk plass, det være seg klassisk litteratur, the Kardashians eller noe midt imellom.",
            "Arrangementene deres gjennomføres onsdager kl 18.00. Komiteen møtes torsdager kl 16.15.",
        ],
        email: "kultur@samfunnetibergen.no",
        category: "program",
        sourceNote: "Fra Hvem er vi_.md.",
    },
    {
        _id: "studentGroup-debattkomiteen",
        _type: "studentGroup",
        order: 10,
        name: "Debattkomiteen",
        slug: { _type: "slug", current: "debattkomiteen" },
        summary: "Debattkomiteen arrangerer debatter om det meste.",
        body: [
            "Debattkomiteen arrangerer debatter om det meste. De forsyner uka med skarpe diskusjoner og provoserende ordskifter om det som preger norsk og internasjonalt samfunnsliv.",
            "Beslutningstakere og andre aktører inviteres for å belyse sakens sider og argumentere så gnistene fyker. Det finnes som regel to sider ved alle saker - da kan de også debatteres. Komiteemøtene holdes mandag kl 16.30.",
        ],
        email: "debatt@samfunnetibergen.no",
        category: "program",
        sourceNote: "Fra Hvem er vi_.md.",
    },
    {
        _id: "studentGroup-festkomiteen",
        _type: "studentGroup",
        order: 11,
        name: "Festkomiteen",
        slug: { _type: "slug", current: "festkomiteen" },
        summary: "Festkomiteen står for liv og røre utvalgte lørdager i semesteret.",
        body: [
            "Festkomiteen står for liv og røre utvalgte lørdager i semesteret! De arrangerer store temafester med fullspekket program og mindre eventer som jazzbar, karaoke, ølsmaking og dragshow.",
            "Her lager man underholdning for mange, og publikum kan være på opp mot 1500 mennesker. Komiteen møtes hver onsdag kl. 19.00 for å jobbe med program og myldre til nye, festlige lag.",
        ],
        email: "helhus@samfunnetibergen.no",
        category: "program",
        sourceNote: "Fra Hvem er vi_.md.",
    },
    {
        _id: "studentGroup-samklang",
        _type: "studentGroup",
        order: 12,
        name: "Samklang",
        slug: { _type: "slug", current: "samklang" },
        summary: "Samklang er Studentersamfunnets musikkkomité.",
        body: [
            "Samklang er Studentersamfunnets musikkkomité og arrangerer konserter utenfor boksen.",
            "Her hentes det inn alskens musikere fra hele Norge, men også finplukk fra det lokale Griegakademiet og Bergen Filharmoniske Orkester. Samklang har ulike konsertserier for alt fra de flotteste klassiske toner til undergrunnens skrall. En større sjangerblanding av en arrangør skal du lete lenge etter.",
            "Komiteen møtes torsdag kl 18.00.",
        ],
        email: "musikk@samfunnetibergen.no",
        category: "program",
        sourceNote: "Fra Hvem er vi_.md.",
    },
    {
        _id: "studentGroup-pr-komiteen",
        _type: "studentGroup",
        order: 13,
        name: "PR-komiteen",
        slug: { _type: "slug", current: "pr-komiteen" },
        summary: "PR-komiteen jobber med Samfunnets visuelle profil og kommunikasjon.",
        body: [
            "PR-komiteen jobber med Samfunnets visuelle profil og kommunikasjon med publikum.",
            "PR designer plakater, fotograferer, skriver innlegg og driver promotering på sosiale medier og nettsiden vår. De søker kreative sjeler som er mer opptatt av hvordan SoMe-profilen skal se ut, enn hvilke spørsmål møteleder skal stille. Erfaring er ikke nødvendig, men ønskes!",
        ],
        email: "kommunikasjon@samunnfetibergen.no",
        category: "organisasjon",
        sourceNote: "Fra Hvem er vi_.md. E-post er bevart slik den står i kilden.",
    },
    {
        _id: "studentGroup-finansdepartementet",
        _type: "studentGroup",
        order: 14,
        name: "Finansdepartementet",
        slug: { _type: "slug", current: "finansdepartementet" },
        summary: "Finansdepartementet er organisasjonens økonomiske arbeidsgruppe.",
        body: [
            "Finansdepartementet er organisasjonens økonomiske arbeidsgruppe. De har overordnet ansvar for økonomisk rådgivning, kompetanse, økonomisk orientering, budsjett, analyser og fond.",
            "Det er ingen krav til erfaring, men interesse for tall er en fordel. Komiteen møtes annenhver uke.",
        ],
        email: "okonomi@samfunnetibergen.no",
        category: "organisasjon",
        sourceNote: "Fra Hvem er vi_.md.",
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
        category: "organisasjon",
        sourceNote: "Fra Hvem er vi_.md. E-post er bevart slik den står i kilden.",
    },
    {
        _id: "studentGroup-rettsvesenet",
        _type: "studentGroup",
        order: 16,
        name: "Rettsvesenet",
        slug: { _type: "slug", current: "rettsvesenet" },
        summary: "Rettsvesenet er Studentersamfunnets juridiske arbeidsgruppe.",
        body: [
            "Rettsvesenet er Studentersamfunnets juridiske arbeidsgruppe. Deres hovedoppgave er å bistå organisasjonen i alle juridiske spørsmål, herunder avtaleinngåelse og i forbindelse med innkjøp, investeringer, bookinger, arbeidskontrakter og mer.",
            "Går du Rettsvitenskap og er ferdig med 1. året? Da kan du bli en del av Rettsvesenet.",
        ],
        email: "rettsvesenet.arkiv@kvarteret.no",
        category: "organisasjon",
        sourceNote: "Fra Hvem er vi_.md.",
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
