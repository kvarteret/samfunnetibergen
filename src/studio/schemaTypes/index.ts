import { arrangement } from "./documents/event";
import { eventTaxonomyGroup } from "./documents/eventTaxonomyGroup";
import { eventType } from "./documents/eventType";
import { footer, footerSocialLinkSchema } from "./documents/footer";
import { gruppe } from "./documents/gruppe";
import {
  contactGroupSchema,
  contactPersonSchema,
  kontaktPage,
} from "./documents/kontaktPage";
import { navbar, navItemSchema } from "./documents/navbar";
import { page } from "./documents/page";
import { room } from "./documents/room";
import {
  eventsPage,
  groupsPage,
  homePage,
  internbevisBenefit,
  linkInBio,
  roomsPage,
  siteMetadata,
  sponsorsPage,
} from "./documents/singletons";
import { duration, timeValue } from "./objects/duration";
import { editorialSection } from "./objects/editorialSection";
import { arrangementDate } from "./objects/eventDate";
import { menuItem, menuSchema, menuSection } from "./objects/menu";
import { openingHours, openingHoursRow } from "./objects/openingHours";
import { portableTextContent } from "./objects/portableText";
import { sourcedImage } from "./objects/sourcedImage";
import { sourceLink } from "./objects/sourceLink";

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
  internbevisBenefit,
  footerSocialLinkSchema,
  arrangementDate,

  // Documents
  room,
  gruppe,
  kontaktPage,
  page,
  navbar,
  eventTaxonomyGroup,
  eventType,
  arrangement,

  // Singletons
  footer,
  siteMetadata,
  homePage,
  eventsPage,
  roomsPage,
  groupsPage,
  sponsorsPage,
  linkInBio,
];
