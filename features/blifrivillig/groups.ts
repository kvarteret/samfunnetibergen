import type { VolunteerGroupContent, VolunteerGroupSlug } from "@/features/blifrivillig/content"

export function getVolunteerGroupName(
    groups: VolunteerGroupContent[],
    slug: VolunteerGroupSlug | "",
) {
    if (!slug) {
        return ""
    }

    return groups.find(group => group.slug === slug)?.name ?? ""
}
