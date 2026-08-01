import { icons } from "@sanity/icons"
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list"
import type { StructureBuilder, StructureResolver } from "sanity/structure"

import { ArrangementsPane } from "./components/ArrangementBrowser"
import { PromotedArrangementsPane } from "./components/PromotedArrangementList"
import { RequestCountIcon } from "./components/RequestCountIcon"

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

type ArrangementListOptions = {
  id: string
  title: string
  icon?: React.ComponentType
  filter: string
  params?: Record<string, unknown>
  order?: { field: string; direction: "asc" | "desc" }
}

function arrangementList(S: StructureBuilder, opts: ArrangementListOptions) {
  let list = S.documentList()
    .apiVersion(STRUCTURE_API_VERSION)
    .title(opts.title)
    .filter(`_type == "arrangement" && ${opts.filter}`)
  if (opts.params) list = list.params(opts.params)
  if (opts.order) list = list.defaultOrdering([opts.order])
  return S.listItem()
    .id(opts.id)
    .title(opts.title)
    .icon(opts.icon ?? icons.calendar)
    .child(list)
}

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title("Samfunnet i Bergen")
    .items([
      S.listItem()
        .title("Arrangementer")
        .icon(icons.calendar)
        .child(
          S.list()
            .title("Arrangementer")
            .items([
              S.listItem()
                .id("arrangement-requests")
                .title("Requests")
                .icon(RequestCountIcon)
                .child(
                  S.list()
                    .id("arrangement-request-lists")
                    .title("Requests")
                    .items([
                      arrangementList(S, {
                        id: "arrangement-pending",
                        title: "Requests",
                        icon: RequestCountIcon,
                        filter:
                          'defined(submittedByEmail) && coalesce(approvalStatus, "pending") == "pending"',
                        order: {
                          field: "dates[0].startDate",
                          direction: "asc",
                        },
                      }),
                      arrangementList(S, {
                        id: "arrangement-rejected-requests",
                        title: "Avvist",
                        icon: icons["warning-outline"],
                        filter:
                          'defined(submittedByEmail) && approvalStatus == "rejected"',
                      }),
                    ]),
                ),
              S.listItem()
                .id("arrangement-browse")
                .title("Arrangementer")
                .icon(icons.calendar)
                .child(
                  S.component()
                    .id("arrangement-browser-pane")
                    .title("Arrangementer")
                    .component(ArrangementsPane),
                ),
              S.listItem()
                .id("arrangement-promoted")
                .title("Fremhevede")
                .icon(icons.star)
                .child(
                  S.component()
                    .id("arrangement-promoted-pane")
                    .title("Fremhevede arrangementer")
                    .component(PromotedArrangementsPane),
                ),
            ]),
        ),

      S.listItem()
        .title("Åpningstider")
        .icon(icons.clock)
        .child(
          S.list()
            .title("Åpningstider")
            .items([
              singletonListItem(
                S,
                "siteMetadata",
                "Primære åpningstider",
                icons.clock,
              ),
              orderableDocumentListDeskItem({
                S,
                context,
                type: "room",
                id: "opening-hours-room-all",
                title: "Rom",
                icon: icons.component,
                filter:
                  '_type == "room" && slug.current in ["halvtimen", "grondahls", "stjernesalen"]',
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
        .id("settings")
        .title("Innstillinger")
        .icon(icons.cog)
        .child(
          S.list()
            .id("settings-list")
            .title("Innstillinger")
            .items([
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
              S.documentTypeListItem("internbevisBenefit")
                .title("Frivilligfordeler")
                .icon(icons.star),
            ]),
        ),
    ])
