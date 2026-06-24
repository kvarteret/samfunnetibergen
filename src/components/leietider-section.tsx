import { Disclosure } from "@/components/ui/disclosure"
import type { EditorialSection } from "@/lib/sanity/fetch"
import { cn } from "@/lib/utils"

interface LeietiderSectionProps {
  section: EditorialSection | null | undefined
  className?: string
}

export function LeietiderSection({
  section,
  className,
}: LeietiderSectionProps) {
  if (!section?.title) return null

  const paragraphs = section.paragraphs ?? []

  return (
    <section aria-label={section.title} className={cn("space-y-2", className)}>
      <div className="hidden space-y-3 panel md:block">
        <h2 className="font-heading text-xl leading-tight text-foreground">
          {section.title}
        </h2>
        <LeietiderParagraphs paragraphs={paragraphs} />
      </div>
      <Disclosure className="md:hidden" summary="Se leietider">
        <LeietiderParagraphs paragraphs={paragraphs} />
      </Disclosure>
    </section>
  )
}

function LeietiderParagraphs({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-2">
      {paragraphs.map(paragraph => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}
