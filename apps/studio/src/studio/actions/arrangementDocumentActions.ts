import type {
  DocumentActionComponent,
  DocumentActionDescription,
  DocumentActionProps,
} from "sanity"

import {
  arrangementEventStatusActions,
  arrangementRequestActions,
} from "./approvalActions"
import { CreateFestivalDayAction } from "./createFestivalDayAction"

function approvedAction(
  action: DocumentActionComponent,
  overrides: Pick<DocumentActionDescription, "label" | "tone">,
): DocumentActionComponent {
  const ApprovedAction = (props: DocumentActionProps) => {
    const description = action(props)
    const source = props.draft ?? props.published
    if (source?.approvalStatus !== "approved" || !description) return null
    return { ...description, ...overrides }
  }
  ApprovedAction.action = action.action
  ApprovedAction.displayName = `Approved${action.displayName ?? "Action"}`
  return ApprovedAction
}

export function arrangementDocumentActions(
  previous: DocumentActionComponent[],
): DocumentActionComponent[] {
  const publish = previous.find(action => action.action === "publish")
  const schedule = previous.find(action => action.action === "schedule")

  return [
    ...arrangementRequestActions,
    ...(publish
      ? [
          approvedAction(publish, {
            label: "Publiser endringer",
            tone: "positive",
          }),
        ]
      : []),
    ...arrangementEventStatusActions,
    CreateFestivalDayAction,
    ...(schedule
      ? [
          approvedAction(schedule, {
            label: "Planlegg publisering",
            tone: "positive",
          }),
        ]
      : []),
  ]
}
