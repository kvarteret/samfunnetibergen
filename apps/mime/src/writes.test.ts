import { describe, expect, test } from "vitest"
import { allowedDefinitions, READ_TOOLS, WRITE_TOOLS } from "./sanity"
import {
  isApproval,
  isRejection,
  MAX_OPS,
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
  test("shows the stored operations and who must approve", () => {
    const text = renderPlan({
      id: "ab12cd34",
      requester: "U1",
      summary: "ignored in the rendering",
      ops: [{ tool: "discard_drafts", input: { ids: ["drafts.a"] } }],
    })
    expect(text).toContain("`discard_drafts`")
    expect(text).toContain('"drafts.a"')
    expect(text).toContain("<@U1>")
    expect(text).not.toContain("ignored in the rendering")
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
