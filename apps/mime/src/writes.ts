import { tool } from "ai"
import { z } from "zod"

/**
 * Write access, with a human in the loop.
 *
 * The model never gets write tools. It can only call `propose_write_plan`,
 * which stores a plan. Code executes the stored operations, at most once,
 * after the person who asked approves with a button or a tagged reply. The stored
 * operations run, not a model-generated description of them.
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

/** Bind a button to its exact pending plan and the person who requested it. */
export function buttonDecision(
  plan: { id: string; status: string; requester: string } | undefined,
  planId: string,
  user: string,
) {
  if (!plan || plan.id !== planId || plan.status !== "pending") return "stale"
  if (plan.requester !== user) return "forbidden"
  return "allowed"
}

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

const OP_LABELS: Record<string, string> = {
  create_documents: "Opprett dokumenter",
  patch_documents: "Endre dokumenter",
  publish_documents: "Publiser dokumenter",
  unpublish_documents: "Avpubliser dokumenter",
  discard_drafts: "Forkast utkast",
}

export const operationLabel = (tool: string) =>
  OP_LABELS[tool] ?? "Utfør endring"

const STATUS_TEXT: Record<Exclude<PlanStatus, "pending">, string> = {
  running: "Jeg gjør endringene nå …",
  done: "Ferdig! Endringene er gjennomført.",
  cancelled: "Avbrutt. Ingen endringer ble gjort.",
  expired: "Dette forslaget har utløpt. Be meg gjerne lage et nytt.",
  failed: "Jeg måtte stoppe. Se meldingen under for hva som ble gjort.",
}

const escapeSlack = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** A compact review of the stored operations, without pretending to show every field. */
export function renderPlan(plan: Plan) {
  const lines = plan.ops.map((op, index) => {
    const label = operationLabel(op.tool)
    const intent =
      typeof op.input.intent === "string" ? op.input.intent.trim() : ""
    return `${index + 1}. *${escapeSlack(label)}*${intent ? `\n${escapeSlack(clip(intent, 160))}` : ""}`
  })
  return [
    `*Forslag til endringer*`,
    escapeSlack(clip(plan.summary, 500)),
    ...lines,
  ]
    .filter(Boolean)
    .join("\n\n")
}

/** Block Kit separates the response, plan and approval instructions visually. */
export function planBlocks(
  answer: string,
  plan: Plan,
  status: PlanStatus = "pending",
) {
  const operations = plan.ops.map((op, index) => {
    const label = escapeSlack(operationLabel(op.tool))
    const intent =
      typeof op.input.intent === "string" ? op.input.intent.trim() : ""
    return `${index + 1}. *${label}*${intent ? `\n${escapeSlack(clip(intent, 160))}` : ""}`
  })
  // Slack allows at most ten child blocks in a container. Three concise
  // operations per section keep even the maximum-size plan within that limit.
  const detailBlocks = Array.from(
    { length: Math.ceil(operations.length / 3) },
    (_, index) => ({
      type: "section",
      text: {
        type: "mrkdwn",
        text: operations.slice(index * 3, index * 3 + 3).join("\n\n"),
      },
    }),
  )
  return [
    { type: "section", text: { type: "mrkdwn", text: clip(answer, 2900) } },
    { type: "divider" },
    {
      type: "header",
      text: { type: "plain_text", text: "Dette foreslår jeg" },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: escapeSlack(clip(plan.summary, 500)) || "Se endringene under.",
      },
    },
    {
      type: "container",
      title: { type: "plain_text", text: "Mer info" },
      is_collapsible: true,
      default_collapsed: true,
      child_blocks: detailBlocks.length
        ? detailBlocks
        : [
            {
              type: "section",
              text: { type: "mrkdwn", text: "Ingen endringer er lagt til." },
            },
          ],
    },
    ...(status === "pending"
      ? [
          {
            type: "actions",
            elements: [
              {
                type: "button",
                action_id: "mime_plan_approve",
                value: plan.id,
                style: "primary",
                text: { type: "plain_text", text: "Godkjenn" },
              },
              {
                type: "button",
                action_id: "mime_plan_cancel",
                value: plan.id,
                text: { type: "plain_text", text: "Avbryt" },
              },
            ],
          },
        ]
      : [
          {
            type: "context",
            elements: [{ type: "mrkdwn", text: STATUS_TEXT[status] }],
          },
        ]),
  ]
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
    description: `Foreslå en plan for å endre innhold i Sanity. Ingenting endres før personen som spurte godkjenner planen. Maks ${MAX_OPS} operasjoner. Slå opp dokumentene først, og bruk eksakte id-er. Tilgjengelige operasjoner (prosjekt og datasett legges til automatisk):\n${catalogue}`,
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
        note: "Planen vises i tråden av systemet. Ikke gjenta godkjenningsinstruksjonene; systemet viser dem. Ikke si at noe er endret.",
      }
    },
  })
}
