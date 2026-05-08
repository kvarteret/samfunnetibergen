import type { VolunteerGroupContent, VolunteerGroupSlug } from "@/lib/volunteer-group-content"

export function getVolunteerGroupName(
    groups: VolunteerGroupContent[],
    slug: VolunteerGroupSlug | "",
) {
    if (!slug) {
        return ""
    }

    return groups.find(group => group.slug === slug)?.name ?? ""
}
