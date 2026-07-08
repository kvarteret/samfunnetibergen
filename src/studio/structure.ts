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

// ADR 006: browse lists show author-facing documents only. Generated
// occurrences (seriesInstance / festivalSession) are reached through their
// parent's "Instanser" drill-in, so they never spam the flat lists.
const BROWSE_EVENT_KINDS = `coalesce(eventKind, "single") in ["single", "seriesParent", "festivalParent"]`
const TODAY = 'string::split(now(), "T")[0]'

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

// A parent (series/festival) opens into its own editor plus a date-ordered
// list of its generated occurrences, so an editor edits or cancels one
// occurrence from inside the parent rather than hunting a flat list (ADR 006).
function parentWithChildren(
  S: StructureBuilder,
  opts: { id: string; title: string; icon: React.ComponentType; kind: string },
) {
  return S.listItem()
    .id(opts.id)
    .title(opts.title)
    .icon(opts.icon)
    .child(
      S.documentTypeList("arrangement")
        .id(`${opts.id}-parents`)
        .title(opts.title)
        .filter(`_type == "arrangement" && eventKind == "${opts.kind}"`)
        .defaultOrdering([{ field: "title", direction: "asc" }])
        .child(parentId =>
          S.list()
            .id(`${opts.id}-parent`)
            .title(opts.title)
            .items([
              S.listItem()
                .id("parent-editor")
                .title("Rediger")
                .icon(icons.edit)
                .child(
                  S.document().documentId(parentId).schemaType("arrangement"),
                ),
              S.listItem()
                .id("parent-instances")
                .title("Instanser")
                .icon(icons.calendar)
                .child(
                  S.documentList()
                    .apiVersion(STRUCTURE_API_VERSION)
                    .id("parent-instances-list")
                    .title("Instanser")
                    .filter(
                      '_type == "arrangement" && parentEvent._ref == $parentId',
                    )
                    .params({ parentId })
                    .defaultOrdering([
                      { field: "dates[0].startDate", direction: "asc" },
                    ]),
                ),
            ]),
        ),
    )
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

              // ── Trenger handling ──
              S.divider(),
              arrangementList(S, {
                id: "arrangement-pending",
                title: "Venter på godkjenning",
                icon: icons.clock,
                filter: `${BROWSE_EVENT_KINDS} && approvalStatus == "pending"`,
                order: { field: "dates[0].startDate", direction: "asc" },
              }),
              arrangementList(S, {
                id: "arrangement-needs-regeneration",
                title: "Serier som må forlenges",
                icon: icons.reset,
                filter: `eventKind == "seriesParent" && count(*[_type == "arrangement" && parentEvent._ref == ^._id && dates[0].startDate > $horizon]) == 0`,
                params: { horizon: seriesRegenHorizon() },
                order: { field: "title", direction: "asc" },
              }),
              arrangementList(S, {
                id: "arrangement-cancelled-postponed",
                title: "Avlyst eller utsatt",
                icon: icons["warning-outline"],
                filter: `${BROWSE_EVENT_KINDS} && eventStatus in ["cancelled", "postponed"]`,
                order: { field: "dates[0].startDate", direction: "asc" },
              }),

              // ── Innhold ──
              S.divider(),
              arrangementList(S, {
                id: "arrangement-singles",
                title: "Enkeltarrangementer",
                icon: icons.calendar,
                filter: `coalesce(eventKind, "single") == "single"`,
                order: { field: "dates[0].startDate", direction: "desc" },
              }),
              parentWithChildren(S, {
                id: "arrangement-series",
                title: "Serier",
                icon: icons.sync,
                kind: "seriesParent",
              }),
              parentWithChildren(S, {
                id: "arrangement-festivals",
                title: "Festivaler",
                icon: icons.star,
                kind: "festivalParent",
              }),

              // ── Visninger ──
              S.divider(),
              arrangementList(S, {
                id: "arrangement-upcoming",
                title: "Kommende",
                icon: icons.calendar,
                filter: `${BROWSE_EVENT_KINDS} && approvalStatus == "approved" && count(dates[startDate >= ${TODAY}]) > 0`,
                order: { field: "dates[0].startDate", direction: "asc" },
              }),
              arrangementList(S, {
                id: "arrangement-promoted",
                title: "Promotert på forsiden",
                icon: icons.rocket,
                filter: `${BROWSE_EVENT_KINDS} && approvalStatus == "approved" && isPromoted == true`,
                order: { field: "dates[0].startDate", direction: "asc" },
              }),
              // Rarely opened states, tucked into one submenu to keep the
              // top level scannable.
              S.listItem()
                .id("arrangement-archive")
                .title("Arkiv og skjulte")
                .icon(icons.archive)
                .child(
                  S.list()
                    .id("arrangement-archive-list")
                    .title("Arkiv og skjulte")
                    .items([
                      arrangementList(S, {
                        id: "arrangement-past",
                        title: "Tidligere",
                        icon: icons.calendar,
                        filter: `${BROWSE_EVENT_KINDS} && approvalStatus == "approved" && count(dates[startDate >= ${TODAY}]) == 0`,
                        order: {
                          field: "dates[0].startDate",
                          direction: "desc",
                        },
                      }),
                      arrangementList(S, {
                        id: "arrangement-paused",
                        title: "Satt på pause",
                        icon: icons.pause,
                        filter: `${BROWSE_EVENT_KINDS} && approvalStatus == "paused"`,
                      }),
                      arrangementList(S, {
                        id: "arrangement-rejected",
                        title: "Avvist",
                        icon: icons["warning-outline"],
                        filter: `${BROWSE_EVENT_KINDS} && approvalStatus == "rejected"`,
                      }),
                      arrangementList(S, {
                        id: "arrangement-archived",
                        title: "Arkivert",
                        icon: icons.document,
                        filter: `${BROWSE_EVENT_KINDS} && approvalStatus == "archived"`,
                      }),
                    ]),
                ),
              // Escape hatch: everything, including generated instances.
              S.documentTypeListItem("arrangement")
                .title("Absolutt alle (inkl. instanser)")
                .icon(icons.documents),
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
                "Åpningstider, feriemodus og stengte dager",
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
