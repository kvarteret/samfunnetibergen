import { calloutBlock } from "./blocks/calloutBlock"
import { heroBlock } from "./blocks/heroBlock"
import { imageBlock } from "./blocks/imageBlock"
import { richTextBlock } from "./blocks/richTextBlock"
import { gruppe } from "./documents/gruppe"
import { navbar, navItemSchema } from "./documents/navbar"
import { page } from "./documents/page"
import { room } from "./documents/room"
import { eventsPage, groupsPage, homePage, roomsPage, siteMetadata } from "./documents/singletons"
import { editorialSection } from "./objects/editorialSection"
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

    // Page builder blocks
    heroBlock,
    richTextBlock,
    imageBlock,
    calloutBlock,

    // Documents
    room,
    gruppe,
    page,
    navbar,

    // Singletons
    siteMetadata,
    homePage,
    eventsPage,
    roomsPage,
    groupsPage,
]
