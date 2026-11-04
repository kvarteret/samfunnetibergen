import { describe, expect, test } from "vitest"
import { allowedDefinitions, READ_TOOLS, WRITE_TOOLS } from "./sanity"
import {
  buttonDecision,
  isApproval,
  isRejection,
  MAX_OPS,
  planBlocks,
  proposeTool,
  renderPlan,
  validateOps,
} from "./writes"

describe("approval", () => {
  test.each([
    "ja",
    "Ja!",
    "  jA.  ",
    "<@U123> ja",
    "kjør på",
    "OK",
    "godkjent",
  ])("approves %j", text => {
    expect(isApproval(text)).toBe(true)
  })

  test.each([
    "ja, men ikke den siste",
    "kanskje",
    "ja og slett alt",
    "",
    "nei",
    "hva skjer?",
  ])("does not approve %j", text => {
    expect(isApproval(text)).toBe(false)
  })

  test("rejects only clear refusals", () => {
    expect(isRejection("Nei!")).toBe(true)
    expect(isRejection("avbryt")).toBe(true)
    expect(isRejection("nei takk, men ja til den ene")).toBe(false)
  })
})

describe("write tool allowlist", () => {
  const listed = {
    tools: [
      "query_documents",
      "create_documents",
      "patch_documents",
      "publish_documents",
      "unpublish_documents",
      "discard_drafts",
      "deploy_schema",
      "undeploy_schema",
      "create_dataset",
      "update_dataset",
      "add_cors_origin",
      "create_project",
      "run_sanity_cli",
    ].map(name => ({ name, inputSchema: { type: "object" as const } })),
  }

  test("content editing only", () => {
    expect(
      allowedDefinitions(listed, WRITE_TOOLS).tools.map(t => t.name),
    ).toEqual([
      "create_documents",
      "patch_documents",
      "publish_documents",
      "unpublish_documents",
      "discard_drafts",
    ])
  })

  test("reads and writes never overlap", () => {
    for (const name of READ_TOOLS) expect(WRITE_TOOLS.has(name)).toBe(false)
  })
})

const definitions = [
  { name: "patch_documents", inputSchema: { required: ["patches"] } },
  { name: "discard_drafts", inputSchema: { required: ["ids"] } },
]

describe("validateOps", () => {
  test("accepts known tools with required input", () => {
    expect(
      validateOps(
        [{ tool: "discard_drafts", input: { ids: ["drafts.a"] } }],
        definitions,
      ),
    ).toEqual([])
  })

  test("refuses unknown tools, missing input, empty and oversized plans", () => {
    expect(
      validateOps([{ tool: "deploy_schema", input: {} }], definitions)[0],
    ).toContain("ukjent")
    expect(
      validateOps([{ tool: "patch_documents", input: {} }], definitions)[0],
    ).toContain("mangler patches")
    expect(validateOps([], definitions)).toHaveLength(1)
    const many = Array.from({ length: MAX_OPS + 1 }, () => ({
      tool: "discard_drafts",
      input: { ids: ["x"] },
    }))
    expect(validateOps(many, definitions).join(" ")).toContain("Maks")
  })
})

describe("renderPlan", () => {
  test("presents the summary, actions and approval without raw input", () => {
    const plan = {
      id: "ab12cd34",
      requester: "U1",
      summary: "Rydd opp i arrangementene",
      ops: [
        {
          tool: "discard_drafts",
          input: { intent: "Fjern duplikat", ids: ["drafts.a"] },
        },
      ],
    }
    const text = renderPlan(plan)
    expect(text).toContain("Rydd opp i arrangementene")
    expect(text).toContain("Forkast utkast")
    expect(text).toContain("Fjern duplikat")
    expect(text).not.toContain("drafts.a")
    expect(JSON.stringify(planBlocks("Her er forslaget", plan))).toContain(
      '"type":"header"',
    )
  })
})

describe("propose_write_plan", () => {
  const saved: unknown[] = []
  const propose = proposeTool({
    requester: "U1",
    definitions,
    save: plan => {
      saved.push(plan)
      return "plan0001"
    },
  })

  test("stores a valid plan and changes nothing else", async () => {
    const result = await propose.execute?.(
      {
        summary: "Slett duplikat",
        operations: [{ tool: "discard_drafts", input: { ids: ["drafts.a"] } }],
      },
      {} as never,
    )
    expect(result).toMatchObject({ planId: "plan0001" })
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ requester: "U1" })
  })

  test("does not store an invalid plan", async () => {
    saved.length = 0
    const result = await propose.execute?.(
      {
        summary: "x",
        operations: [{ tool: "deploy_schema", input: {} }],
      },
      {} as never,
    )
    expect(result).toHaveProperty("error")
    expect(saved).toHaveLength(0)
  })
})

test("button decisions require the requester and the exact pending plan", () => {
  const plan = { id: "ab12cd34", status: "pending", requester: "U1" }
  expect(buttonDecision(plan, "ab12cd34", "U1")).toBe("allowed")
  expect(buttonDecision(plan, "ab12cd34", "U2")).toBe("forbidden")
  expect(buttonDecision(plan, "deadbeef", "U1")).toBe("stale")
  for (const status of ["expired", "running", "done", "cancelled", "failed"]) {
    expect(buttonDecision({ ...plan, status }, "ab12cd34", "U1")).toBe("stale")
  }
  expect(buttonDecision(undefined, "ab12cd34", "U1")).toBe("stale")
})

test("approval card includes plan-specific Slack buttons", () => {
  const blocks = planBlocks("Forslag", {
    id: "ab12cd34",
    requester: "U1",
    summary: "Oppdater",
    ops: [],
  })
  const actions = blocks.find(block => block.type === "actions")
  expect(actions).toMatchObject({
    elements: [
      { action_id: "mime_plan_approve", value: "ab12cd34", style: "primary" },
      { action_id: "mime_plan_cancel", value: "ab12cd34" },
    ],
  })
})

test("more information starts collapsed and accommodates the maximum plan", () => {
  const ops = Array.from({ length: MAX_OPS }, (_, i) => ({
    tool: "patch_documents",
    input: { intent: `Endring ${i + 1}` },
  }))
  const blocks = planBlocks("Hei!", {
    id: "ab12cd34",
    requester: "U1",
    summary: "Forslag",
    ops,
  })
  const details = blocks.find(block => block.type === "container")
  expect(details).toMatchObject({
    title: { text: "Mer info" },
    is_collapsible: true,
    default_collapsed: true,
  })
  expect(
    details && "child_blocks" in details ? details.child_blocks : undefined,
  ).toHaveLength(9)
  expect(JSON.stringify(details)).toContain("Endring 25")
})

test.each(["running", "done", "cancelled", "expired", "failed"] as const)(
  "%s cards replace decision buttons with a status",
  status => {
    const blocks = planBlocks(
      "Her er forslaget",
      { id: "ab12cd34", requester: "U1", summary: "Oppdater", ops: [] },
      status,
    )
    expect(blocks.some(block => block.type === "actions")).toBe(false)
    expect(blocks.some(block => block.type === "context")).toBe(true)
  },
)

test("escaped long text stays within Slack section limits", () => {
  const ops = Array.from({ length: MAX_OPS }, () => ({
    tool: "patch_documents",
    input: { intent: "&".repeat(500) },
  }))
  const blocks = planBlocks("a".repeat(4000), {
    id: "ab12cd34",
    requester: "U1",
    summary: "&".repeat(1000),
    ops,
  })
  for (const block of blocks) {
    if (block.type === "section" && "text" in block)
      expect(block.text?.text.length).toBeLessThanOrEqual(3000)
    if (block.type === "container" && "child_blocks" in block)
      for (const child of block.child_blocks ?? [])
        expect(child.text?.text.length).toBeLessThanOrEqual(3000)
  }
})

test("approval cards retain the same useful links after a decision", () => {
  const plan = { id: "ab12cd34", requester: "U1", summary: "Oppdater", ops: [] }
  for (const status of ["pending", "done"] as const) {
    const blocks = planBlocks(
      "Se <https://studio.example.no/doc|arrangementet>.",
      plan,
      status,
    )
    expect(JSON.stringify(blocks)).toContain("Nyttige lenker")
    expect(JSON.stringify(blocks)).toContain("https://studio.example.no/doc")
  }
})
