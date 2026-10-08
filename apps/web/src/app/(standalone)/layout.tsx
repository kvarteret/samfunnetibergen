import type { ReactNode } from "react"
import { RootDocument, rootMetadata } from "../root-document"

// Standalone pages outside the localized site (app redirect, info screen, link
// in bio) are Norwegian-only.
export const generateMetadata = rootMetadata

export default function StandaloneLayout({
  children,
}: {
  children: ReactNode
}) {
  return <RootDocument lang="nb">{children}</RootDocument>
}
