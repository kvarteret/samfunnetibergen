import { icons } from "@sanity/icons"
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list"
import type { StructureBuilder, StructureResolver } from "sanity/structure"

export { singletonTypeNames } from "./documentTypes"

const STRUCTURE_API_VERSION = "2025-02-19"
// A materialized series runs dry once its last generated child passes; flag
// series whose newest child is inside this lead time so editors regenerate.
const SERIES_REGEN_LEAD_WEEKS = 8

function seriesRegenHorizon(): string {
  const horizon = new Date()
  horizon.setDate(horizon.getDate() + SERIES_REGEN_LEAD_WEEKS * 7)
  return horizon.toISOString().split("T")[0]!
}

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
    .icon(icon ?? icons.document)
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
    .icon(icons.document)
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
    '["homePage", "eventsPage", "roomsPage", "groupsPage", "sponsorsPage", "usefulInfoPage", "kontaktPage", "page", "arrangement", "room", "studentGroup"]'

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
      singletonListItem(S, "homePage", "Hovedside", icons.document),

      S.divider(),

      S.listItem()
        .title("Program")
        .icon(icons.calendar)
        .child(
          S.list()
            .title("Program")
            .items([
              singletonListItem(
                S,
                "eventsPage",
                "Innhold på arrangementsiden",
                icons.document,
              ),
              S.divider(),
              S.listItem()
                .id("arrangement-pending")
                .title("Venter på godkjenning")
                .icon(icons.calendar)
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
                .icon(icons.calendar)
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
                .id("arrangement-promoted")
                .title("Promotert på forsiden")
                .icon(icons.calendar)
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .title("Promotert på forsiden")
                    .filter(
                      '_type == "arrangement" && approvalStatus == "approved" && isPromoted == true',
                    )
                    .defaultOrdering([
                      { field: "dates.0.startDate", direction: "asc" },
                    ]),
                ),
              S.listItem()
                .id("arrangement-paused")
                .title("Satt på pause")
                .icon(icons.pause)
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
                .icon(icons.calendar)
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
              S.divider(),
              S.listItem()
                .id("arrangement-series-parents")
                .title("Serier")
                .icon(icons.sync)
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .title("Serier")
                    .filter(
                      '_type == "arrangement" && eventKind == "seriesParent"',
                    )
                    .defaultOrdering([{ field: "title", direction: "asc" }]),
                ),
              S.listItem()
                .id("arrangement-festival-parents")
                .title("Festivaler")
                .icon(icons.star)
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .title("Festivaler")
                    .filter(
                      '_type == "arrangement" && eventKind == "festivalParent"',
                    )
                    .defaultOrdering([{ field: "title", direction: "asc" }]),
                ),
              S.listItem()
                .id("arrangement-generated-pending")
                .title("Genererte – venter på godkjenning")
                .icon(icons.clock)
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .title("Genererte – venter på godkjenning")
                    .filter(
                      '_type == "arrangement" && eventKind in ["seriesInstance", "festivalSession"] && approvalStatus == "pending"',
                    )
                    .defaultOrdering([
                      { field: "dates.0.startDate", direction: "asc" },
                    ]),
                ),
              S.listItem()
                .id("arrangement-cancelled-postponed")
                .title("Avlyst eller utsatt")
                .icon(icons["warning-outline"])
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .title("Avlyst eller utsatt")
                    .filter(
                      '_type == "arrangement" && eventStatus in ["cancelled", "postponed"]',
                    )
                    .defaultOrdering([
                      { field: "dates.0.startDate", direction: "asc" },
                    ]),
                ),
              S.listItem()
                .id("arrangement-needs-regeneration")
                .title("Serier som må forlenges")
                .icon(icons.reset)
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .title("Serier som må forlenges")
                    .filter(
                      '_type == "arrangement" && eventKind == "seriesParent" && count(*[_type == "arrangement" && parentEvent._ref == ^._id && dates[0].startDate > $horizon]) == 0',
                    )
                    .params({ horizon: seriesRegenHorizon() })
                    .defaultOrdering([{ field: "title", direction: "asc" }]),
                ),
              S.divider(),
              S.documentTypeListItem("arrangement")
                .title("Alle arrangementer")
                .icon(icons.calendar),
              S.divider(),
              orderableDocumentListDeskItem({
                S,
                context,
                type: "eventTaxonomyGroup",
                id: "orderable-event-taxonomy-group",
                title: "Kategorier",
                icon: icons.tag,
              }),
              orderableDocumentListDeskItem({
                S,
                context,
                type: "eventType",
                id: "orderable-event-type-all",
                title: "Arrangementtyper",
                icon: icons.tag,
              }),
            ]),
        ),

      S.listItem()
        .title("Rom")
        .icon(icons.component)
        .child(
          S.list()
            .title("Rom")
            .items([
              singletonListItem(
                S,
                "roomsPage",
                "Innhold på romsiden",
                icons.document,
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
                icons.cog,
              ),
            ]),
        ),

      S.listItem()
        .title("Grupper og frivillighet")
        .icon(icons.users)
        .child(
          S.list()
            .title("Grupper og frivillighet")
            .items([
              singletonListItem(
                S,
                "groupsPage",
                "Innhold på gruppesiden",
                icons.document,
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
        .icon(icons.document)
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
              singletonListItem(S, "sponsorsPage", "Sponsorer", icons.star),
              singletonListItem(
                S,
                "usefulInfoPage",
                "Nyttig info",
                icons["info-outline"],
              ),
              singletonListItem(S, "kontaktPage", "Kontakt", icons.envelope),
              S.divider(),
              S.documentTypeListItem("page")
                .title("Alle sider")
                .icon(icons.document),
            ]),
        ),

      S.listItem()
        .title("Navigasjon og kanaler")
        .icon(icons.menu)
        .child(
          S.list()
            .title("Navigasjon og kanaler")
            .items([
              singletonListItem(S, "navbar", "Hovednavigasjon", icons.menu),
              singletonListItem(S, "footer", "Bunntekst", icons.text),
              singletonListItem(S, "linkInBio", "Link-i-bio", icons.link),
            ]),
        ),

      S.listItem()
        .title("App og internt innhold")
        .icon(icons["mobile-device"])
        .child(
          S.list()
            .title("App og internt innhold")
            .items([
              singletonListItem(
                S,
                "internbevisPage",
                "Internbevis",
                icons["mobile-device"],
              ),
              S.documentTypeListItem("internbevisBenefit")
                .title("Frivilligfordeler")
                .icon(icons.star),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title("Nettstedsinnstillinger")
        .icon(icons.cog)
        .child(
          S.list()
            .title("Nettstedsinnstillinger")
            .items([
              singletonListItem(
                S,
                "siteMetadata",
                "Identitet, SEO og deling",
                icons["earth-globe"],
              ),
              S.divider(),
              ...seoAuditItems(S),
            ]),
        ),
    ])
