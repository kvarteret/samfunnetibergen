import { Disclosure } from "@/components/ui/disclosure"
import { useTranslations } from "next-intl"
import { PortableTextContent } from "@/lib/portable-text-components"
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
  const t = useTranslations("RoomBooking")

  if (!section?.title) return null

  return (
    <section aria-label={section.title} className={cn("space-y-2", className)}>
      <div className="hidden space-y-3 panel md:block">
        <h2 className="font-heading text-xl leading-tight text-foreground">
          {section.title}
        </h2>
        <LeietiderBody body={section.body} />
      </div>
      <Disclosure className="md:hidden" summary={t("page.viewRentalHours")}>
        <LeietiderBody body={section.body} />
      </Disclosure>
    </section>
  )
}

function LeietiderBody({
  body,
}: {
  body: NonNullable<EditorialSection["body"]>
}) {
  return <PortableTextContent value={body} />
}
