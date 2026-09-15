import type { Metadata } from "next"

import { Breadcrumbs } from "@/components/breadcrumbs"

export const metadata: Metadata = {
  robots: { index: false },
}

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Breadcrumbs className="mb-8" path="/design" />
      {children}
    </>
  )
}
