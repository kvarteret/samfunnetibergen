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
    <section className="relative border-2 border-border bg-foreground p-8 text-background shadow-hard-lg sm:p-12">
      <Tag className="absolute -top-3 right-8 -rotate-3">{sticker}</Tag>
      <p className="font-heading text-sm uppercase tracking-widest text-background/75">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-heading text-4xl uppercase leading-none sm:text-6xl">
        {heading1}
        <br />
        {heading2}
      </h2>
      <p className="mt-4 max-w-lg text-lg text-background/75">{body}</p>
      <Button asChild className="mt-6" size="lg">
        <Link href="/rom/book">{cta}</Link>
      </Button>
    </section>
  )
}
