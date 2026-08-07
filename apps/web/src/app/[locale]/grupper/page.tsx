import { permanentRedirect } from "next/navigation"

import { resolvePageLocale } from "@/lib/app-locale"
import { VOLUNTEER_LISTING_PATH } from "@/lib/volunteer-routes"

type RetiredGroupsPageProps = {
  params: Promise<{ locale: string }>
}

export default async function RetiredGroupsPage({
  params,
}: RetiredGroupsPageProps) {
  const locale = await resolvePageLocale(params)
  permanentRedirect(`/${locale}${VOLUNTEER_LISTING_PATH}`)
}
