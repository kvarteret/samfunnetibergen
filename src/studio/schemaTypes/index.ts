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
import { groupsPage } from "./documents/singletons/groupsPage"
import { homePage } from "./documents/singletons/homePage"
import { linkInBio } from "./documents/singletons/linkInBio"
import { roomsPage } from "./documents/singletons/roomsPage"
import { siteMetadata } from "./documents/singletons/siteMetadata"
import { sponsorsPage } from "./documents/singletons/sponsorsPage"
import { usefulInfoPage } from "./documents/singletons/usefulInfoPage"
import { studentGroup } from "./documents/studentGroup"
import { duration, timeValue } from "./objects/duration"
import { editorialSection } from "./objects/editorialSection"
import { arrangementDate } from "./objects/eventDate"
import {
  infoAccordionBlock,
  infoAccordionItem,
} from "./objects/infoAccordionBlock"
import { infoAddressBlock } from "./objects/infoAddressBlock"
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
  infoAddressBlock,
  infoAccordionItem,
  infoAccordionBlock,
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
  roomsPage,
  groupsPage,
  sponsorsPage,
  usefulInfoPage,
  linkInBio,
]
