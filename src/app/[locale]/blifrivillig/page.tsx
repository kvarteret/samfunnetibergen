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
  const [locale, queryValues] = await Promise.all([
    resolvePageLocale(params),
    searchParams,
  ])
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(queryValues)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item)
      }
    } else if (value !== undefined) {
      query.set(key, value)
    }
  }

  const queryString = query.toString()
  redirect(`/${locale}/grupper${queryString ? `?${queryString}` : ""}`)
}
