import { redirect } from "next/navigation"

import { resolvePageLocale } from "@/lib/app-locale"

export const dynamic = "force-dynamic"

type VolunteerRedirectPageProps = {
  params: Promise<{ locale: string }>
}

export default async function VolunteerRedirectPage({
  params,
}: VolunteerRedirectPageProps) {
  const locale = await resolvePageLocale(params)
  redirect(`/${locale}/grupper`)
}
