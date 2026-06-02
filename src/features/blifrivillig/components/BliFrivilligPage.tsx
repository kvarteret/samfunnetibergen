import { PortableTextContent } from "@/lib/portable-text-components"
import type { BlifrivilligPageContent } from "@/lib/sanity/fetch"
import type { InstitutionOption, VolunteerGroupContent } from "../content"
import { VolunteerProspectExperience } from "./VolunteerProspectExperience"

export function BliFrivilligPage({
    groups,
    institutionOptions,
    page,
}: {
    groups: VolunteerGroupContent[]
    institutionOptions: InstitutionOption[]
    page: BlifrivilligPageContent | null
}) {
    return (
        <div className="flex flex-col gap-8">
            <PortableTextContent value={page?.description ?? []} />
            <VolunteerProspectExperience
                groups={groups}
                hideHero
                institutionOptions={institutionOptions}
            />
        </div>
    )
}
