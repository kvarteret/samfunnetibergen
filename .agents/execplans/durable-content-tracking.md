# Add durable Sanity identities to content tracking

This ExecPlan is a living document and follows `.agents/PLANS.md`.

## Purpose / Big Picture

Analytics reports should continue to group the same arrangement, room, or student group together when its title, translation, punctuation, or slug changes. After this change, each detail-page view emits a dedicated `content_page_viewed` event with the Sanity document ID, and existing interaction events retain their readable title and slug while also carrying the stable ID.

## Progress

- [x] (2026-09-16) Verified current tracking and Sanity query behavior.
- [x] (2026-09-16) Add shared content page-view tracking and stable room attributes.
- [x] (2026-09-16) Add stable IDs to arrangement and group interaction payloads.
- [x] (2026-09-16) Add focused tests and run type generation and verification.
- [ ] Commit, open the pull request, wait for CI, and merge.

## Surprises & Discoveries

- Arrangement and group detail pages already render `data-*-id`, but automatic PostHog `$pageview` capture does not receive those DOM attributes as event properties.
- Arrangement ticket and Facebook events currently send only title and slug.
- The room detail query did not project `_id`, so room tracking required a query-shape change.

## Decision Log

- Decision: Keep automatic `$pageview` capture unchanged and add a dedicated `content_page_viewed` event for durable content reporting. Rationale: disabling global automatic pageviews would require reimplementing tracking for every route and could create unrelated regressions; the dedicated event is explicit and queryable. Date/Author: 2026-09-16, Codex.
- Decision: Use `content_id`, `content_type`, `content_slug`, `content_title`, and `locale` consistently. Rationale: one cross-content schema makes dashboards reusable while preserving existing event-specific properties. Date/Author: 2026-09-16, Codex.

## Outcomes & Retrospective

To be completed after verification and merge.

Implementation note: the dedicated event is emitted from the three detail-page
routes and interaction payloads remain backward compatible because their old
title and slug properties are retained.

## Context and Orientation

Sanity is the source of truth for arrangements, rooms, and student groups. Arrangement pages live under `apps/web/src/app/[locale]/arrangementer/`, room pages under `apps/web/src/app/[locale]/rom/`, and group pages under `apps/web/src/app/[locale]/grupper/`. PostHog is initialized in `apps/web/instrumentation-client.ts`; custom browser events use `posthog.capture`.

## Plan of Work

Add a small client component that emits `content_page_viewed` once when a detail page mounts. Render it on arrangement, room, and group detail pages with the Sanity `_id`, resolved title, slug, and locale. Project `_id` in the room detail query. Add `event_id` to arrangement link events and `group_id` to group volunteer form events. Add tests for the shared tracking payload and the updated query contract where practical.

## Concrete Steps

Work from `/Users/kluvin/dev/kvarteret/samfunnetibergen`. Run the focused web tests and typecheck, then the relevant build if feasible. Review the diff, commit only task changes, push a `codex/` branch, create a PR, wait for its checks, and merge it.

## Validation and Acceptance

The focused tests must pass, TypeScript must accept the new room `_id` and component props, and the web build must complete. A manual or test inspection must show that all three detail-page paths emit `content_page_viewed` with their Sanity IDs and that arrangement/group interactions retain their old fields plus stable IDs.

## Idempotence and Recovery

The new event is additive and does not alter existing event names or historical data. If CI identifies a baseline failure, isolate it from touched files before deciding whether further changes are needed. The commit can be reverted without a data migration.

## Artifacts and Notes

Expected durable properties:

    { content_type: "arrangement" | "room" | "group", content_id, content_slug, content_title, locale }

## Interfaces and Dependencies

Use the existing `posthog-js` dependency and existing Sanity `defineQuery`/`ClientReturn` type flow. Do not add a new analytics SDK or mutate Sanity content for this code change.
