# Security Guidance

Use least privilege and source-backed evidence.

- Treat browser input, headers, Sanity content, route params, form submissions,
  third-party responses, and generated client output as untrusted until validated
  at the boundary that consumes them.
- Keep public Sanity reads separate from privileged Sanity mutations. Event
  submission writes draft `arrangement` documents through
  `features/events/actions/submitEvent.ts`; public event display reads approved
  Sanity documents through `lib/sanity/fetch/events.ts`.
- Keep volunteer prospect validation in the Next.js route before forwarding to
  `kvarteret-personal`. The current proxy boundary is
  `app/api/volunteer-prospects/route.ts`.
- Do not put secrets in `NEXT_PUBLIC_*`, docs, prompts, examples, or agent
  instructions. Server-only secrets must stay in server runtime environment
  variables.
- When reviewing a vulnerability, report only exploitable findings with a
  concrete source, sink, missing control, reachable path, and fix. Do not file
  theoretical hardening notes as findings.
- Agent/tool integrations must not treat model output as trusted input. Validate
  tool arguments server-side, require user confirmation for destructive external
  actions, and never put secrets in prompts or tool descriptions.
