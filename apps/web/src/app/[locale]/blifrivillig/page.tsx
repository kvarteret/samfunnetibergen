import { redirect } from "next/navigation"

import { resolvePageLocale } from "@/lib/app-locale"

type VolunteerRedirectPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function VolunteerRedirectPage({
  params,
  searchParams,
}: VolunteerRedirectPageProps) {
  const locale = await resolvePageLocale(params)
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item)
    } else if (value !== undefined) {
      query.append(key, value)
    }
  }

  const queryString = query.toString()
  redirect(`/${locale}/grupper${queryString ? `?${queryString}` : ""}`)
}
