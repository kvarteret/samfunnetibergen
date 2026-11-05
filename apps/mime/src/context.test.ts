import { describe, expect, test, vi } from "vitest"
import {
  CONTEXT_TOOLS,
  contextDefinitions,
  contextOptions,
  prefixTools,
} from "./context"

const input = (properties: Record<string, unknown>) => ({
  type: "object" as const,
  properties,
  required: Object.keys(properties),
})

// What a GROQ-mode endpoint lists, plus a tool Mime has not allowlisted.
const listed = {
  tools: [
    {
      name: "initial_context",
      description: "Compressed schema overview.",
      inputSchema: input({}),
    },
    {
      name: "groq_query",
      description: "Executes a GROQ query.",
      inputSchema: input({ query: { type: "string" }, params: {} }),
    },
    { name: "schema_explorer", inputSchema: input({ type: {} }) },
    {
      name: "array_field_reader",
      description: "Reads large array fields.",
      inputSchema: input({ documentId: {}, path: {} }),
    },
    {
      name: "experimental_write",
      description: "Not allowlisted.",
      inputSchema: input({}),
    },
  ],
  nextCursor: undefined,
}

describe("contextDefinitions", () => {
  test("offers only allowlisted tools, under their server names", () => {
    expect(contextDefinitions(listed).tools.map(tool => tool.name)).toEqual([
      "initial_context",
      "groq_query",
      "schema_explorer",
      "array_field_reader",
    ])
  })

  test("puts Mime's guidance before the server's description", () => {
    const tools = contextDefinitions(listed).tools
    const groq = tools.find(tool => tool.name === "groq_query")
    expect(groq?.description).toBe(
      `${CONTEXT_TOOLS.groq_query}\n\nExecutes a GROQ query.`,
    )
    expect(groq?.description).toContain("finn arrangementet om X")
    const explorer = tools.find(tool => tool.name === "schema_explorer")
    expect(explorer?.description).toBe(CONTEXT_TOOLS.schema_explorer)
  })

  test("keeps the server's input schema untouched", () => {
    const groq = contextDefinitions(listed).tools.find(
      tool => tool.name === "groq_query",
    )
    expect(groq?.inputSchema).toEqual(listed.tools[1].inputSchema)
  })

  test("serves Knowledge Base tools when the endpoint lists them", () => {
    const kb = {
      tools: [
        { name: "knowledge_base_search", inputSchema: input({ query: {} }) },
        { name: "knowledge_base_read", inputSchema: input({ paths: {} }) },
      ],
    }
    expect(contextDefinitions(kb).tools.map(tool => tool.name)).toEqual([
      "knowledge_base_search",
      "knowledge_base_read",
    ])
  })

  test("ignores inherited object keys", () => {
    const odd = { tools: [{ name: "toString", inputSchema: input({}) }] }
    expect(contextDefinitions(odd).tools).toEqual([])
  })
})

test("prefixTools renames tools and keeps their execute", async () => {
  const execute = vi.fn(async () => "ok")
  const tools = prefixTools({
    groq_query: { inputSchema: {} as never, execute },
  })
  expect(Object.keys(tools)).toEqual(["context_groq_query"])
  await tools.context_groq_query.execute?.({ query: "*[0]" }, {} as never)
  expect(execute).toHaveBeenCalledWith({ query: "*[0]" }, {})
})

describe("contextOptions", () => {
  const url =
    "https://api.sanity.io/v2026-11-03/context/organizations/ohrUT7FPF/mcp/mime"

  test("is undefined unless both values are set", () => {
    expect(contextOptions({})).toBeUndefined()
    expect(contextOptions({ SANITY_CONTEXT_MCP_URL: url })).toBeUndefined()
    expect(contextOptions({ SANITY_CONTEXT_TOKEN: "sk" })).toBeUndefined()
    expect(
      contextOptions({
        SANITY_CONTEXT_MCP_URL: " ",
        SANITY_CONTEXT_TOKEN: "sk",
      }),
    ).toBeUndefined()
  })

  test("returns the trimmed url and token", () => {
    expect(
      contextOptions({
        SANITY_CONTEXT_MCP_URL: ` ${url}\n`,
        SANITY_CONTEXT_TOKEN: "sk\n",
      }),
    ).toEqual({ url, token: "sk" })
  })
})
