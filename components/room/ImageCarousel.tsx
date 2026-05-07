"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"

import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel"

type CarouselImage = {
    _key: string
    src: string
    alt: string
    caption?: string | null
}

export function ImageCarousel({ images }: { images: CarouselImage[] }) {
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [canScrollPrev, setCanScrollPrev] = useState(false)
    const [canScrollNext, setCanScrollNext] = useState(false)

    const onSelect = useCallback((api: CarouselApi) => {
        if (!api) return
        setCurrent(api.selectedScrollSnap())
        setCanScrollPrev(api.canScrollPrev())
        setCanScrollNext(api.canScrollNext())
    }, [])

    useEffect(() => {
        if (!api) return
        onSelect(api)
        api.on("select", onSelect)
        api.on("reInit", onSelect)
        return () => {
            api.off("select", onSelect)
            api.off("reInit", onSelect)
        }
    }, [api, onSelect])

    if (!images.length) return null

    const single = images.length === 1

    return (
        <div className="relative bg-muted">
            <Carousel setApi={setApi} opts={{ loop: false, dragFree: false }}>
                {/* Remove the default -ml-4/pl-4 gap so slides are edge-to-edge */}
                <CarouselContent className="ml-0">
                    {images.map((img, i) => (
                        <CarouselItem key={img._key} className="pl-0">
                            <div className="relative aspect-[16/9] w-full">
                                <Image
                                    alt={img.alt}
                                    className="object-cover"
                                    fill
                                    priority={i === 0}
                                    sizes="100vw"
                                    src={img.src}
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Caption */}
                {images[current]?.caption && (
                    <p className="absolute bottom-0 left-0 right-0 bg-background/70 px-4 py-2 text-xs text-foreground backdrop-blur-sm">
                        {images[current].caption}
                    </p>
                )}

                {/* Prev / Next */}
                {!single && (
                    <>
                        <button
                            aria-label="Forrige bilde"
                            className="absolute left-3 top-1/2 -translate-y-1/2 border-2 border-border bg-background/90 p-1.5 shadow-shadow transition-colors disabled:opacity-30 hover:bg-background"
                            disabled={!canScrollPrev}
                            onClick={() => api?.scrollPrev()}
                            type="button"
                        >
                            <ChevronLeft aria-hidden className="size-5 text-foreground" />
                        </button>
                        <button
                            aria-label="Neste bilde"
                            className="absolute right-3 top-1/2 -translate-y-1/2 border-2 border-border bg-background/90 p-1.5 shadow-shadow transition-colors disabled:opacity-30 hover:bg-background"
                            disabled={!canScrollNext}
                            onClick={() => api?.scrollNext()}
                            type="button"
                        >
                            <ChevronRight aria-hidden className="size-5 text-foreground" />
                        </button>
                    </>
                )}

                {/* Dot indicators */}
                {!single && (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                        {images.map((_, i) => (
                            <button
                                aria-label={`Bilde ${i + 1}`}
                                className={`h-1.5 rounded-full bg-background transition-all ${
                                    i === current ? "w-5 opacity-100" : "w-1.5 opacity-60"
                                }`}
                                key={i}
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
