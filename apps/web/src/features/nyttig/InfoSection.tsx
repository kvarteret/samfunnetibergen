import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface InfoSectionProps {
  id: string
  icon: LucideIcon
  title: string
  children: ReactNode
}

export const InfoSection = ({
  id,
  icon: Icon,
  title,
  children,
}: InfoSectionProps) => (
  <section
    aria-labelledby={`${id}-heading`}
    className="scroll-mt-28 py-12 first:pt-0 last:pb-0"
    id={id}
  >
    <div className="mb-6 flex items-center gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center bg-primary">
        <Icon aria-hidden className="size-6 text-primary-foreground" />
      </div>
      <h2
        className="font-heading text-3xl leading-tight text-foreground sm:text-4xl"
        id={`${id}-heading`}
      >
        {title}
      </h2>
    </div>
    {children}
  </section>
)
