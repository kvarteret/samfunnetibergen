import {
    CogIcon,
    ComponentIcon,
    DocumentIcon,
    HomeIcon,
    MenuIcon,
    UsersIcon,
} from "@sanity/icons"
import type { StructureBuilder, StructureResolver } from "sanity/structure"

export const singletonTypeNames = [
    "siteMetadata",
    "homePage",
    "eventsPage",
    "roomsPage",
    "groupsPage",
    "navbar",
] as const

const singletonTypes = new Set<string>(singletonTypeNames)

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

export const structure: StructureResolver = S =>
    S.list()
        .title("Samfunnet i Bergen")
        .items([
            // — Singletons —
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

            // — Pages —
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
                            S.divider(),
                            S.documentTypeListItem("page").title("Andre sider"),
                        ]),
                ),

            S.divider(),

            // — Content collections —
            S.listItem()
                .title("Rom")
                .icon(ComponentIcon)
                .child(S.documentTypeList("room").title("Rom")),

            S.listItem()
                .title("Grupper")
                .icon(UsersIcon)
                .child(
                    S.list()
                        .title("Grupper")
                        .items([
                            S.listItem()
                                .title("Arbeidsgrupper")
                                .child(
                                    S.documentList()
                                        .title("Arbeidsgrupper")
                                        .schemaType("studentGroup")
                                        .filter(
                                            '_type == "studentGroup" && category == "arbeidsgruppe"',
                                        ),
                                ),
                            S.listItem()
                                .title("Komiteer")
                                .child(
                                    S.documentList()
                                        .title("Komiteer")
                                        .schemaType("studentGroup")
                                        .filter(
                                            '_type == "studentGroup" && category == "komitee"',
                                        ),
                                ),
                            S.listItem()
                                .title("Faste samarbeidspartnere (Dorg)")
                                .child(
                                    S.documentList()
                                        .title("Faste samarbeidspartnere")
                                        .schemaType("studentGroup")
                                        .filter('_type == "studentGroup" && category == "dorg"'),
                                ),
                            S.listItem()
                                .title("Brukerorganisasjoner (Borg)")
                                .child(
                                    S.documentList()
                                        .title("Brukerorganisasjoner")
                                        .schemaType("studentGroup")
                                        .filter('_type == "studentGroup" && category == "borg"'),
                                ),
                            S.divider(),
                            S.documentTypeListItem("studentGroup").title("Alle grupper"),
                        ]),
                ),
        ])
