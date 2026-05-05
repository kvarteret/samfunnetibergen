import type { StructureBuilder, StructureResolver } from "sanity/structure"

export const singletonTypeNames = ["homePage", "eventsPage"] as const

const singletonTypes = new Set<string>(singletonTypeNames)

function singletonListItem(S: StructureBuilder, typeName: string, title: string) {
    return S.listItem()
        .title(title)
        .child(S.document().schemaType(typeName).documentId(typeName).title(title))
}

export const structure: StructureResolver = S =>
    S.list()
        .title("Content")
        .items([
            singletonListItem(S, "homePage", "Home Page"),
            singletonListItem(S, "eventsPage", "Events Page"),
            S.divider(),
            ...S.documentTypeListItems().filter(item => {
                const id = item.getId()
                return typeof id === "string" && !singletonTypes.has(id)
            }),
        ])
