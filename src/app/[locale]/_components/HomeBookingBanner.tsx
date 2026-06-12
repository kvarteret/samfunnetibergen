import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { Link } from "@/i18n/navigation"

interface HomeBookingBannerProps {
  eyebrow: string
  heading1: string
  heading2: string
  body: string
  cta: string
  sticker: string
}

export function HomeBookingBanner({
  eyebrow,
  heading1,
  heading2,
  body,
  cta,
  sticker,
}: HomeBookingBannerProps) {
  return (
    <section className="relative bg-foreground p-8 text-background shadow-hard-lg sm:p-12">
      <Tag className="absolute -top-3 right-8 -rotate-3">{sticker}</Tag>
      <p className="font-heading text-lg text-background/75">{eyebrow}</p>
      <h2 className="mt-2 font-heading text-5xl leading-none sm:text-7xl">
        {heading1}
        <br />
        {heading2}
      </h2>
      <p className="mt-4 max-w-lg text-lg text-background/75">{body}</p>
      <Button
        className="group mt-6"
        render={<Link href="/rom/book" />}
        size="lg"
      >
        {cta}
        <ArrowRight className="transition-transform duration-base ease-out group-hover:translate-x-1" />
      </Button>
    </section>
  )
}
