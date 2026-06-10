import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

interface BookingButtonProps {
  label?: string | null
  locale: string
  className?: string
}

export function BookingButton({
  label,
  locale,
  className,
}: BookingButtonProps) {
  return (
    <Button asChild className={cn("w-fit", className)} size="lg">
      <Link href="/rom/book">
        <ArrowRight aria-hidden />
        {label ?? "Book rom her"}
      </Link>
    </Button>
  )
}
