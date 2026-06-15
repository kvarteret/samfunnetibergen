"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

type ImageSlide = {
  _key: string
  type: "image"
  src: string
  alt: string
  caption?: string | null
}

type PanoramaSlide = {
  _key: string
  type: "panorama"
  iframeSrc: string
  caption?: string | null
}

export type CarouselSlide = ImageSlide | PanoramaSlide

// Back-compat alias used by the old API
type CarouselImage = {
  _key: string
  src: string
  alt: string
  caption?: string | null
}

function normalise(images: CarouselImage[]): ImageSlide[] {
  return images.map(img => ({ ...img, type: "image" as const }))
}

interface ImageCarouselProps {
  images?: CarouselImage[]
  slides?: CarouselSlide[]
}

function PanoramaEmbed({
  src,
  loading,
}: {
  src: string
  loading: "eager" | "lazy"
}) {
  const [active, setActive] = useState(false)

  return (
    <div
      className="relative h-full w-full"
      onMouseLeave={() => setActive(false)}
    >
      <iframe
        allowFullScreen
        className="h-full w-full border-0"
        loading={loading}
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-same-origin"
        src={src}
        style={{ pointerEvents: active ? "auto" : "none" }}
      />
      {!active && (
        <div
          aria-label="Klikk for å interagere med 360°-visningen"
          className="absolute inset-0 cursor-pointer"
          onClick={() => setActive(true)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === "Enter" && setActive(true)}
        >
          <span className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1.5 font-heading text-xs text-foreground backdrop-blur-sm select-none">
            Klikk for å bevege kamera
          </span>
        </div>
      )}
    </div>
  )
}

export function ImageCarousel({ images, slides }: ImageCarouselProps) {
  const allSlides: CarouselSlide[] = slides ?? normalise(images ?? [])
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  const onSelect = useCallback((api: CarouselApi) => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!api) return
    const init = setTimeout(() => onSelect(api), 0)
    api.on("select", onSelect)
    api.on("reInit", onSelect)
    return () => {
      clearTimeout(init)
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api, onSelect])

  if (!allSlides.length) return null

  const single = allSlides.length === 1
  const currentSlide = allSlides[current]

  return (
    <div className="relative bg-muted">
      <Carousel setApi={setApi} opts={{ loop: false, dragFree: false }}>
        {/* Remove the default -ml-4/pl-4 gap so slides are edge-to-edge */}
        <CarouselContent className="ml-0">
          {allSlides.map((slide, i) => (
            <CarouselItem key={slide._key} className="pl-0">
              <div className="relative aspect-video w-full">
                {slide.type === "panorama" ? (
                  <PanoramaEmbed
                    loading={i === 0 ? "eager" : "lazy"}
                    src={slide.iframeSrc}
                  />
                ) : (
                  <Image
                    alt={slide.alt}
                    className="object-cover"
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    src={slide.src}
                  />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {currentSlide?.caption && (
          <p className="absolute bottom-0 left-0 right-0 bg-background/70 px-4 py-2 text-sm text-foreground backdrop-blur-sm">
            {currentSlide.caption}
          </p>
        )}

        {!single && (
          <>
            <CarouselPrevious className="left-3 rounded-none border-2 border-border bg-background/90 p-1.5 shadow-shadow disabled:opacity-30 hover:bg-background [&_svg]:size-5" />
            <CarouselNext className="right-3 rounded-none border-2 border-border bg-background/90 p-1.5 shadow-shadow disabled:opacity-30 hover:bg-background [&_svg]:size-5" />
          </>
        )}

        {!single && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {allSlides.map((slide, i) => (
              <button
                aria-label={`Bilde ${i + 1}`}
                className={`h-1.5 rounded-full bg-background transition-all ${
                  i === current ? "w-5 opacity-100" : "w-1.5 opacity-60"
                }`}
                key={slide._key}
                onClick={() => api?.scrollTo(i)}
                type="button"
              />
            ))}
          </div>
        )}
      </Carousel>
    </div>
  )
}
