import type { UsefulInfoPage } from "@/lib/sanity/fetch"
import { AccessibilityAccordionBlock } from "./AccessibilityAccordionBlock"
import { AddressBlock } from "./AddressBlock"
import { EditorialInfoBlock } from "./EditorialInfoBlock"

export type InfoSectionData = NonNullable<UsefulInfoPage["sections"]>[number]

export interface SectionNavItem {
  id: string
  title: string
}

// Single source of truth for a block's anchor id + nav label, shared by the
// rendered section and the scroll-spy sidebar.
export const sectionMeta = (block: InfoSectionData): SectionNavItem => ({
  id: block._key,
  title:
    block._type === "editorialSection"
      ? (block.title ?? "Informasjon")
      : block.heading,
})

export const SectionBlock = ({ block }: { block: InfoSectionData }) => {
  switch (block._type) {
    case "infoAddressBlock":
      return <AddressBlock block={block} />
    case "editorialSection":
      return <EditorialInfoBlock block={block} />
    case "infoAccordionBlock":
      return <AccessibilityAccordionBlock block={block} />
    default:
      return assertNever(block)
  }
}

const assertNever = (block: never): null => {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Unhandled nyttig section block", block)
  }
  return null
}
