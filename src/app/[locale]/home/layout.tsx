import Link from "next/link"

export default async function HomeLayout({
  children,
  params,
}: LayoutProps<"/[locale]/home">) {
  const { locale } = await params
  return (
    <div>
      {children}
      <nav className="fixed bottom-10 left-32 right-32 flex justify-center gap-2">
        <Link
          href={`/${locale}/home/forslag1`}
          className="p-2 rounded bg-destructive"
        >
          FORSLAG 1
        </Link>
        <Link
          href={`/${locale}/home/forslag2`}
          className="p-2 rounded bg-destructive"
        >
          FORSLAG 2
        </Link>
      </nav>
    </div>
  )
}
