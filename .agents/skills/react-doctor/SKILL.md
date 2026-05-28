---
name: react-doctor
description: Diagnose React codebase health issues. Use when reviewing React code, fixing performance problems, auditing security, or improving code quality.
version: 1.0.0
source: Adapted from PostHog .agents/skills/react-doctor.
---

# React Doctor

Scans a React codebase for security, performance, correctness, and architecture
issues. Outputs a 0-100 score with diagnostics.

## Usage

```bash
npx -y react-doctor@latest . --verbose
```

## Workflow

1. Run the command at the repo root.
2. Read every diagnostic with file paths and line numbers.
3. Fix errors before lower-severity issues.
4. Re-run to verify the score improved.

## Rule Areas

- Security: hardcoded secrets in the client bundle, `eval`.
- State and effects: derived state in effects, missing cleanup, cascading state.
- Architecture: components inside components, large components, inline render
  functions.
- Performance: layout property animations, `transition-all`, large blur values.
- Correctness: array index keys, conditional rendering bugs.
- Next.js: missing metadata, client-side fetching for server data, async client
  components.
- Bundle size: barrel imports, heavy dependencies, missing code splitting.
- Accessibility: missing reduced-motion handling.
- Dead code: unused files, exports, and types.

## Score

- 75+: good
- 50-74: needs work
- 0-49: critical
