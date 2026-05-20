import { getCliClient } from "sanity/cli"

const client = getCliClient({ apiVersion: "2024-01-01" })
const write = process.argv.includes("--write")

const sponsors = [
    {
        key: "universitetet-i-bergen",
        title: "Universitetet i Bergen",
        website: "https://www.uib.no/",
        logoUrl:
            "https://cms.kvarteret.no/assets/39a66afc-28ae-4a42-802e-7984bb81522e?width=384&quality=75",
        paragraphs: [
            "Universitetet i Bergen er med sine 14 800 studenter og vel 3 600 ansatte et mellomstort europeisk universitet. Sentrale deler av campus ligger i sentrum av byen. Universitetet i Bergen er både et lærested og en forskningsinstitusjon som dekker de fleste fagområder, organisert i seks fakulteter og rundt 40 institutter og faglige sentre.",
            "Universitetet i Bergen er også del av et globalt nettverk av studenter, forskere og kunnskapsinstitusjoner.",
        ],
    },
    {
        key: "bergen-kommune",
        title: "Bergen kommune",
        website: "https://www.bergen.kommune.no/",
        logoUrl:
            "https://cms.kvarteret.no/assets/b1de9084-a623-4d5e-b98b-a4f0940108f7?width=384&quality=75",
        paragraphs: [
            "Bergen er en by og en kommune i Hordaland og er Norges nest største by med 270 000 innbyggere. Bergen regnes ofte som Vestlandets landsdelshovedstad.",
        ],
    },
    {
        key: "velferdstinget-vest",
        title: "Velferdstinget Vest",
        website: "https://vtvest.no/",
        logoUrl:
            "https://cms.kvarteret.no/assets/98885ff0-66cc-404e-acac-bd01a0a18b28?width=384&quality=75",
        paragraphs: [
            "Velferdstinget Vest er en sammensetning av studentdemokratiene til alle utdanningsinstitusjonene som er tilknyttet Sammen, Studentsamskipnaden på Vestlandet. Vi jobber med all studentpolitikk som ikke er institusjonsspesifikk, som studentboliger, psykisk helsetilbud, helsestasjon, studentidrett og studentkultur.",
        ],
    },
    {
        key: "sammen",
        title: "Sammen - Studentsamskipnaden på Vestlandet",
        website: "https://www.sammen.no/no/bergen",
        logoUrl:
            "https://cms.kvarteret.no/assets/7d4d67f1-276c-440d-ba5e-159d92c0c226?width=384&quality=75",
        paragraphs: [
            "Studentsamskipnaden på Vestlandet (Sammen) driver studentvelferd for omlag 30.000 studenter på Vestlandet. Vår visjon er: Du skal ha det godt som student i Bergen.",
            "Sammen med utdanningsinstitusjonene arbeider Sammen for å utvikle det helhetlige læringsmiljøet for studenter på Vestlandet. Ved å tilby gode velferdsordninger og et fagtilbud av høy kvalitet, vil vi i samarbeid gjøre Bergen til en attraktiv studieby. Dette samarbeidet skjer i stor grad gjennom Utdanning i Bergen.",
        ],
    },
    {
        key: "kulturrom",
        title: "Kulturrom",
        website: "https://www.kulturrom.no/",
        logoUrl:
            "https://cms.kvarteret.no/assets/686f9bd2-cac7-4d66-bd73-1cce0cdea95b?width=384&quality=75",
        paragraphs: [
            "Kulturrom skal bidra til øvingslokaler og gode tekniske vilkår for fremføring av musikk, dans og teater over hele landet.",
        ],
    },
]

function block(text, key) {
    return {
        _key: key,
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [
            {
                _key: `${key}-span`,
                _type: "span",
                marks: [],
                text,
            },
        ],
    }
}

async function findExistingImageAsset(filename) {
    return client.fetch(`*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`, {
        filename,
    })
}

async function uploadLogo(sponsor) {
    const filename = `sponsor-${sponsor.key}.png`
    const existingAssetId = await findExistingImageAsset(filename)

    if (existingAssetId) {
        return existingAssetId
    }

    if (!write) {
        return `dry-${filename}`
    }

    const response = await fetch(sponsor.logoUrl)
    if (!response.ok) {
        throw new Error(`Failed to download logo for ${sponsor.title}: ${response.status}`)
    }

    const contentType = response.headers.get("content-type") ?? "image/png"
    const asset = await client.assets.upload("image", Buffer.from(await response.arrayBuffer()), {
        contentType,
        filename,
    })

    return asset._id
}

async function main() {
    const sponsorValues = []

    for (const sponsor of sponsors) {
        const logoAssetId = await uploadLogo(sponsor)
        console.log(`${write ? "WRITE" : "DRY"} ${sponsor.title}: ${logoAssetId}`)

        sponsorValues.push({
            _key: sponsor.key,
            _type: "sponsor",
            title: sponsor.title,
            website: sponsor.website,
            logo: {
                _type: "image",
                asset: {
                    _type: "reference",
                    _ref: logoAssetId,
                },
            },
            description: sponsor.paragraphs.map((paragraph, index) =>
                block(paragraph, `${sponsor.key}-${index}`),
            ),
        })
    }

    if (!write) {
        console.log("DRY would patch sponsorsPage.sponsors")
        return
    }

    await client.createIfNotExists({
        _id: "sponsorsPage",
        _type: "sponsorsPage",
        title: "Sponsorer",
    })

    await client
        .patch("sponsorsPage")
        .set({
            title: "Sponsorer",
            sponsors: sponsorValues,
        })
        .commit({ autoGenerateArrayKeys: true })

    console.log("WRITE patched sponsorsPage")
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
