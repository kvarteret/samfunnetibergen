"use client"

import { Accessibility } from "lucide-react"

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PortableTextContent } from "@/lib/portable-text-components"
import type { UsefulInfoPage } from "@/lib/sanity/fetch"
import { InfoSection } from "./InfoSection"

type AccordionBlockData = Extract<
  NonNullable<UsefulInfoPage["sections"]>[number],
  { _type: "infoAccordionBlock" }
>

export const AccessibilityAccordionBlock = ({
  block,
}: {
  block: AccordionBlockData
}) => (
  <InfoSection icon={Accessibility} id={block._key} title={block.heading}>
    <div className="space-y-6">
      {block.intro ? (
        <p className="max-w-2xl text-lg leading-7 text-foreground-muted">
          {block.intro}
        </p>
      ) : null}
      <Accordion>
        {block.items.map(item => (
          <AccordionItem key={item._key} value={item._key}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionPanel>
              <div className="max-w-2xl text-foreground [&_.paper-prose]:bg-transparent [&_.paper-prose]:p-0">
                <PortableTextContent value={item.body} />
              </div>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </InfoSection>
)
