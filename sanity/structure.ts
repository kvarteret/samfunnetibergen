import {
    CalendarIcon,
    CogIcon,
    ComponentIcon,
    DocumentIcon,
    EnvelopeIcon,
    HeartIcon,
    HomeIcon,
    MenuIcon,
    StarIcon,
    TagIcon,
    UsersIcon,
} from "@sanity/icons"
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list"
import type { StructureBuilder, StructureResolver } from "sanity/structure"

export const singletonTypeNames = [
    "siteMetadata",
    "homePage",
    "eventsPage",
    "roomsPage",
    "groupsPage",
    "blifrivilligPage",
    "kontaktPage",
    "navbar",
] as const

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

export const structure: StructureResolver = (S, context) =>
    S.list()
        .title("Samfunnet i Bergen")
        .items([
            // — Innstillinger —
            S.listItem()
                .title("Innstillinger")
                .icon(CogIcon)
                .child(
                    S.list()
                        .title("Innstillinger")
                        .items([
                            singletonListItem(S, "siteMetadata", "Nettstedsinfo", CogIcon),
                            singletonListItem(S, "navbar", "Navigasjon", MenuIcon),
                        ]),
                ),

            S.divider(),

            // — Sider —
            S.listItem()
                .title("Sider")
                .icon(DocumentIcon)
                .child(
                    S.list()
                        .title("Sider")
                        .items([
                            singletonListItem(S, "homePage", "Forside", HomeIcon),
                            singletonListItem(S, "eventsPage", "Arrangementer-side", DocumentIcon),
                            singletonListItem(S, "roomsPage", "Rom-side", ComponentIcon),
                            singletonListItem(S, "groupsPage", "Grupper-side", UsersIcon),
                            singletonListItem(S, "blifrivilligPage", "Bli frivillig", HeartIcon),
                            singletonListItem(S, "kontaktPage", "Kontakt", EnvelopeIcon),
                            S.divider(),
                            S.documentTypeListItem("page").title("Andre sider"),
                        ]),
                ),

            S.divider(),

            // — Arrangementer —
            S.listItem()
                .title("Arrangementer")
                .icon(CalendarIcon)
                .child(
                    S.list()
                        .title("Arrangementer")
                        .items([
                            S.documentTypeListItem("arrangement")
                                .title("Alle arrangementer")
                                .icon(CalendarIcon),
                            S.listItem()
                                .id("arrangement-pending")
                                .title("Venter på godkjenning")
                                .icon(CalendarIcon)
                                .child(
                                    S.documentList()
                                        .title("Venter på godkjenning")
                                        .filter(
                                            '_type == "arrangement" && approvalStatus == "pending"',
                                        ),
                                ),
                            S.divider(),
                            orderableDocumentListDeskItem({
                                S,
                                context,
                                type: "eventTaxonomyGroup",
                                id: "orderable-event-taxonomy-group",
                                title: "Taksonomigrupper",
                                icon: TagIcon,
                            }),
                            S.listItem()
                                .title("Arrangementtyper")
                                .icon(TagIcon)
                                .child(
                                    S.list()
                                        .title("Arrangementtyper")
                                        .items([
                                            S.documentTypeListItem("eventTaxonomyGroup")
                                                .title("Etter taksonomigruppe")
                                                .icon(TagIcon)
                                                .child(taxonomyGroupId =>
                                                    S.list()
                                                        .title("Arrangementtyper")
                                                        .items([
                                                            orderableDocumentListDeskItem({
                                                                S,
                                                                context,
                                                                type: "eventType",
                                                                id: `orderable-event-type-${taxonomyGroupId}`,
                                                                title: "Arrangementtyper",
                                                                filter: '_type == "eventType" && taxonomyGroup._ref == $taxonomyGroupId',
                                                                params: { taxonomyGroupId },
                                                                createIntent: false,
                                                            }),
                                                        ]),
                                                ),
                                            S.divider(),
                                            orderableDocumentListDeskItem({
                                                S,
                                                context,
                                                type: "eventType",
                                                id: "orderable-event-type-all",
                                                title: "Alle arrangementtyper",
                                                icon: TagIcon,
                                            }),
                                        ]),
                                ),
                        ]),
                ),

            S.divider(),

            // — Frivilligfordeler —
            S.listItem()
                .title("Frivilligfordeler (internbevis)")
                .icon(StarIcon)
                .child(S.documentTypeList("internbevisBenefit").title("Frivilligfordeler")),

            S.divider(),

            // — Rom —
            S.listItem()
                .title("Rom")
                .icon(ComponentIcon)
                .child(
                    S.list()
                        .title("Rom")
                        .items([
                            orderableDocumentListDeskItem({
                                S,
                                context,
                                type: "room",
                                id: "orderable-room-floor-1",
                                title: "1. etasje",
                                filter: '_type == "room" && (floor == "1" || floor == 1)',
                            }),
                            orderableDocumentListDeskItem({
                                S,
                                context,
                                type: "room",
                                id: "orderable-room-floor-2",
                                title: "2. etasje",
                                filter: '_type == "room" && (floor == "2" || floor == 2)',
                            }),
                            orderableDocumentListDeskItem({
                                S,
                                context,
                                type: "room",
                                id: "orderable-room-floor-3",
                                title: "3. etasje",
                                filter: '_type == "room" && (floor == "3" || floor == 3)',
                            }),
                            S.divider(),
                            orderableDocumentListDeskItem({
                                S,
                                context,
                                type: "room",
                                id: "orderable-room-all",
                                title: "Alle rom",
                            }),
                        ]),
                ),

            // — Grupper —
            S.listItem()
                .title("Grupper")
                .icon(UsersIcon)
                .child(
                    S.list()
                        .title("Grupper")
                        .items([
                            orderableDocumentListDeskItem({
                                S,
                                context,
                                type: "studentGroup",
                                id: "orderable-student-group-arbeidsgruppe",
                                title: "Arbeidsgrupper",
                                filter: '_type == "studentGroup" && category == "arbeidsgruppe"',
                            }),
                            orderableDocumentListDeskItem({
                                S,
                                context,
                                type: "studentGroup",
                                id: "orderable-student-group-komitee",
                                title: "Komiteer",
                                filter: '_type == "studentGroup" && category == "komitee"',
                            }),
                            orderableDocumentListDeskItem({
                                S,
                                context,
                                type: "studentGroup",
                                id: "orderable-student-group-dorg",
                                title: "Faste samarbeidspartnere (Dorg)",
                                filter: '_type == "studentGroup" && category == "dorg"',
                            }),
                            orderableDocumentListDeskItem({
                                S,
                                context,
                                type: "studentGroup",
                                id: "orderable-student-group-borg",
                                title: "Brukerorganisasjoner (Borg)",
                                filter: '_type == "studentGroup" && category == "borg"',
                            }),
                            S.divider(),
                            orderableDocumentListDeskItem({
                                S,
                                context,
                                type: "studentGroup",
                                id: "orderable-student-group-all",
                                title: "Alle grupper",
                            }),
                        ]),
                ),
        ])
