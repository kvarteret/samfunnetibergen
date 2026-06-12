import { arrangement } from "./documents/arrangement"
import { eventTaxonomyGroup } from "./documents/eventTaxonomyGroup"
import { eventType } from "./documents/eventType"
import { footer, footerSocialLinkSchema } from "./documents/footer"
import { internbevisBenefit } from "./documents/internbevisBenefit"
import {
  contactGroupSchema,
  contactPersonSchema,
  kontaktPage,
} from "./documents/kontaktPage"
import { navbar, navItemSchema } from "./documents/navbar"
import { page } from "./documents/page"
import { room } from "./documents/room"
import { eventsPage } from "./documents/singletons/eventsPage"
import { groupsPage } from "./documents/singletons/groupsPage"
import { homePage } from "./documents/singletons/homePage"
import { internbevisPage } from "./documents/singletons/internbevisPage"
import { linkInBio } from "./documents/singletons/linkInBio"
import { roomsPage } from "./documents/singletons/roomsPage"
import { siteMetadata } from "./documents/singletons/siteMetadata"
import { sponsorsPage } from "./documents/singletons/sponsorsPage"
import { studentGroup } from "./documents/studentGroup"
import { duration, timeValue } from "./objects/duration"
import { editorialSection } from "./objects/editorialSection"
import { arrangementDate } from "./objects/eventDate"
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
  menuItem,
  menuSection,
  menuSchema,
  contactPersonSchema,
  contactGroupSchema,
  footerSocialLinkSchema,
  arrangementDate,

  // Documents
  room,
  studentGroup,
  kontaktPage,
  page,
  navbar,
  eventTaxonomyGroup,
  eventType,
  arrangement,
  internbevisBenefit,

  // Singletons
  footer,
  siteMetadata,
  homePage,
  internbevisPage,
  eventsPage,
  roomsPage,
  groupsPage,
  sponsorsPage,
  linkInBio,
]
