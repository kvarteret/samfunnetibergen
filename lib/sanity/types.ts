import type { ClientReturn } from "next-sanity"

import type {
    blifrivilligPageNbQuery,
    eventsPageContentNbQuery,
    groupsPageQuery,
    homePageNbQuery,
    navbarQuery,
    pageBySlugQuery,
    roomBySlugQuery,
    roomsPageQuery,
    roomsQuery,
    siteMetadataNbQuery,
    sponsorsPageQuery,
    studentGroupBySlugQuery,
    studentGroupsQuery,
} from "./queries"

export type EventsPageContent = NonNullable<ClientReturn<typeof eventsPageContentNbQuery>>

export type SiteMetadataContent = NonNullable<ClientReturn<typeof siteMetadataNbQuery>>

export type HomePageContent = NonNullable<ClientReturn<typeof homePageNbQuery>>

export type EditorialSection = NonNullable<
    NonNullable<ClientReturn<typeof roomsPageQuery>>["sections"]
>[number]

export type SourcedImage = NonNullable<
    NonNullable<ClientReturn<typeof roomBySlugQuery>>["images"]
>[number]

export type RoomsPageContent = NonNullable<ClientReturn<typeof roomsPageQuery>>

export type RoomSummary = ClientReturn<typeof roomsQuery>[number]

export type RoomDetail = NonNullable<ClientReturn<typeof roomBySlugQuery>>

export type SponsorsPageContent = NonNullable<ClientReturn<typeof sponsorsPageQuery>>

export type GroupsPageContent = NonNullable<ClientReturn<typeof groupsPageQuery>>

export type StudentGroupSummary = ClientReturn<typeof studentGroupsQuery>[number]

export type StudentGroupDetail = NonNullable<ClientReturn<typeof studentGroupBySlugQuery>>

export type BlifrivilligPageContent = NonNullable<ClientReturn<typeof blifrivilligPageNbQuery>>

export type PageContent = NonNullable<ClientReturn<typeof pageBySlugQuery>>

export type NavbarContent = NonNullable<ClientReturn<typeof navbarQuery>>

export type NavItem = NonNullable<NavbarContent["items"]>[number]

export type NavGroup = NonNullable<NavItem["children"]>[number]

export type NavLeaf = NonNullable<NavGroup["items"]>[number]
