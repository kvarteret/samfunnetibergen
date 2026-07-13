import { markdownToPortableText } from "@portabletext/markdown"

export const USEFUL_INFO_PAGE_ID = "usefulInfoPage"
export const RETIRED_ACCESSIBILITY_PAGE_ID =
  "445aa6de-3a1a-4c29-b34e-2c98695e8cfb"
export const VERGEORDNING_FORM_URL =
  "https://forms.clickup.com/2452384/f/2aux0-4032/HNO5KFUM24SKGG2J5I"

// Verbatim `content` of the retired `tilgjengelighet` page. Kept here so the
// migration and its tests are self-contained and do not depend on live data.
export const ACCESSIBILITY_MARKDOWN = `# Tilgjengelighet ♿️

Studentersamfunnet skal være et sted alle kan bruke. Her finner du en oversikt over hvordan bygget vårt er tilrettelagt, og hvordan du kommer deg inn i de ulike etasjene.

## Heis og etasjer

Vi har totalt tre etasjer, og bygget er i hovedsak tilgjengelig med heis.

* Hovedheisen går mellom alle etasjer
* Øvre del av Tivoli kan kun nås ved å bruke rullestolheis. Heisen finnes ved hovedinngangen (én bruker av gangen)
* Første og andre etasje kan også nås direkte fra utsiden av bygget
* Etter klokken 20:00 må man bruke heiskort. Dette kan man låne i resepsjonen eller ved å ringe driftsleder på tlf. 406 26 601

## Av- og påstigning

Det finnes to steder hvor det er mulig å sette av brukere med redusert mobilitet:

1. **I bakgården**: Kjør inn i bakgården og bruk inngangen gjennom Stjernesalen. Når du kommer inn, finner du heisen til høyre rett etter du har kjørt gjennom lokalet
2. **Håkonsgaten**: Vi anbefaler å stoppe nederst ved trappen til Johanneskirken. Her får du stå i fred og ro uten å måtte stoppe opp trafikken. Bruk inngang enten vis a vis Kinsarvik (døren under neonskiltet) eller rundt hjørnet ved vår hovedinngang (her er det skråbakke)

## HC-toaletter

Vi har tre HC-toaletter plassert slik:

* Første etasje: Utenfor døren til Teglverket
* Andre etasje: Utenfor resepsjonen
* Tredje etasje: I gangen ved Halvtimen

Du kan bruke heisen for å nå alle disse.

## Har du spørsmål om tilgjengelighet?

Ikke alle inngangene våre er åpne hele tiden. De fleste innganger som er åpne på dagtid ligger på oversiden av bygget, og dit må man opp en bratt skråbakke.

Hvis du trenger tilgang på gateplan, kan du ringe oss, så kommer vi og låser opp. Dette gjelder spesielt for brukere som ikke kan bruke skråbakken eller som trenger kortest mulig vei inn.

**For å få hjelp ved ankomst, ta kontakt på tlf. 406 26 601**
`

type AccessibilityItem = { title: string; markdown: string }

export type SplitAccessibilityMarkdown = {
  heading: string
  intro: string
  items: AccessibilityItem[]
}

/**
 * Split the retired accessibility markdown into its top-level heading + intro
 * and one entry per `## ` sub-heading. Pure and deterministic so it can be
 * unit-tested independently of Sanity.
 */
export function splitAccessibilityMarkdown(
  markdown: string,
): SplitAccessibilityMarkdown {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n")

  let heading = ""
  const introLines: string[] = []
  const items: { title: string; lines: string[] }[] = []
  let current: { title: string; lines: string[] } | null = null

  for (const line of lines) {
    const subHeading = line.match(/^##\s+(.*)$/)
    const topHeading = line.match(/^#\s+(.*)$/)

    if (subHeading) {
      current = { title: subHeading[1].trim(), lines: [] }
      items.push(current)
    } else if (topHeading) {
      heading = topHeading[1].trim()
    } else if (current) {
      current.lines.push(line)
    } else if (heading) {
      introLines.push(line)
    }
  }

  return {
    heading,
    intro: introLines.join("\n").trim(),
    items: items.map(item => ({
      title: item.title,
      markdown: item.lines.join("\n").trim(),
    })),
  }
}

type PortableTextBlock = {
  _type: string
  _key?: string
  children?: { _key?: string; [key: string]: unknown }[]
  [key: string]: unknown
}

// markdownToPortableText assigns random keys on every run. Re-key blocks and
// spans deterministically so the migration converges to the same document.
function markdownToKeyedPortableText(
  markdown: string,
  prefix: string,
): PortableTextBlock[] {
  const blocks = markdownToPortableText(markdown) as PortableTextBlock[]
  return blocks.map((block, blockIndex) => ({
    ...block,
    _key: `${prefix}-b${blockIndex}`,
    ...(Array.isArray(block.children)
      ? {
          children: block.children.map((child, childIndex) => ({
            ...child,
            _key: `${prefix}-b${blockIndex}-s${childIndex}`,
          })),
        }
      : {}),
  }))
}

type SourceLink = {
  _type: "sourceLink"
  _key: string
  label: string
  linkType: "internalPage" | "internalPath" | "external"
  internalPage?: { _type: "reference"; _ref: string }
  internalPath?: string
  externalUrl?: string
}

const internalPageLink = (
  key: string,
  label: string,
  ref: string,
): SourceLink => ({
  _type: "sourceLink",
  _key: key,
  label,
  linkType: "internalPage",
  internalPage: { _type: "reference", _ref: ref },
})

const internalPathLink = (
  key: string,
  label: string,
  path: string,
): SourceLink => ({
  _type: "sourceLink",
  _key: key,
  label,
  linkType: "internalPath",
  internalPath: path,
})

const externalLink = (key: string, label: string, url: string): SourceLink => ({
  _type: "sourceLink",
  _key: key,
  label,
  linkType: "external",
  externalUrl: url,
})

function sourceLinkHref(link: SourceLink): string | null {
  if (link.linkType === "external") return link.externalUrl ?? null
  if (link.linkType === "internalPath") return link.internalPath ?? null

  const ref = link.internalPage?._ref
  if (!ref) return null

  const singletonPaths: Record<string, string> = {
    homePage: "/",
    eventsPage: "/arrangementer",
    roomsPage: "/rom",
    groupsPage: "/grupper",
    sponsorsPage: "/sponsorer",
    usefulInfoPage: "/nyttig",
    kontaktPage: "/kontakt",
  }

  return singletonPaths[ref] ?? null
}

function linkToPortableTextBlock(
  link: SourceLink,
  fallbackKey: string,
): PortableTextBlock | null {
  const href = sourceLinkHref(link)
  if (!href) return null

  const markKey = `${fallbackKey}-mark`
  const isExternal = !href.startsWith("/")

  return {
    _key: fallbackKey,
    _type: "block",
    children: [
      {
        _key: `${fallbackKey}-span`,
        _type: "span",
        marks: [markKey],
        text: link.label,
      },
    ],
    markDefs: [
      {
        _key: markKey,
        _type: "link",
        href,
        style: "cta",
        target: isExternal ? "blank" : "self",
      },
    ],
    style: "normal",
  }
}

function bodyHasHref(
  body: PortableTextBlock[] | null | undefined,
  href: string,
) {
  return (body ?? []).some(
    block =>
      Array.isArray(block.markDefs) &&
      block.markDefs.some(
        mark =>
          typeof mark === "object" &&
          mark !== null &&
          "href" in mark &&
          mark.href === href,
      ),
  )
}

const editorialSection = (
  key: string,
  title: string,
  paragraphs: string[],
  links: SourceLink[] = [],
) => {
  const body = markdownToKeyedPortableText(
    paragraphs.join("\n\n"),
    `${key}-body`,
  )
  const linkBlocks = links
    .map((link, index) =>
      linkToPortableTextBlock(link, `${key}-link-${link._key ?? index}`),
    )
    .filter(block => block != null)

  return {
    _type: "editorialSection",
    _key: key,
    title,
    body: [...body, ...linkBlocks],
  }
}

type UsefulInfoSection = {
  _key?: string
  _type?: string
  title?: string | null
  body?: PortableTextBlock[] | null
  paragraphs?: string[] | null
  links?: SourceLink[] | null
  [key: string]: unknown
}

type UsefulInfoDocument = {
  sections?: UsefulInfoSection[] | null
}

export function migrateUsefulInfoEditorialSections(
  document: UsefulInfoDocument,
): { changed: boolean; sections: UsefulInfoSection[] } {
  const sections = Array.isArray(document.sections) ? document.sections : []
  let changed = false

  const nextSections = sections.map((section, index) => {
    if (section._type !== "editorialSection") return section

    const nextSection: UsefulInfoSection = { ...section }
    const paragraphs = Array.isArray(section.paragraphs)
      ? section.paragraphs.filter(Boolean)
      : []
    const body = Array.isArray(section.body) ? section.body : []

    if (body.length === 0 && paragraphs.length > 0) {
      const key = section._key ?? `editorial-section-${index}`
      nextSection.body = markdownToKeyedPortableText(
        paragraphs.join("\n\n"),
        `${key}-body`,
      )
      changed = true
    }

    if ("paragraphs" in nextSection) {
      delete nextSection.paragraphs
      changed = true
    }

    if (
      section.title === "Vergeordningen" &&
      !bodyHasHref(nextSection.body, VERGEORDNING_FORM_URL)
    ) {
      const nextLink = externalLink(
        "vergeordningen-lenke",
        "Legg inn søknad her",
        VERGEORDNING_FORM_URL,
      )
      const currentLink = nextSection.links?.[0]

      if (
        nextSection.links?.length !== 1 ||
        currentLink?._key !== nextLink._key ||
        currentLink?.label !== nextLink.label ||
        currentLink?.linkType !== nextLink.linkType ||
        currentLink?.externalUrl !== nextLink.externalUrl
      ) {
        nextSection.links = [nextLink]
        changed = true
      }
    }

    const links = Array.isArray(nextSection.links) ? nextSection.links : []
    if (links.length > 0) {
      const linkBlocks = links
        .map((link, linkIndex) =>
          bodyHasHref(nextSection.body, sourceLinkHref(link) ?? "")
            ? null
            : linkToPortableTextBlock(
                link,
                `${section._key ?? `editorial-section-${index}`}-link-${link._key ?? linkIndex}`,
              ),
        )
        .filter(block => block != null)
      nextSection.body = [...(nextSection.body ?? []), ...linkBlocks]
      delete nextSection.links
      changed = true
    } else if ("links" in nextSection) {
      delete nextSection.links
      changed = true
    }

    return nextSection
  })

  return { changed, sections: nextSections }
}

/**
 * Build the complete `usefulInfoPage` singleton from the curated seed copy and
 * the retired accessibility markdown. Deterministic `_id` + `_key`s make this
 * safe to `createOrReplace` repeatedly.
 */
export function buildUsefulInfoPageDocument(
  accessibilityMarkdown: string = ACCESSIBILITY_MARKDOWN,
) {
  const accessibility = splitAccessibilityMarkdown(accessibilityMarkdown)

  return {
    _id: USEFUL_INFO_PAGE_ID,
    _type: "usefulInfoPage",
    eyebrow: "Praktisk",
    title: "Nyttig info",
    intro:
      "Alt du trenger for å bruke huset – hvordan du kommer deg hit, hvor du kjøper billetter, hvordan du booker rom, og mer.",
    sections: [
      {
        _type: "infoAddressBlock",
        _key: "adkomst",
        heading: "Adkomst",
        body: markdownToKeyedPortableText(
          "Kvarteret ligger midt i Bergen sentrum, kort gangavstand fra Bergen stasjon, Bryggen og Universitetet i Bergen. Enkelt å nå med Bybanen eller buss.",
          "adkomst-body",
        ),
        address: "Olav Kyrres gate 49, 5015 Bergen",
        mapUrl: "https://maps.google.com/?cid=855600626603745653",
      },
      editorialSection(
        "billetter",
        "Billetter og arrangementer",
        [
          "Se hva som skjer på huset og finn oversikt over kommende arrangementer under Arrangementer. Billetter til arrangementene kjøpes direkte der.",
        ],
        [internalPageLink("billetter-lenke", "Arrangementer", "eventsPage")],
      ),
      editorialSection(
        "vergeordningen",
        "Vergeordningen",
        [
          "Vergen skal være over 25 år.",
          "Vergen skal være familie eller nær relasjon.",
          "Det må være minst én verge per mindreårig.",
          "Søknad på vergeordning må være sendt innen 1 uke før arrangementet finner sted. Vi tar forbehold om at arrangementet kan ha nådd maks antall vergeordninger.",
          "Får du avslag på din søknad har du selv ansvar for å kontakte arrangør for refusjon av billett.",
          "Brudd på vergeordningen fører til umiddelbar utvisning.",
        ],
        [
          externalLink(
            "vergeordningen-lenke",
            "Legg inn søknad her",
            VERGEORDNING_FORM_URL,
          ),
        ],
      ),
      editorialSection(
        "booking",
        "Booking",
        [
          "Skal du arrangere noe på Kvarteret? Enten det er fest, møte, konsert eller noe helt eget, hjelper vi deg gjerne i gang. Gå til Booking for å sjekke ledige rom og sende inn forespørsel – vi gleder oss til å høre fra deg!",
        ],
        [internalPathLink("booking-lenke", "Booking", "/rom/book")],
      ),
      editorialSection("gjenglemt", "Gjenglemt", [
        "Har du mistet noe på Kvarteret? Alt vi finner tar vi vare på i resepsjonen i 3 uker. Etter dette donerer vi det videre til Fretex, mens verdifulle gjenstander leveres til politiet. Ta kontakt eller stikk innom, så hjelper vi deg å lete!",
      ]),
      editorialSection(
        "servering",
        "Servering",
        [
          "Stjernesalen, Kvarterets kafé i 2. etasje, byr på gode måltider og digg kaffe alle hverdager frem til kl. 19:00.",
          "Trenger du mat til et arrangement? Kjøkkenet vårt skreddersyr bestillinger til både små og store tilstelninger – se catering.",
        ],
        [internalPathLink("servering-lenke", "Catering", "/catering")],
      ),
      {
        _type: "infoAccordionBlock",
        _key: "tilgjengelighet",
        heading: accessibility.heading,
        intro: accessibility.intro,
        items: accessibility.items.map((item, index) => ({
          _type: "infoAccordionItem",
          _key: `tilgjengelighet-${index}`,
          title: item.title,
          body: markdownToKeyedPortableText(
            item.markdown,
            `tilgjengelighet-${index}`,
          ),
        })),
      },
    ],
  }
}

type NavbarDocument = {
  _id: string
  _type: string
  items?: unknown
}

/**
 * Append a top-level "Nyttig info" nav item unless one already points at
 * `/nyttig`. Returns the full items array to `set`, or `null` if unchanged.
 */
export function buildNavbarNyttigItems(
  document: NavbarDocument,
): unknown[] | null {
  const items = Array.isArray(document.items) ? document.items : []
  const alreadyPresent = items.some(
    item =>
      typeof item === "object" &&
      item !== null &&
      "href" in item &&
      (item as { href?: unknown }).href === "/nyttig",
  )

  if (alreadyPresent) return null

  return [
    ...items,
    {
      _type: "navItem",
      _key: "nyttig-info",
      label: "Nyttig info",
      href: "/nyttig",
    },
  ]
}
