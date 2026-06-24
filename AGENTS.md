## Shared Agent Guidance

Read `.agents/README.md` before making repository claims, changing cross-repo
boundaries, or documenting implementation behavior. Generic guidance for
Claude, Codex, and Pi lives under `.agents/`; tool-specific folders should only
contain adapters or runtime wiring.

## ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as
described in `.agents/PLANS.md`) from design to implementation. ExecPlans live
under `.agents/execplans/` and must be maintained in accordance with PLANS.md.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
