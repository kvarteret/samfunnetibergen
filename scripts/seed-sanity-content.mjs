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

const documents = [siteMetadata, homePage, eventsPage, ...homeBars]

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
