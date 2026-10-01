import Image from "next/image"
import { SectionMark } from "@/components/section-mark"
import { sanityImageUrl, shouldLoadImageDirectly } from "@/lib/sanity/image-url"
import styles from "./InfoScreen.module.css"

export function ScreenEventImage({
  imageUrl,
  variant,
}: {
  imageUrl: string | null
  variant: "daily" | "promoted"
}) {
  const promoted = variant === "promoted"
  const src = imageUrl
    ? sanityImageUrl(
        imageUrl,
        promoted ? { width: 640, height: 480 } : { width: 480, height: 360 },
      )
    : null
  return (
    <div className={promoted ? styles.promotionImage : styles.eventImage}>
      {src ? (
        <Image
          alt=""
          fill
          sizes={promoted ? "24vw" : "(max-aspect-ratio: 9/16) 34vw, 19vh"}
          src={src}
          unoptimized={shouldLoadImageDirectly(src)}
        />
      ) : (
        <SectionMark className={styles.imageMark} />
      )}
    </div>
  )
}
