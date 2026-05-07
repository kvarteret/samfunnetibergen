import { calloutBlock } from "./blocks/calloutBlock"
import { heroBlock } from "./blocks/heroBlock"
import { imageBlock } from "./blocks/imageBlock"
import { richTextBlock } from "./blocks/richTextBlock"
import { gruppe } from "./documents/gruppe"
import { homeBar } from "./documents/homeBar"
import { contactGroupSchema, contactPersonSchema, kontaktPage } from "./documents/kontaktPage"
import { navbar, navItemSchema } from "./documents/navbar"
import { page } from "./documents/page"
import { room } from "./documents/room"
import {
    blifrivilligPage,
    eventsPage,
    groupsPage,
    homePage,
    internbevisBenefit,
    roomsPage,
    siteMetadata,
} from "./documents/singletons"
import {
    groupSectionSchema,
    launchGroup,
    volunteerGroupSummary,
} from "./documents/volunteerContent"
import { editorialSection } from "./objects/editorialSection"
import { menuItem, menuSchema, menuSection } from "./objects/menu"
import { openingHours, openingHoursDaySchema } from "./objects/openingHours"
import { portableTextContent } from "./objects/portableText"
import { sourcedImage } from "./objects/sourcedImage"
import { sourceLink } from "./objects/sourceLink"

export const schemaTypes = [
    // Objects
    sourceLink,
    sourcedImage,
    editorialSection,
    openingHoursDaySchema,
    openingHours,
    portableTextContent,
    navItemSchema,
    groupSectionSchema,
    menuItem,
    menuSection,
    menuSchema,
    contactPersonSchema,
    contactGroupSchema,
    internbevisBenefit,

    // Page builder blocks
    heroBlock,
    richTextBlock,
    imageBlock,
    calloutBlock,

    // Documents
    room,
    gruppe,
    homeBar,
    kontaktPage,
    launchGroup,
    volunteerGroupSummary,
    page,
    navbar,

    // Singletons
    siteMetadata,
    homePage,
    eventsPage,
    roomsPage,
    groupsPage,
    blifrivilligPage,
]
