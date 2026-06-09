import { redirect } from "next/navigation"

export default async function Home({ params }: PageProps<"/[locale]/home">) {
  const { locale } = await params

  redirect(`/${locale}/home/forslag1`)
}
