import { MapPin } from "lucide-react"

import { PortableTextContent } from "@/lib/portable-text-components"
import type { UsefulInfoPage } from "@/lib/sanity/fetch"
import { InfoSection } from "./InfoSection"
import { InlineContentLink } from "./InlineContentLink"

type AddressBlockData = Extract<
  NonNullable<UsefulInfoPage["sections"]>[number],
  { _type: "infoAddressBlock" }
>

export const AddressBlock = ({ block }: { block: AddressBlockData }) => (
  <InfoSection icon={MapPin} id={block._key} title={block.heading ?? "Adkomst"}>
    <div className="space-y-4">
      {block.body.length > 0 ? (
        <div className="max-w-2xl text-foreground">
          <PortableTextContent value={block.body} />
        </div>
      ) : null}
      {block.address ? (
        <p className="font-heading uppercase tracking-widest text-foreground">
          {block.address}
        </p>
      ) : null}
      {block.mapUrl ? (
        <InlineContentLink
          link={{ label: "Vis i Google Maps", href: block.mapUrl }}
        />
      ) : null}
    </div>
  </InfoSection>
)
