import type { LaunchGroupContent, LaunchGroupSlug } from "@/lib/volunteer-launch-content"

export function resolveInitialLaunchGroupSlug(
    groups: LaunchGroupContent[],
    requestedGroup: string | string[] | undefined,
) {
    if (typeof requestedGroup !== "string") {
        return undefined
    }

    return groups.some(group => group.slug === requestedGroup)
        ? (requestedGroup as LaunchGroupSlug)
        : undefined
}

export function getLaunchGroupName(groups: LaunchGroupContent[], slug: LaunchGroupSlug | "") {
    if (!slug) {
        return ""
    }

    return groups.find(group => group.slug === slug)?.name ?? ""
}
