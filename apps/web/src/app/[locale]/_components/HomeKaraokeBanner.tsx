import { ArrowRight, Mic } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { sanityImageUrl, shouldLoadImageDirectly } from "@/lib/sanity/image-url"

interface HomeKaraokeBannerProps {
  eyebrow: string
  heading1: string
  heading2: string
  body: string
  cta: string
  imageUrl?: string | null
  imageAlt?: string | null
}

/** Karaoke in Maos Lille Røde, in the same banner type as "Bli frivillig". */
export function HomeKaraokeBanner({
  eyebrow,
  heading1,
  heading2,
  body,
  cta,
  imageUrl,
  imageAlt,
}: HomeKaraokeBannerProps) {
  const src = imageUrl
    ? sanityImageUrl(imageUrl, { width: 1200, height: 900 })
    : null

  return (
    <section className="grid overflow-hidden bg-foreground text-background shadow-hard-lg md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="p-8 sm:p-12">
        <p className="flex items-center gap-2 font-heading text-lg text-background/75">
          <Mic aria-hidden className="size-5 text-primary" />
          {eyebrow}
        </p>
        <h2 className="mt-2 font-heading text-5xl leading-none sm:text-7xl">
          {heading1}
          <br />
          <span className="text-primary">{heading2}</span>
        </h2>
        <p className="mt-4 max-w-lg text-lg text-background/75">{body}</p>
        <Button
          className="group mt-6"
          render={<Link href="/karaoke" />}
          size="lg"
        >
          {cta}
          <ArrowRight className="transition-transform duration-base ease-out group-hover:translate-x-1" />
        </Button>
      </div>
      {src && (
        <div className="relative min-h-64 md:min-h-full">
          <Image
            alt={imageAlt ?? ""}
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            src={src}
            unoptimized={shouldLoadImageDirectly(src)}
          />
        </div>
      )}
    </section>
  )
}
