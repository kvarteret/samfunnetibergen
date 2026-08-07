import { permanentRedirect } from "next/navigation"

import { resolvePageLocale } from "@/lib/app-locale"

type VolunteerRedirectPageProps = {
  params: Promise<{ locale: string }>
}

export default async function VolunteerRedirectPage({
  params,
}: VolunteerRedirectPageProps) {
  const locale = await resolvePageLocale(params)
  permanentRedirect(`/${locale}/grupper`)
}
