import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

interface HomeKaraokeBannerProps {
  heading1: string
  heading2: string
  body: string
  cta: string
}

/** Karaoke in Maos Lille Røde, in the same banner type as "Bli frivillig". */
export function HomeKaraokeBanner({
  heading1,
  heading2,
  body,
  cta,
}: HomeKaraokeBannerProps) {
  return (
    <section className="bg-foreground p-8 text-background shadow-hard-lg sm:p-12">
      <h2 className="font-heading text-5xl leading-none sm:text-7xl">
        {heading1}
        <br />
        <span className="text-primary">{heading2}</span>
      </h2>
      <p className="mt-5 max-w-lg text-lg leading-8 text-background">{body}</p>
      <Button
        className="group mt-6"
        render={<Link href="/karaoke" />}
        size="lg"
      >
        {cta}
        <ArrowRight className="transition-transform duration-base ease-out group-hover:translate-x-1" />
      </Button>
    </section>
  )
}
