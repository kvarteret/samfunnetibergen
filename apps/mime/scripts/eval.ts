// Runs Mime's model and read tools against evals/cases.json, with each case's
// date pinned, and checks the answers. Uses live Sanity and Azure: run with
// the .dev.vars credentials, e.g. `npm run eval:mime` from the repo root.
//
//   npm run eval:mime                 all cases
//   npm run eval:mime -- today-events one case
//   EVAL_VERBOSE=1 npm run eval:mime   print every answer

import { readFileSync } from "node:fs"
import { generateText, stepCountIs } from "ai"
import { editorialTools } from "../src/editorial"
import {
  createModel,
  type ModelEnv,
  readTools,
  sanityScope,
  webSearchEnabled,
} from "../src/model"
import { systemPrompt } from "../src/prompt"

type Case = {
  id: string
  question: string
  today: string
  expect: {
    tools?: string[]
    /** With `tools`: any one of them is enough. */
    anyTools?: boolean
    mentions?: string[]
    notMentions?: string[]
    /** Words the stored plan's summary must contain (plan tools only). */
    plan?: string[]
  }
}

const cases = JSON.parse(
  readFileSync(new URL("../evals/cases.json", import.meta.url), "utf8"),
) as Case[]
const only = process.argv.slice(2)
const env = process.env as unknown as ModelEnv
env.SANITY_PROJECT_ID ??= "mkjoahvv"
env.SANITY_DATASET ??= "production"
env.STUDIO_URL ??= "https://studio.samfunnetibergen.no"
env.AZURE_OPENAI_LUNA_DEPLOYMENT ??= "skonk"

let failed = 0
for (const item of cases.filter(c => !only.length || only.includes(c.id))) {
  const read = await readTools(env, () => item.today)
  // Plans are captured, never run: evals cannot change Sanity.
  const plans: { summary: string }[] = []
  const planTools = editorialTools({
    scope: sanityScope(env),
    requester: "U0EVAL",
    save: plan => {
      plans.push(plan)
      return `eval${plans.length}`
    },
  })
  const started = Date.now()
  try {
    const result = await generateText({
      model: createModel(env),
      system: systemPrompt({
        projectId: env.SANITY_PROJECT_ID,
        dataset: env.SANITY_DATASET,
        today: item.today,
        studioUrl: env.STUDIO_URL,
        writes: true,
        webSearch: webSearchEnabled(env),
        context: read.context,
        stats: read.stats,
      }),
      prompt: `<@U0EVAL>: ${item.question}`,
      tools: { ...read.tools, ...planTools },
      stopWhen: stepCountIs(25),
    })
    const used = result.steps.flatMap(step =>
      step.toolCalls.map(call => call.toolName),
    )
    const text = result.text.toLowerCase()
    const problems: string[] = []
    const wanted = item.expect.tools ?? []
    const usedWanted = item.expect.anyTools
      ? wanted.some(name => used.includes(name))
      : wanted.every(name => used.includes(name))
    if (wanted.length && !usedWanted)
      problems.push(`tools ${wanted.join(",")} not used`)
    for (const word of item.expect.mentions ?? [])
      if (!text.includes(word.toLowerCase())) problems.push(`missing "${word}"`)
    const planText = plans
      .map(plan => plan.summary)
      .join(" ")
      .toLowerCase()
    for (const word of item.expect.plan ?? [])
      if (!planText.includes(word.toLowerCase()))
        problems.push(`plan missing "${word}"`)
    for (const word of item.expect.notMentions ?? [])
      if (text.includes(word.toLowerCase())) problems.push(`says "${word}"`)
    const seconds = ((Date.now() - started) / 1000).toFixed(1)
    if (problems.length) failed++
    console.log(
      `${problems.length ? "FAIL" : "ok  "} ${item.id} (${seconds}s, ${used.join(" → ") || "no tools"})`,
    )
    if (problems.length || process.env.EVAL_VERBOSE) {
      if (plans.length) console.log(`     plan: ${planText}`)
      console.log(`     ${problems.join("; ")}`)
      console.log(
        `     ${result.text.replace(/\n/g, "\n     ").slice(0, 1500)}`,
      )
    }
  } catch (error) {
    failed++
    console.log(
      `FAIL ${item.id}: ${error instanceof Error ? error.message : error}`,
    )
  } finally {
    await read.close()
  }
}
process.exitCode = failed ? 1 : 0
