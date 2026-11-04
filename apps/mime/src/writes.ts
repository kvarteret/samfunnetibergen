import { tool } from "ai"
import { z } from "zod"

/**
 * Write access, with a human in the loop.
 *
 * The model never gets write tools. It can only call `propose_write_plan`,
 * which stores a plan. Code executes the stored operations, at most once,
 * after the person who asked replies "ja" in the thread. What runs is what was
 * stored and posted to the thread, not what the model says about it.
 */

export const MAX_OPS = 25
export const PLAN_TTL_MS = 60 * 60 * 1000

export type WriteOp = { tool: string; input: Record<string, unknown> }

export type Plan = {
  id: string
  requester: string
  summary: string
  ops: WriteOp[]
}

export type PlanStatus =
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "cancelled"
  | "expired"

const APPROVE = new Set([
  "ja",
  "jepp",
  "yes",
  "ok",
  "okay",
  "kjør",
  "kjør på",
  "gjør det",
  "godkjent",
  "godkjenn",
  "bekreft",
  "bekreftet",
])
const REJECT = new Set(["nei", "no", "avbryt", "stopp", "cancel"])

/** The reply text without Slack mentions, case or trailing punctuation. */
function normalize(text: string) {
  return text
    .replace(/<@[A-Z0-9]+>/g, " ")
    .replace(/[\s.!?,:;]+/g, " ")
    .trim()
    .toLowerCase()
}

export const isApproval = (text: string) => APPROVE.has(normalize(text))
export const isRejection = (text: string) => REJECT.has(normalize(text))

export function validateOps(
  ops: WriteOp[],
  definitions: { name: string; inputSchema: { required?: unknown } }[],
): string[] {
  const problems: string[] = []
  if (!ops.length) problems.push("Planen har ingen operasjoner.")
  if (ops.length > MAX_OPS)
    problems.push(`Maks ${MAX_OPS} operasjoner per plan; del opp.`)
  for (const [index, op] of ops.entries()) {
    const definition = definitions.find(d => d.name === op.tool)
    if (!definition) {
      problems.push(`Operasjon ${index + 1}: ukjent verktøy ${op.tool}.`)
      continue
    }
    const required = (definition.inputSchema.required as string[]) ?? []
    for (const key of required)
      if (!(key in op.input))
        problems.push(`Operasjon ${index + 1} (${op.tool}): mangler ${key}.`)
  }
  return problems
}

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max)}…` : text

/** What will run, exactly, for the thread to review. Written by code. */
export function renderPlan(plan: Plan) {
  const lines = plan.ops.map(
    (op, index) =>
      `${index + 1}. \`${op.tool}\` ${clip(JSON.stringify(op.input), 400)}`,
  )
  return [
    `*Plan ${plan.id}* (${plan.ops.length} operasjon${plan.ops.length === 1 ? "" : "er"}). Dette kjøres nøyaktig slik:`,
    ...lines,
    "",
    `<@${plan.requester}>: svar *ja* for å kjøre, eller *nei* for å avbryte. Planen utløper om en time.`,
  ].join("\n")
}

export function parsePlan(raw: string): WriteOp[] {
  return JSON.parse(raw) as WriteOp[]
}

type ToolInput = {
  summary: string
  operations: { tool: string; input: Record<string, unknown> }[]
}

/**
 * The only write-related tool the model sees. `save` stores the plan and
 * returns its id; nothing is changed in Sanity here.
 */
export function proposeTool(options: {
  requester: string
  definitions: { name: string; description?: string; inputSchema: unknown }[]
  save: (plan: Omit<Plan, "id">) => string
}) {
  const catalogue = options.definitions
    .map(
      d =>
        `- ${d.name}: ${clip(d.description ?? "", 300)} Input: ${clip(JSON.stringify(d.inputSchema), 900)}`,
    )
    .join("\n")
  return tool({
    description: `Foreslå en plan for å endre innhold i Sanity. Ingenting endres før personen som spurte svarer "ja" i tråden. Maks ${MAX_OPS} operasjoner. Slå opp dokumentene først, og bruk eksakte id-er. Tilgjengelige operasjoner (prosjekt og datasett legges til automatisk):\n${catalogue}`,
    inputSchema: z.object({
      summary: z.string().describe("Kort sammendrag av hva planen gjør."),
      operations: z
        .array(
          z.object({
            tool: z.string(),
            input: z.record(z.string(), z.unknown()),
          }),
        )
        .describe("Operasjonene i rekkefølge."),
    }),
    execute: async ({ summary, operations }: ToolInput) => {
      const problems = validateOps(operations, options.definitions as never)
      if (problems.length) return { error: problems.join(" ") }
      const id = options.save({
        requester: options.requester,
        summary,
        ops: operations,
      })
      return {
        planId: id,
        status: "venter på godkjenning",
        note: "Planen vises i tråden av systemet. Be personen svare «ja» eller «nei». Ikke si at noe er endret.",
      }
    },
  })
}
