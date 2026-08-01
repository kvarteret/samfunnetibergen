import {
  CalendarDays,
  HelpCircle,
  type LucideIcon,
  PackageSearch,
  Ticket,
  UtensilsCrossed,
} from "lucide-react"

import { PortableTextContent } from "@/lib/portable-text-components"
import type { UsefulInfoPage } from "@/lib/sanity/fetch"
import { InfoSection } from "./InfoSection"

type EditorialBlockData = Extract<
  NonNullable<UsefulInfoPage["sections"]>[number],
  { _type: "editorialSection" }
>

// Match the neuf.no icon-led style: pick an icon from the topic title.
const iconForTitle = (title: string | null): LucideIcon => {
  const value = title?.toLowerCase() ?? ""
  if (value.includes("billett")) return Ticket
  if (value.includes("booking")) return CalendarDays
  if (value.includes("gjenglemt")) return PackageSearch
  if (value.includes("ser")) return UtensilsCrossed
  return HelpCircle
}

export const EditorialInfoBlock = ({
  block,
}: {
  block: EditorialBlockData
}) => (
  <InfoSection
    icon={iconForTitle(block.title)}
    id={block._key}
    title={block.title ?? "Informasjon"}
  >
    <div className="space-y-4">
      <div className="max-w-2xl text-foreground">
        <PortableTextContent value={block.body} />
      </div>
    </div>
  </InfoSection>
)
