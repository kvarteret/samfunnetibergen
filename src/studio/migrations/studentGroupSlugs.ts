import { studentGroupSlugFromName } from "../groupSlugs"

type StudentGroupDocument = {
  _id: string
  _type: "studentGroup"
  name?: string
  slug?: { current?: string }
}

export function buildStudentGroupSlugPatch(document: StudentGroupDocument) {
  if (!document.name?.trim()) return {}

  const current = document.slug?.current
  const canonical = studentGroupSlugFromName(document.name)
  if (!canonical || current === canonical) return {}

  return {
    slug: {
      _type: "slug",
      current: canonical,
    },
  }
}
