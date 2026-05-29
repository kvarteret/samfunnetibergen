---
name: security-audit
description: Focused security audit for this Next.js, Sanity, Vercel, and sibling-API surface. Use when asked to audit, review security, check for XSS, SSRF, IDOR, injection, auth, secrets, unsafe agent/tool behavior, or vulnerable route handlers.
---

# Security Audit

Find real, reachable vulnerabilities. Do not report theoretical hardening notes
as findings.

## Method

For each candidate finding, prove:

1. Source: the concrete untrusted input, such as request body, query string,
   header, route param, Sanity document content, third-party response, or model
   tool output.
2. Sink: the concrete effect, such as a Sanity mutation, outbound fetch, rendered
   HTML/Markdown, response header, filesystem access, shell command, or sibling
   API call.
3. Missing control: validation, authorization, escaping, allowlist,
   parameterization, CSRF protection, confirmation, or secret isolation.
4. Reachability: the route, server action, component path, or workflow that calls
   it.

If any step cannot be proven, drop the finding.

## Priority Areas

- Route handlers under `app/api/`, especially proxy routes and third-party
  fetches.
- Server actions under `app/actions/` and `features/*/actions/`.
- Sanity mutations and approval state changes.
- Portable Text rendering and any Markdown/HTML rendering.
- Environment variable usage, especially `NEXT_PUBLIC_*`.
- Agent/tool workflows that combine private context, untrusted content, and
  external actions.

## Output

Report findings first, ordered by severity. Each finding must include:

- severity
- file path and line
- source-to-sink data flow
- exploit sketch or concrete bad request
- minimal fix
- confidence and assumptions
