import type { ReactNode } from "react"

import { SectionHeader } from "@/components/ui/section-header"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  number?: string
  title: string
  children: ReactNode
  className?: string
  id?: string
}

export function FormSection({
  number,
  title,
  children,
  className,
  id,
}: FormSectionProps) {
  return (
    <section className={cn("scroll-mt-24 space-y-6", className)} id={id}>
      <SectionHeader number={number} title={title} />
      {children}
    </section>
  )
}
