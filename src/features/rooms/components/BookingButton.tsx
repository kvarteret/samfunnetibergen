import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

interface BookingButtonProps {
  label?: string | null
  locale: string
  className?: string
}

export function BookingButton({ label, className }: BookingButtonProps) {
  return (
    <Button
      className={cn("w-fit", className)}
      render={<Link href="/rom/book" />}
      size="lg"
    >
      <ArrowRight aria-hidden />
      {label ?? "Book rom her"}
    </Button>
  )
}
