export type NavigationLinkKind = "localized" | "plain" | "external"

export type NavigationLink = {
  id: string
  label: string
  href: string | null
  kind?: NavigationLinkKind
}

export type NavigationGroup = {
  id: string
  label?: string | null
  links: NavigationLink[]
}

type MobileNavigation = {
  href: string | null
  groups: NavigationGroup[]
}

export type NavigationItem = NavigationLink & {
  children?: NavigationGroup[]
  highlight?: boolean
  hideDesktopArrow?: boolean
  includePaperMenu?: boolean
  mobile?: MobileNavigation
}

export type NavigationTranslationKey =
  | "volunteer"
  | "events"
  | "booking"
  | "allRooms"
  | "karaoke"
  | "useful"
  | "overview"
  | "vergeordning"
  | "more"
  | "contact"
  | "sponsors"
  | "linkInBio"
  | "publicDocuments"

export type NavigationTranslator = (key: NavigationTranslationKey) => string

function localized(id: string, label: string, href: string): NavigationLink {
  return { id, label, href, kind: "localized" }
}

function plain(id: string, label: string, href: string): NavigationLink {
  return { id, label, href, kind: "plain" }
}

function external(id: string, label: string, href: string): NavigationLink {
  return { id, label, href, kind: "external" }
}

export function buildNavigation(
  t: NavigationTranslator,
  vergeordningHref: string | null,
): NavigationItem[] {
  const karaoke = localized("karaoke", t("karaoke"), "/karaoke")
  const bookingRooms = localized("booking-rooms", t("allRooms"), "/rom")
  const usefulOverview = localized("useful-overview", t("overview"), "/nyttig")
  const vergeordning = vergeordningHref
    ? localized("useful-vergeordning", t("vergeordning"), vergeordningHref)
    : null

  return [
    {
      ...localized("volunteer", t("volunteer"), "/grupper"),
      highlight: true,
    },
    localized("events", t("events"), "/arrangementer"),
    {
      ...localized("booking", t("booking"), "/rom"),
      hideDesktopArrow: true,
      children: [{ id: "booking-links", links: [karaoke] }],
      mobile: {
        href: null,
        groups: [
          {
            id: "mobile-booking-links",
            links: [bookingRooms, karaoke],
          },
        ],
      },
    },
    {
      ...localized("useful", t("useful"), "/nyttig"),
      mobile: {
        href: null,
        groups: [
          {
            id: "mobile-useful-links",
            links: [usefulOverview, ...(vergeordning ? [vergeordning] : [])],
          },
        ],
      },
    },
    {
      id: "more",
      label: t("more"),
      href: null,
      includePaperMenu: true,
      children: [
        {
          id: "more-links",
          links: [
            localized("contact", t("contact"), "/kontakt"),
            localized("sponsors", t("sponsors"), "/sponsorer"),
            plain("link-in-bio", t("linkInBio"), "/linkibio"),
            external(
              "public-documents",
              t("publicDocuments"),
              "https://drive.google.com/drive/folders/0B0B-uQZgv7V3NHY0V0lXQUQ2elU?resourcekey=0-YYvE5cj9cKfVcTP4_p0w0Q",
            ),
          ],
        },
      ],
    },
  ]
}
