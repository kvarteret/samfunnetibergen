import { permanentRedirect } from "next/navigation"

import { resolvePageLocale } from "@/lib/app-locale"
import { VOLUNTEER_LISTING_PATH } from "@/lib/volunteer-routes"

type VolunteerRedirectPageProps = {
  params: Promise<{ locale: string }>
}

export default async function VolunteerRedirectPage({
  params,
}: VolunteerRedirectPageProps) {
  const locale = await resolvePageLocale(params)
  permanentRedirect(`/${locale}${VOLUNTEER_LISTING_PATH}`)
}
