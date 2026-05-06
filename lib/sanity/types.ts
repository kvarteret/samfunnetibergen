import type { ClientReturn } from "next-sanity"

import type {
    eventsPageContentNbQuery,
    homeBarsNbQuery,
    homePageContentNbQuery,
    siteMetadataNbQuery,
} from "./query-definitions"

export type HomePageContent = NonNullable<ClientReturn<typeof homePageContentNbQuery>>

export type EventsPageContent = NonNullable<ClientReturn<typeof eventsPageContentNbQuery>>

export type HomeBarContent = ClientReturn<typeof homeBarsNbQuery>[number]

export type SiteMetadataContent = NonNullable<ClientReturn<typeof siteMetadataNbQuery>>
