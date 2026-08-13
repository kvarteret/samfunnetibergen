import { Users } from "lucide-react"
import { LeietiderSection } from "@/components/leietider-section"
import { Button } from "@/components/ui/button"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

import { Link } from "@/i18n/navigation"
import {
  activateRequestLocale,
  getLocaleStaticParams,
  resolvePageLocale,
} from "@/lib/app-locale"
import { buildPageMetadata } from "@/lib/page-metadata"
import type {
  EditorialSection,
  RoomSummary,
  SourcedImage,
} from "@/lib/sanity/fetch"
import { fetchRooms, fetchRoomsPageContent } from "@/lib/sanity/fetch"
import { getTranslations } from "next-intl/server"

export const revalidate = 300

export function generateStaticParams() {
  return getLocaleStaticParams()
}

type RoomsPageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: RoomsPageProps) {
  const locale = await resolvePageLocale(params)
  const content = await fetchRoomsPageContent(locale, { stega: false })

  return buildPageMetadata({
    canonicalPath: `/${locale}/rom`,
    title: content?.title ?? "Rom",
    description:
      content?.description ?? "Se rommene på Det Akademiske Kvarter.",
  })
}

const imageUrl = (image: SourcedImage | null | undefined) => image?.assetUrl

function RoomImage({
  image,
  title,
}: {
  image: RoomSummary["image"]
  title: string
}) {
  const src = imageUrl(image)

  return (
    <ImageWithFallback
      alt={image?.alt || title}
      aspectRatio="16/10"
      fallback={
        <span className="p-6 text-center font-heading text-2xl text-foreground-muted">
          {title}
        </span>
      }
      sizes="(max-width: 768px) 100vw, 50vw"
      src={src}
    />
  )
}

export default async function RoomsPage({ params }: RoomsPageProps) {
  const locale = await resolvePageLocale(params)
  activateRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "RoomsPage" })

  const [content, rooms] = await Promise.all([
    fetchRoomsPageContent(locale),
    fetchRooms(),
  ])

  const leietiderSection = content?.sections?.find(
    (s: EditorialSection) => s.title === "Leietider",
  )

  return (
    <div className="space-y-16">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h1 className="wrap-break-word font-heading text-5xl leading-none text-foreground sm:text-6xl">
              {t("booking")}
            </h1>
            {content?.description ? (
              <p className="max-w-3xl text-xl leading-8 text-foreground">
                {content.description}
              </p>
            ) : null}
          </div>
          <Button
            className="w-fit"
            render={<Link href="/rom/book" />}
            size="lg"
          >
            {content?.bookingLink?.label ?? t("bookRoom")}
          </Button>
        </div>
        <LeietiderSection
          className="lg:justify-self-end lg:[&>div]:h-full"
          section={leietiderSection}
        />
      </header>

      <section aria-labelledby="rooms-heading" className="space-y-6">
        <h2
          className="font-heading text-3xl text-foreground"
          id="rooms-heading"
        >
          {t("ourRooms")}
        </h2>
        <div
          aria-label={t("availableRooms")}
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {rooms.map(room => {
            if (!room.slug) return null
            const title = room.title ?? room.slug

            return (
              <Link
                className="group flex min-h-full flex-col overflow-hidden panel p-0 shadow-shadow transition-transform hover:-translate-y-1"
                href={`/rom/${room.slug}`}
                key={room.slug}
              >
                <RoomImage image={room.image} title={title} />
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="space-y-2">
                    <h2 className="font-heading text-3xl leading-none text-foreground">
                      {title}
                    </h2>
                    {room.summary ? (
                      <p className="line-clamp-3 leading-7 text-foreground">
                        {room.summary}
                      </p>
                    ) : null}
                  </div>
                  <dl className="mt-auto grid gap-3 text-foreground">
                    {room.capacityStanding != null ||
                    room.capacitySeated != null ? (
                      <div className="flex items-center gap-2">
                        <Users aria-hidden="true" className="size-4" />
                        <dt className="font-heading">{t("capacity")}</dt>
                        <dd>
                          {[
                            room.capacityStanding != null &&
                              `${room.capacityStanding} ${t("standing")}`,
                            room.capacitySeated != null &&
                              `${room.capacitySeated} ${t("seated")}`,
                          ]
                            .filter(Boolean)
                            .join(" / ")}
                        </dd>
                      </div>
                    ) : null}
                    {room.suitedPurposes?.length ? (
                      <div className="space-y-1">
                        <dt className="font-heading">{t("suitedFor")}</dt>
                        <dd>{room.suitedPurposes.join(", ")}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
