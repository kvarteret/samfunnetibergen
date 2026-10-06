# Choosing Personal data for the PostHog warehouse

This is a proposed sync policy for PostHog project **202551**, reviewed on
2026-10-06. It documents the connection evidence and recommended scope; merging
this document does not change PostHog or database permissions.

## Connection evidence

The workspace's `posthog-warehouse-report.md` reports a Supabase source with
prefix `supabase`, syncing `public.event_interest` and
`public.event_interest_clicks` by full refresh every six hours. Both reportedly
completed, with 105 rows in the clicks table at setup time. These are historical
setup observations, not current health checks. The report leaves Linear pending
authorization. No other source is claimed as verified here.

The supplied [Supabase schemas page](https://eu.posthog.com/project/202551/data-management/sources/managed-01a11045-99db-0000-8ae7-bdd28ab845a5/schemas)
and screenshot show discovered public tables and a warehouse table label beneath
`event_interest_clicks`. Discovery and selection checkboxes alone do not prove
that a table is actively syncing. Live source state could not be independently
checked: the PostHog connector lacks `external_data_source:read` and browser
access was unavailable.

## Repeated Supabase prefix

The second supplied screenshot shows the complete warehouse label
`supabase.supabase.public__event_interest_clicks`. The setup report records a
configured prefix of `supabase`. A provider namespace combined with that prefix
is a plausible explanation for the repetition, but the exact naming mechanism
and SQL identifier have not been verified. The label alone does not prove
duplicate sources or duplicate ingestion.

For a new connection, `personal` is a clearer proposed prefix because it names
the dataset rather than repeating the provider. Before changing an existing
connection, inspect its configured prefix, the actual SQL identifier, other
sources syncing the same table, and saved queries or dashboards that reference
it. Do not delete and recreate a working source just to tidy its display label.
No prefix change is included in this PR.

## Recommended selection

A warehouse normally combines product events with a deliberately selected subset
of business facts: conversion outcomes, cohort counts, reference dimensions,
and delivery reliability. It does not need a copy of every operational table.
For Personal, prefer exports that remove sensitive columns **before ingestion**.
Filtering a PostHog query after importing raw rows does not prevent disclosure.

| Personal tables | Recommendation | Useful analytics and privacy considerations |
| --- | --- | --- |
| `groups`, `courses`, `assignment_roles`, `group_course_requirements` | First candidates; use explicit column lists | Group/course/role IDs and reviewed labels support breakdowns. Omit free-text descriptions and unnecessary internal fields. Group requirements contain no individual volunteer IDs. |
| `event_interest_clicks` | Prefer an aggregate export over raw sync | Export event ID and total accepted clicks for unexpired batches. Exclude `source_hash` and `batch_id`. Counts measure clicks, not visitors or attendance. |
| `event_interest` | Leave out of new analytics; investigate existing legacy sync | Legacy taps were copied into the clicks table by migration `20261001_1500`; combining both tables can double-count them. It also contains `source_hash`. |
| `role_assignments`, `course_completions` | Aggregate only | Counts by semester/group/course answer staffing and training questions. Raw rows identify volunteers and expose assignment history, course history, and contract status. |
| `volunteer_application_invites`, `volunteer_application_submissions` | Aggregate or narrowly curated export only | Recruitment cohort sizes, trial starts, and promotions are useful. Raw rows contain invitation tokens, contact information, demographics, address, application text, and profile/card references. |
| `domain_events` | Aggregate selected event types only | Recruitment transition counts are useful; raw events contain actor/subject IDs and arbitrary JSON. Current workflow payloads include email addresses. |
| `email_deliveries`, `email_delivery_attempts` | Aggregate reliability export | Counts by date/template/status/error category and latency summaries are useful. Deliveries include recipient email, business IDs and encrypted context. Attempts have less direct personal data, but their delivery IDs permit linkage. |
| `volunteer_records`, `volunteer_next_of_kin`, `volunteer_photos`, `volunteer_cards` | Exclude raw tables | Names, email, phone, birth date, gender, addresses, emergency contacts, photo references, and card numbers are unnecessary for product analytics. |
| `user_accounts`, `group_admin_memberships`, `web_sessions`, `auth.*` | Exclude raw tables | Account identity, permissions, session identifiers, IP/user-agent data, and authentication material belong in the operational system. |
| `integration_tokens`, `mobile_card_access_codes`, `mobile_card_trial_access_codes`, application invitation tokens | Exclude | Refresh tokens and access-code hashes remain security-sensitive even when hashed. |
| `mobile_card_april_state`, `rate_limits`, `alembic_version`, prospect idempotency/submission bookkeeping, Supabase infrastructure schemas | Leave out | Operational configuration, coordination, or infrastructure rather than useful business facts. |
| `board_game_matchmaking` | Leave out pending schema review | Visible in the screenshot but not defined in either reviewed Personal checkout. Its columns and active ownership are unverified. |

These exports are proposals, not existing database objects. Implement them in the
Personal repository, using connector-supported views if verified or dedicated
export tables. Do not enable the raw source tables as a substitute.

## Privacy and retention

The website creates a separate signed cookie per event and sends its HMAC digest
as `source_hash`. This is an event-scoped pseudonymous identifier, not an email
hash or a universal browser identity. It still distinguishes repeated activity
within an event. There is no need to send it to PostHog for aggregate click totals
or to link it to PostHog persons.

Personal click batches expire after 90 days. An aggregate export should filter
`expires_at > now()` and describe its result as a rolling retained total. The
table has no explicit `created_at`; avoid presenting expiry-derived dates as
verified click timestamps, especially for migrated rows. Historical immutable
daily statistics would require a separately designed capture and retention policy.

Small group/cohort counts can identify individuals even after names are removed.
Use coarse time buckets, avoid demographic breakdowns by default, and suppress or
combine small cells. A threshold such as five is a starting policy choice, not a
guarantee of anonymity; repeated snapshots can reveal individual changes.

Use a dedicated read-only database role limited to approved exports. The
operational owner/service connection recommended for application deployment is
not the recommended warehouse credential. Explicit column lists prevent a future
personal-data column from silently entering the export. Review the existing
source's actual role and grants rather than assuming its access is restricted.

PostHog's [sync-method documentation](https://posthog.com/docs/cdp/sources#sync-methods)
describes full refresh as reloading the table and reflecting source deletions;
ordinary incremental and append-only syncs do not capture deletes. Six-hour full
refresh is a reasonable starting point for small exports, with deletion lag and
load measured in practice. Validate empty-table refreshes and expired-row removal;
pausing a sync alone should not be treated as deleting data already imported.
Also review saved exports, downstream copies, and applicable PostHog retention
when handling erasure. EU hosting alone does not establish GDPR compliance:
record the analytics purpose, lawful basis, processor agreement, access policy,
and retention before expanding into person-level recruitment or volunteer data.

## Source evidence

The review used the Personal schema definitions under
`app/domain/{groups,courses,role_assignments,volunteers,volunteer_applications,admin_accounts,mobile_card,spotify}/tables.py`,
`app/db/table_defs/email_delivery.py`, and the email-bearing payload in
`app/domain/volunteer_applications/workflow.py` in the local
`kvarteret-personal` checkout. That checkout has uncommitted work, so it is evidence
of local schemas, not proof of production deployment.

The clean `kvarteret-personal-event-interest` checkout supplies
`app/domain/event_interest/tables.py`, migration
`migrations/versions/20261001_1500_event_interest_clicks.py`, and
`scripts/cleanup_event_interest.py`. Website cookie derivation is in
`apps/web/src/features/event-interest/server/source.ts`; its analytics helper is
`apps/web/src/features/event-interest/components/analytics.ts`. See the
[event-interest runbook](../how-to/event-interest.md) for the persistence and
browser analytics distinction, and PostHog's
[Supabase connector documentation](https://posthog.com/docs/data-warehouse/sources/supabase)
for the supported connection setup.
