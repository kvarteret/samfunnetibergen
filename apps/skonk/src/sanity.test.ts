import type { ModelMessage } from "ai"
import { describe, expect, test, vi } from "vitest"
import { trimHistory } from "./history"
import { allowedDefinitions, scopeTools } from "./sanity"

const schema = (extra: Record<string, unknown> = {}) => ({
  type: "object" as const,
  properties: {
    projectId: { type: "string" },
    dataset: { type: "string" },
    ...extra,
  },
  required: ["projectId", "dataset", ...Object.keys(extra)],
})

describe("allowedDefinitions", () => {
  const listed = {
    tools: [
      { name: "query_documents", inputSchema: schema({ query: {} }) },
      { name: "get_document", inputSchema: schema({ documentId: {} }) },
      { name: "patch_documents", inputSchema: schema({ patches: {} }) },
      { name: "deploy_schema", inputSchema: schema() },
      { name: "create_project", inputSchema: schema() },
    ],
  }

  test("offers only read tools", () => {
    expect(allowedDefinitions(listed).tools.map(tool => tool.name)).toEqual([
      "query_documents",
      "get_document",
    ])
  })

  test("hides the fixed project and dataset from the model", () => {
    const [query] = allowedDefinitions(listed).tools
    expect(Object.keys(query.inputSchema.properties ?? {})).toEqual(["query"])
    expect(query.inputSchema.required).toEqual(["query"])
  })
})

test("scopeTools forces the project and dataset on every call", async () => {
  const execute = vi.fn(async () => "ok")
  const tools = scopeTools(
    { query_documents: { inputSchema: {} as never, execute } },
    { projectId: "mkjoahvv", dataset: "production" },
  )
  await tools.query_documents.execute?.(
    { query: "*[0]", projectId: "evil", dataset: "other" },
    {} as never,
  )
  expect(execute).toHaveBeenCalledWith(
    { query: "*[0]", projectId: "mkjoahvv", dataset: "production" },
    {},
  )
})

describe("trimHistory", () => {
  const turn = (text: string): ModelMessage[] => [
    { role: "user", content: text },
    { role: "assistant", content: `svar på ${text}` },
  ]

  test("keeps everything within budget", () => {
    const messages = [...turn("a"), ...turn("b")]
    expect(trimHistory(messages)).toEqual(messages)
  })

  test("drops the oldest whole turns first", () => {
    const messages = [...turn("a".repeat(500)), ...turn("b")]
    expect(trimHistory(messages, 200)).toEqual(turn("b"))
  })

  test("always keeps the newest turn", () => {
    const messages = [...turn("a"), ...turn("b".repeat(500))]
    expect(trimHistory(messages, 10)).toEqual(turn("b".repeat(500)))
  })
})
