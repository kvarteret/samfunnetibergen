import { getCliClient } from "sanity/cli"

const client = getCliClient({ apiVersion: "2024-01-01" })
const write = process.argv.includes("--write")

const obsoleteSiteMetadataFields = [
    "siteTitleNb",
    "siteTitleEn",
    "siteDescriptionNb",
    "siteDescriptionEn",
    "homeTitleNb",
    "homeTitleEn",
    "homeDescriptionNb",
    "homeDescriptionEn",
    "eventsTitleNb",
    "eventsTitleEn",
    "eventsDescriptionNb",
    "eventsDescriptionEn",
    "volunteerSignupTitleNb",
    "volunteerSignupTitleEn",
    "volunteerSignupDescriptionNb",
    "volunteerSignupDescriptionEn",
    "groupPageTitleNb",
    "groupPageTitleEn",
    "groupPageDescriptionNb",
    "groupPageDescriptionEn",
]

const obsoleteEventsPageFields = [
    "eyebrowNb",
    "eyebrowEn",
    "titleNb",
    "titleEn",
    "descriptionNb",
    "descriptionEn",
]

const obsoleteBlifrivilligPageFields = ["titleNb", "titleEn"]

const section = (title, paragraphs) => ({ _type: "recruitmentSection", title, paragraphs })

const recruitingGroups = [
    {
        slug: "skjenkegruppen",
        recruitmentLabel: "Bar, kafé, kjøkken og cocktailbar",
        recruitmentLead:
            "Skjenkegruppen er Kvarterets kokker, servitører og bartendere. Her drifter du husets faste barer og kjøkken, blir del av den største arbeidsgruppen på huset og får opplæring underveis enten du vil lære kaffe, mat, øl eller cocktails.",
        recruitmentSections: [
            section("Tidsbruk", [
                "De fleste undergruppene jobber omtrent ett skift i uken. Halvtimen skiller seg ut med tre skift i måneden.",
                "En prøvedugnad er den naturlige måten å starte på hvis du vil kjenne på stemningen før du bestemmer deg.",
            ]),
            section("Undergrupper", [
                "Stjernesalen passer for deg som vil jobbe med kafeservice, kaffe, mocktails og vin.",
                "Kokkegruppen er for deg som vil lage mat til huset og bidra med catering til arrangementer og konserter.",
                "Halvtimen er cocktailbaren for deg over 20 år som vil dykke dypere i cocktails, mens Grøndahls er puben med tempo, sortiment og mye frivilligliv etter skift.",
            ]),
        ],
    },
    {
        slug: "kraftetaten",
        recruitmentLabel: "Lyd, lys og produksjon",
        recruitmentLead:
            "Kraftetaten er Kvarterets lyd- og lysteknikere. Her styrer du teknisk produksjon for konserter, teater, debatter og andre arrangementer, og jobber med utstyr på profesjonelt nivå samtidig som det er rom for læring og nettverk.",
        recruitmentSections: [
            section("Hva du gjør", [
                "Som krafter er du med på å planlegge og gjennomføre teknisk produksjon på en av Bergens sterkeste intimscener.",
                "Du kan prøve alt fra konserter og debatter til større produksjoner og streaming, og de fleste starter med å fordype seg i enten lyd eller lys.",
            ]),
            section("Tidsbruk", [
                "Minimumet er ett skift i uken, med mange arrangementer å velge mellom.",
                "Mandager brukes til husarbeid, vedlikehold, kurs og sosial tid, og nye medlemmer går gjennom en prøveperiode før fast kontrakt.",
            ]),
        ],
    },
    {
        slug: "vaktetaten",
        recruitmentLabel: "Trygghet, ansvar og samhold",
        recruitmentLead:
            "Vaktetaten er Kvarterets sikkerhets- og vaktgruppe. Her jobber du alltid sammen med andre, lærer konflikthåndtering, førstehjelp og brannsikkerhet, og bidrar til trygghet og trivsel for både frivillige og gjester i huset.",
        recruitmentSections: [
            section("Hva du lærer", [
                "Vaktetaten gir intern opplæring i konflikthåndtering, førstehjelp og brannsikkerhet.",
                "Det finnes også muligheter for å ta ordensvakt- og vekterkurs gjennom gruppen.",
            ]),
            section("Tidsbruk", [
                "Skiftene er vanligvis tre per måned, og du kan samle dem i en helg eller spre dem utover.",
                "Det starter med en uforpliktende prøvedugnad, så terskelen for å teste miljøet er lav.",
            ]),
        ],
    },
]

function log(message) {
    console.log(`${write ? "WRITE" : "DRY"} ${message}`)
}

async function commitPatch(patch, label) {
    if (!write) {
        log(label)
        return
    }

    await patch.commit({ autoGenerateArrayKeys: true })
    log(label)
}

async function migrateSourcedImages() {
    const docs = await client.fetch(
        `*[_type in ["studentGroup", "room"] && defined(image.sourceUrl)]{
            _id,
            _type,
            "title": coalesce(name, title, _id),
            "sourceUrl": image.sourceUrl,
            "hasAsset": defined(image.image.asset)
        }`,
    )

    for (const doc of docs) {
        if (doc.hasAsset) {
            await commitPatch(client.patch(doc._id).unset(["image.sourceUrl"]), `unset sourceUrl on ${doc._id}`)
            continue
        }

        if (!write) {
            log(`would upload ${doc.sourceUrl} for ${doc._id}`)
            continue
        }

        const response = await fetch(doc.sourceUrl)
        if (!response.ok) {
            throw new Error(`Failed to download ${doc.sourceUrl}: ${response.status}`)
        }

        const contentType = response.headers.get("content-type") ?? undefined
        const extension = contentType?.split("/")[1]?.split(";")[0] ?? "image"
        const filename = `${doc._id}.${extension}`
        const asset = await client.assets.upload("image", Buffer.from(await response.arrayBuffer()), {
            contentType,
            filename,
        })

        await commitPatch(
            client
                .patch(doc._id)
                .set({ "image.image": { _type: "image", asset: { _type: "reference", _ref: asset._id } } })
                .unset(["image.sourceUrl"]),
            `uploaded image and unset sourceUrl on ${doc._id}`,
        )
    }
}

async function migrateSingletons() {
    const siteDocs = await client.fetch(
        `*[_type == "siteMetadata" && _id in ["siteMetadata", "drafts.siteMetadata"]]{
            _id,
            homeTitle,
            homeTitleNb,
            homeDescription,
            homeDescriptionNb,
            eventsTitle,
            eventsTitleNb,
            eventsDescription,
            eventsDescriptionNb
        }`,
    )

    for (const doc of siteDocs) {
        await commitPatch(
            client.patch(doc._id).set({
                homeTitle: doc.homeTitle ?? doc.homeTitleNb ?? "Samfunnet i Bergen",
                homeDescription: doc.homeDescription ?? doc.homeDescriptionNb,
                eventsTitle: doc.eventsTitle ?? doc.eventsTitleNb,
                eventsDescription: doc.eventsDescription ?? doc.eventsDescriptionNb,
            }).unset(obsoleteSiteMetadataFields),
            `migrated siteMetadata ${doc._id}`,
        )
    }

    const eventsDocs = await client.fetch(
        `*[_type == "eventsPage" && _id in ["eventsPage", "drafts.eventsPage"]]{
            _id,
            eyebrow,
            eyebrowNb,
            title,
            titleNb,
            description,
            descriptionNb
        }`,
    )

    for (const doc of eventsDocs) {
        await commitPatch(
            client.patch(doc._id).set({
                eyebrow: doc.eyebrow ?? doc.eyebrowNb,
                title: doc.title ?? doc.titleNb,
                description: doc.description ?? doc.descriptionNb,
            }).unset(obsoleteEventsPageFields),
            `migrated eventsPage ${doc._id}`,
        )
    }

    const volunteerDocs = await client.fetch(
        `*[_type == "blifrivilligPage" && _id in ["blifrivilligPage", "drafts.blifrivilligPage"]]{
            _id,
            title,
            titleNb
        }`,
    )

    for (const doc of volunteerDocs) {
        await commitPatch(
            client.patch(doc._id).set({ title: doc.title ?? doc.titleNb }).unset(obsoleteBlifrivilligPageFields),
            `migrated blifrivilligPage ${doc._id}`,
        )
    }
}

async function migrateRecruitingGroups() {
    const workingGroups = await client.fetch(
        `*[_type == "studentGroup" && category == "arbeidsgruppe"]{_id}`,
    )

    for (const doc of workingGroups) {
        await commitPatch(
            client.patch(doc._id).set({ isRecruiting: false }),
            `marked ${doc._id} as not recruiting`,
        )
    }

    for (const group of recruitingGroups) {
        const { slug, ...fields } = group
        const docs = await client.fetch(
            `*[_type == "studentGroup" && slug.current == $slug]{_id}`,
            { slug },
        )

        for (const doc of docs) {
            await commitPatch(
                client.patch(doc._id).set({ ...fields, isRecruiting: true }),
                `marked ${doc._id} as recruiting`,
            )
        }
    }
}

await migrateSourcedImages()
await migrateSingletons()
await migrateRecruitingGroups()
