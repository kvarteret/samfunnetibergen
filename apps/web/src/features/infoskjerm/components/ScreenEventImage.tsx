import type { ImageFrame } from "@samfunnet/content-domain/image-frame"
import Image from "next/image"
import { SectionMark } from "@/components/section-mark"
import { sanityImageUrl, shouldLoadImageDirectly } from "@/lib/sanity/image-url"
import { cn } from "@/lib/utils"

export function ScreenEventImage({
  imageFrame,
  imageUrl,
  variant,
  pageSize = 3,
  expired = false,
}: {
  imageFrame?: ImageFrame | null
  imageUrl: string | null
  variant: "daily" | "promoted"
  pageSize?: number
  expired?: boolean
}) {
  const promoted = variant === "promoted"
  const src = imageUrl
    ? sanityImageUrl(
        imageUrl,
        promoted ? { width: 640, height: 480 } : { width: 480, height: 360 },
        imageFrame,
      )
    : null
  return (
    <div
      className={cn(
        "relative grid aspect-[4/3] place-items-center overflow-hidden rounded-base",
        promoted
          ? "w-[17cqw] bg-background text-primary"
          : pageSize === 1
            ? "col-start-2 mt-[2cqw] w-full max-w-[48cqw]"
            : pageSize === 2
              ? "w-[30cqw]"
              : "w-[24cqw]",
        !promoted &&
          (expired
            ? "bg-neutral-200 text-neutral-500"
            : "bg-panel-warm text-primary"),
      )}
    >
      {src ? (
        <Image
          className={cn("object-cover", expired && "opacity-55 grayscale")}
          alt=""
          fill
          sizes={promoted ? "24vw" : "(max-aspect-ratio: 9/16) 34vw, 19vh"}
          src={src}
          unoptimized={shouldLoadImageDirectly(src)}
        />
      ) : (
        <SectionMark className="h-auto w-[7cqw]" />
      )}
    </div>
  )
}
