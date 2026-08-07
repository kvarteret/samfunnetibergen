import type { NextConfig } from "next"

type NextRedirect = Awaited<
  ReturnType<NonNullable<NextConfig["redirects"]>>
>[number]

export const VOLUNTEER_LISTING_PATH = "/bli-frivillig"

export const VOLUNTEER_PAGE_TITLE = "Bli frivillig"
export const VOLUNTEER_PAGE_DESCRIPTION =
  "Bli frivillig i Bergen og finn studentgruppen som passer for deg. Se mulighetene i Samfunnet i Bergen og meld interesse i dag."
export const VOLUNTEER_PAGE_INTRO =
  "Vil du bli frivillig i Bergen? Finn en studentgruppe som passer interessene dine, bli kjent med studentmiljøet og meld interesse."

export const VOLUNTEER_CANONICAL_URL =
  "https://samfunnetibergen.no/nb/bli-frivillig"

export const VOLUNTEER_REDIRECTS = [
  {
    source: "/:path*",
    has: [
      {
        type: "host" as const,
        value: "(?:www\\.)?blifrivillig\\.no",
      },
    ],
    destination: VOLUNTEER_CANONICAL_URL,
    permanent: true,
  },
  {
    source: "/grupper",
    destination: "/nb/bli-frivillig",
    permanent: true,
  },
  {
    source: "/blifrivillig",
    destination: "/nb/bli-frivillig",
    permanent: true,
  },
  {
    source: "/:locale/grupper",
    destination: "/:locale/bli-frivillig",
    permanent: true,
  },
  {
    source: "/:locale/blifrivillig",
    destination: "/:locale/bli-frivillig",
    permanent: true,
  },
  {
    source: "/komiteer",
    destination: "/nb/bli-frivillig",
    permanent: true,
  },
  {
    source: "/bli-aktiv",
    destination: "/nb/bli-frivillig",
    permanent: true,
  },
] satisfies NextRedirect[]
