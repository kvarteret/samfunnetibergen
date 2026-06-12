import {
  CalendarIcon,
  CogIcon,
  ComponentIcon,
  DocumentIcon,
  EarthGlobeIcon,
  EnvelopeIcon,
  LinkIcon,
  MenuIcon,
  MobileDeviceIcon,
  PauseIcon,
  StarIcon,
  TagIcon,
  TextIcon,
  UsersIcon,
} from "@sanity/icons"
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list"
import type { StructureBuilder, StructureResolver } from "sanity/structure"

export { singletonTypeNames } from "./documentTypes"

const STRUCTURE_API_VERSION = "2025-02-19"
const SERVICE_PAGE_SLUGS = ["catering", "silent-disco"]
const POLICY_PAGE_SLUGS = [
  "aldersgrense",
  "avbestillingsvilkar",
  "krav-promo",
  "leievilkaar",
  "sporsmal-booking",
  "vergeordningen",
  "vilkar-for-leie-av-karaoke",
]
const INFORMATION_PAGE_SLUGS = ["om-kvarteret"]

function singletonListItem(
  S: StructureBuilder,
  typeName: string,
  title: string,
  icon?: React.ComponentType,
) {
  return S.listItem()
    .title(title)
    .icon(icon ?? DocumentIcon)
    .child(S.document().schemaType(typeName).documentId(typeName).title(title))
}

function pageListItem(
  S: StructureBuilder,
  id: string,
  title: string,
  slugs: string[],
) {
  return S.listItem()
    .id(id)
    .title(title)
    .icon(DocumentIcon)
    .child(
      S.documentList()
        .apiVersion(STRUCTURE_API_VERSION)
        .title(title)
        .schemaType("page")
        .filter("_type == 'page' && slug.current in $slugs")
        .params({ slugs })
        .defaultOrdering([{ field: "title", direction: "asc" }]),
    )
}

function seoAuditItems(S: StructureBuilder) {
  const pageLikeTypes =
    '["homePage", "eventsPage", "roomsPage", "groupsPage", "sponsorsPage", "kontaktPage", "page", "arrangement", "room", "studentGroup"]'

  return [
    S.listItem()
      .id("seo-hidden-pages")
      .title("Skjult fra søkemotorer")
      .child(
        S.documentList()
          .apiVersion(STRUCTURE_API_VERSION)
          .title("Skjult fra søkemotorer")
          .filter(`_type in ${pageLikeTypes} && noIndex == true`),
      ),
  ]
}

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title("Samfunnet i Bergen")
    .items([
      singletonListItem(S, "homePage", "Hovedside", DocumentIcon),

      S.divider(),

      S.listItem()
        .title("Program")
        .icon(CalendarIcon)
        .child(
          S.list()
            .title("Program")
            .items([
              singletonListItem(
                S,
                "eventsPage",
                "Innhold på arrangementsiden",
                DocumentIcon,
              ),
              S.divider(),
              S.listItem()
                .id("arrangement-pending")
                .title("Venter på godkjenning")
                .icon(CalendarIcon)
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .title("Venter på godkjenning")
                    .filter(
                      '_type == "arrangement" && approvalStatus == "pending"',
                    ),
                ),
              S.listItem()
                .id("arrangement-upcoming")
                .title("Kommende")
                .icon(CalendarIcon)
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .title("Kommende arrangementer")
                    .filter(
                      '_type == "arrangement" && approvalStatus == "approved" && count(dates[startDate >= string::split(now(), "T")[0]]) > 0',
                    )
                    .defaultOrdering([
                      { field: "dates.0.startDate", direction: "asc" },
                    ]),
                ),
              S.listItem()
                .id("arrangement-paused")
                .title("Satt på pause")
                .icon(PauseIcon)
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .title("Arrangementer satt på pause")
                    .filter(
                      '_type == "arrangement" && approvalStatus == "paused"',
                    ),
                ),
              S.listItem()
                .id("arrangement-past")
                .title("Tidligere")
                .icon(CalendarIcon)
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .title("Tidligere arrangementer")
                    .filter(
                      '_type == "arrangement" && approvalStatus == "approved" && count(dates[startDate >= string::split(now(), "T")[0]]) == 0',
                    )
                    .defaultOrdering([
                      { field: "dates.0.startDate", direction: "desc" },
                    ]),
                ),
              S.listItem()
                .id("arrangement-rejected")
                .title("Avvist")
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .title("Avviste arrangementer")
                    .filter(
                      '_type == "arrangement" && approvalStatus == "rejected"',
                    ),
                ),
              S.listItem()
                .id("arrangement-archived")
                .title("Arkivert")
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .title("Arkiverte arrangementer")
                    .filter(
                      '_type == "arrangement" && approvalStatus == "archived"',
                    ),
                ),
              S.documentTypeListItem("arrangement")
                .title("Alle arrangementer")
                .icon(CalendarIcon),
              S.divider(),
              orderableDocumentListDeskItem({
                S,
                context,
                type: "eventTaxonomyGroup",
                id: "orderable-event-taxonomy-group",
                title: "Kategorier",
                icon: TagIcon,
              }),
              orderableDocumentListDeskItem({
                S,
                context,
                type: "eventType",
                id: "orderable-event-type-all",
                title: "Arrangementtyper",
                icon: TagIcon,
              }),
            ]),
        ),

      S.listItem()
        .title("Rom")
        .icon(ComponentIcon)
        .child(
          S.list()
            .title("Rom")
            .items([
              singletonListItem(
                S,
                "roomsPage",
                "Innhold på romsiden",
                DocumentIcon,
              ),
              orderableDocumentListDeskItem({
                S,
                context,
                type: "room",
                id: "orderable-room-all",
                title: "Rom",
              }),
              pageListItem(
                S,
                "room-service-pages",
                "Tjenester",
                SERVICE_PAGE_SLUGS,
              ),
              pageListItem(
                S,
                "room-policy-pages",
                "Retningslinjer og vilkår",
                POLICY_PAGE_SLUGS,
              ),
              singletonListItem(
                S,
                "siteMetadata",
                "Åpningstider og stengte dager",
                CogIcon,
              ),
            ]),
        ),

      S.listItem()
        .title("Grupper og frivillighet")
        .icon(UsersIcon)
        .child(
          S.list()
            .title("Grupper og frivillighet")
            .items([
              singletonListItem(
                S,
                "groupsPage",
                "Innhold på gruppesiden",
                DocumentIcon,
              ),
              orderableDocumentListDeskItem({
                S,
                context,
                type: "studentGroup",
                id: "orderable-student-group-all",
                title: "Grupper",
                filter: '_type == "studentGroup" && !defined(parentGroup)',
              }),
              orderableDocumentListDeskItem({
                S,
                context,
                type: "studentGroup",
                id: "orderable-student-subgroup-all",
                title: "Undergrupper",
                filter: '_type == "studentGroup" && defined(parentGroup)',
              }),
            ]),
        ),

      S.listItem()
        .title("Sider")
        .icon(DocumentIcon)
        .child(
          S.list()
            .title("Sider")
            .items([
              pageListItem(
                S,
                "information-pages",
                "Om og informasjon",
                INFORMATION_PAGE_SLUGS,
              ),
              pageListItem(S, "service-pages", "Tjenester", SERVICE_PAGE_SLUGS),
              pageListItem(
                S,
                "policy-pages",
                "Retningslinjer og vilkår",
                POLICY_PAGE_SLUGS,
              ),
              singletonListItem(S, "sponsorsPage", "Sponsorer", StarIcon),
              singletonListItem(S, "kontaktPage", "Kontakt", EnvelopeIcon),
              S.divider(),
              S.documentTypeListItem("page")
                .title("Alle sider")
                .icon(DocumentIcon),
            ]),
        ),

      S.listItem()
        .title("Navigasjon og kanaler")
        .icon(MenuIcon)
        .child(
          S.list()
            .title("Navigasjon og kanaler")
            .items([
              singletonListItem(S, "navbar", "Hovednavigasjon", MenuIcon),
              singletonListItem(S, "footer", "Bunntekst", TextIcon),
              singletonListItem(S, "linkInBio", "Link-i-bio", LinkIcon),
            ]),
        ),

      S.listItem()
        .title("App og internt innhold")
        .icon(MobileDeviceIcon)
        .child(
          S.list()
            .title("App og internt innhold")
            .items([
              singletonListItem(
                S,
                "internbevisPage",
                "Internbevis",
                MobileDeviceIcon,
              ),
              S.documentTypeListItem("internbevisBenefit")
                .title("Frivilligfordeler")
                .icon(StarIcon),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title("Nettstedsinnstillinger")
        .icon(CogIcon)
        .child(
          S.list()
            .title("Nettstedsinnstillinger")
            .items([
              singletonListItem(
                S,
                "siteMetadata",
                "Identitet, SEO og deling",
                EarthGlobeIcon,
              ),
              S.divider(),
              ...seoAuditItems(S),
            ]),
        ),
    ])
