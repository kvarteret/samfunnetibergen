export type HomePageContent = {
    badge: string
    heroDescription: string
    heroDescriptionFusion: string
    eventsLink: string
}

export type EventsPageContent = {
    eyebrow: string
    title: string
    description: string
}

export type HomeBarContent = {
    name: string
    description: string
    imageUrl?: string | null
}

export type SiteMetadataContent = {
    siteTitle?: string
    siteDescription?: string
    homeTitle?: string
    homeDescription?: string
    eventsTitle?: string
    eventsDescription?: string
    volunteerSignupTitle?: string
    volunteerSignupDescription?: string
    groupPageTitle?: string
    groupPageDescription?: string
}
