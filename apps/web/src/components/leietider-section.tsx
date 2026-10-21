import { useTranslations } from "next-intl"
import { Disclosure } from "@/components/ui/disclosure"
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
      <div className="panel-warm hidden space-y-3 panel md:block">
        <h2 className="font-heading text-xl leading-tight">{section.title}</h2>
        <LeietiderBody body={section.body} />
        <SemesterApproval />
      </div>
      <Disclosure
        className="panel-warm md:hidden"
        summary={t("page.viewRentalHours")}
      >
        <LeietiderBody body={section.body} />
        <SemesterApproval />
      </Disclosure>
    </section>
  )
}

function LeietiderBody({
  body,
}: {
  body: NonNullable<EditorialSection["body"]>
}) {
  return (
    <PortableTextContent
      className="[&_p]:ml-5 [&_p]:list-item [&_p]:list-disc [&_p]:!my-0 [&_p]:!leading-6"
      value={body}
    />
  )
}

function SemesterApproval() {
  const t = useTranslations("RoomBooking")

  return (
    <div className="space-y-1 border-t border-border pt-3 text-sm text-foreground-muted">
      <p>{t("page.approvalAutumn")}</p>
      <p>{t("page.approvalSpring")}</p>
    </div>
  )
}
