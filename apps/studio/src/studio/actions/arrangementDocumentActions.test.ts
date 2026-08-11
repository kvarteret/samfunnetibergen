import type { DocumentActionComponent } from "sanity"
import { describe, expect, it } from "vitest"

import { arrangementDocumentActions } from "./arrangementDocumentActions"

function action(name: DocumentActionComponent["action"]) {
  const component = (() => null) as DocumentActionComponent
  component.action = name
  return component
}

describe("arrangement document actions", () => {
  it("keeps publish first and schedule last without destructive defaults", () => {
    const actions = arrangementDocumentActions([
      action("delete"),
      action("discardChanges"),
      action("schedule"),
      action("publish"),
    ])

    const builtIns = actions.flatMap(item => (item.action ? [item.action] : []))
    expect(builtIns).toEqual(["publish", "schedule"])
  })
})
