import type { ReactNode } from "react"

import { SectionHeader } from "@/components/ui/section-header"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  number?: string
  title: string
  children: ReactNode
  className?: string
}

export function FormSection({
  number,
  title,
  children,
  className,
}: FormSectionProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <SectionHeader number={number} title={title} />
      {children}
    </section>
  )
}
