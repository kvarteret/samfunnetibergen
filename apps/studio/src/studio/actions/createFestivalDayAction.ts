import { icons } from "@sanity/icons"
import type { DocumentActionProps } from "sanity"
import { useRouter } from "sanity/router"

export function CreateFestivalDayAction(props: DocumentActionProps) {
  const router = useRouter()
  const source = (props.draft ?? props.published) as Record<
    string,
    unknown
  > | null

  if (source?.eventKind !== "festivalParent") return null

  return {
    label: "Legg til festivaldag",
    icon: icons.add,
    onHandle: () => {
      router.navigateIntent("create", [
        {
          mode: "structure",
          template: "festival-day",
          type: "arrangement",
        },
        { parentId: props.id.replace(/^drafts\./, "") },
      ])
      props.onComplete()
    },
  }
}
