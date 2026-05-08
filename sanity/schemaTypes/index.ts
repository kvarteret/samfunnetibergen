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
    volunteerGroup,
    volunteerGroupSummary,
} from "./documents/volunteerContent"
import { duration, timeValue } from "./objects/duration"
import { editorialSection } from "./objects/editorialSection"
import { menuItem, menuSchema, menuSection } from "./objects/menu"
import { openingHours, openingHoursRow } from "./objects/openingHours"
import { portableTextContent } from "./objects/portableText"
import { sourcedImage } from "./objects/sourcedImage"
import { sourceLink } from "./objects/sourceLink"

export const schemaTypes = [
    // Objects
    sourceLink,
    sourcedImage,
    editorialSection,
    timeValue,
    duration,
    openingHoursRow,
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

    // Documents
    room,
    gruppe,
    homeBar,
    kontaktPage,
    volunteerGroup,
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
