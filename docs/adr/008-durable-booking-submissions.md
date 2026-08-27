# ADR 008: Durable booking submissions in Postgres

**Status:** Deferred pending an evidence trigger
**Date:** 2026-08-26

## Context

The website currently validates room and karaoke booking forms and then posts
them synchronously to Crescat. Crescat is the booking system of record and
staff continue the approval workflow there. The current integration is
documented in [ADR 001](./001-crescat-integration.md).

This contract is adequate when a Crescat failure is returned to the browser:
the website can keep the form populated, report that the booking was not
accepted, and ask the user to retry. It does not cover failures that must be
replayed by us after a deployment or integration fix. The submitted payload is
not persisted before the Crescat request, and a timeout can be ambiguous:
Crescat may have accepted the request even though the website did not receive
the response.

`samfunnetibergen` does not currently own a Postgres connection. The sibling
`kvarteret-personal` service already owns Supabase Postgres through SQLAlchemy
and has a durable email-delivery outbox with idempotency keys, retry state,
leases, and append-only attempt records. It does not currently have a booking
domain or booking API; the website still calls Crescat directly. Its outbox is
a useful implementation reference, but an existing database connection is not
by itself a reason to move an unrelated domain into that service.

Public event submissions are different. Sanity is both the first durable write
and the event system of record. The UI reports failure if that write fails, and
the editorial lifecycle is already persisted on the Sanity `arrangement`
document. This ADR therefore applies to booking submissions, not ordinary
Sanity event submissions.

## Decision

Durable intake is a downstream task, not a current runtime requirement. Keep
the synchronous Crescat call until one of the measurable triggers in
[Review booking delivery before adding durable intake](../how-to/review-booking-delivery.md)
is met or the organization explicitly adopts the stronger product promise.
The remainder of this decision defines the implementation boundary if that
task is activated.

When durable booking intake is implemented, `samfunnetibergen` will own the
booking workflow, Postgres records, and Crescat dispatch. This keeps the form,
authoritative validation, availability checks, Crescat request builder, and
delivery state in one deployable application. Browser validation remains an
early feedback layer; the Next.js server boundary must validate the versioned
payload again before persistence.

The website will receive a server-only Postgres connection. Browser code must
not receive database credentials or connect directly to Postgres. The booking
module will own its migrations and use an isolated `booking` schema and
least-privilege database role. The schema may initially share the existing
physical Postgres cluster, but `kvarteret-personal` must not own or access its
tables. Moving the schema to a separate database later must not change the
booking domain API.

Crescat remains the booking system of record. Postgres records receipt and
delivery state rather than replacing Crescat's approval workflow.

The first successful durable operation will be a Postgres commit:

```text
browser
  -> samfunnetibergen booking endpoint
  -> commit booking_submission in Postgres
  -> attempt delivery to Crescat
  -> record outcome and attempts in Postgres
```

The UI may say that the request was received only after the Postgres commit.
If the commit fails, the UI must report that the request was not received and
retain the form for retry. A client-generated submission UUID must be reused on
retry and protected by a unique constraint, so a committed request followed by
a lost HTTP response does not create a second submission.

### Persistence model

Use one mutable `booking_submissions` row per user submission. Preserve its
original, validated domain payload as versioned JSON; do not overwrite it with
the generated Crescat request body. Replaying after a builder fix must run the
stored domain input through the current, fixed conversion code.

The row should contain at least:

- submission UUID and payload schema version
- immutable submitted payload
- current delivery status (`pending`, `processing`, `delivered`, `failed`, or
  `requires_reconciliation`)
- attempt count and next eligible attempt time
- last error category and a redacted diagnostic summary
- Crescat request identifier when known
- creation and update timestamps

Append one `booking_submission_attempts` row per processing attempt. Attempts
record timing, outcome, failure stage, and the deployed application version.
They are diagnostic history; they are not an event-sourced state model. The
current status on `booking_submissions` remains authoritative.

If a future submission contains several Crescat operations that must retry
independently, add child `booking_submission_items`. Do not introduce them for
the current single-request flows. If email delivery or other independently
retryable effects are later added, keep them in separate outbox rows linked by
the booking submission UUID.

### Processing and replay

The first implementation may attempt Crescat delivery inline after the commit
and provide a manual command or protected administrative action that replays
eligible failed submissions. A continuously running worker, Celery, Temporal,
and a general workflow platform are explicitly deferred. Automated scheduled
dispatch can be added when volume or operational experience requires it.

Retries use the same submission UUID and claim/lease records before processing
so concurrent dispatchers do not intentionally process the same row. This
provides at-least-once processing from our side, not exactly-once creation in
Crescat.

A definite pre-acceptance failure may be retried automatically. A timeout or
connection loss after sending the Crescat POST is an ambiguous outcome because
the reverse-engineered Crescat endpoint has no verified idempotency-key
contract. The organization currently accepts duplicate Crescat requests, so an
activated workflow may automatically retry these outcomes. If duplicate
tolerance changes, ambiguous outcomes must instead enter a
`requires_reconciliation` state.

### Terminology

This is a **durable submission workflow** or **request journal**. The intake
row is not itself a transactional outbox: Postgres and Crescat cannot commit in
one transaction, and there is no local booking state change whose side effect
is atomically enqueued. Email remains a separate durable outbox; it is
transactional only where the email-delivery row is committed in the same
database transaction as the local business change that requires the email.

## Consequences

- Once the UI confirms receipt, responsibility for delivery and replay belongs
  to the system instead of the user.
- Booking submissions can be inspected and replayed after deploying a fix
  without reconstructing personal form data from telemetry.
- A stable submission UUID resolves the ambiguous "database committed but HTTP
  response was lost" case at the intake boundary.
- Crescat timeouts may be retried while duplicate requests remain acceptable;
  otherwise they require reconciliation because Crescat offers no verified
  idempotency contract.
- The website gains a server-only Postgres dependency, migrations, and
  operational responsibility for retry and reconciliation.
- `kvarteret-personal` does not gain a booking boundary, direct Crescat
  dependency, or coordinated deployment requirement.
- Sharing a physical Postgres cluster saves infrastructure while the isolated
  schema, role, and migration ownership preserve the application boundary.
- The database will contain booking contact details and free text. The
  implementation must define access control, retention, redaction, and deletion
  rules before production rollout. Payloads must not be copied into PostHog or
  ordinary logs.
- Sanity event submission and editorial approval remain unchanged and are not
  mirrored into Postgres.

## Alternatives considered

### Keep synchronous Crescat submission only

This remains the simplest user-owned retry model, but it cannot replay stored
requests after a code fix and cannot distinguish all ambiguous Crescat
outcomes. It remains the current implementation until this ADR is implemented.

### Put booking persistence in `kvarteret-personal`

Rejected. Personnel, volunteer applications, mobile cards, and their email
delivery are unrelated to booking. Moving only persistence and Crescat dispatch
there would turn one local workflow into a cross-repository API and deployment
chain without another current consumer. The email outbox pattern should be
copied conceptually rather than used to assign domain ownership.

### Extract a dedicated booking service now

Deferred. A service becomes appropriate when several applications consume
booking, booking needs an independent release or availability boundary, or the
workflow grows substantial staff administration and integrations. Today the
website is the only verified consumer, so a modular booking boundary inside the
Next.js application has lower operational cost.

### Give booking a separate physical database immediately

Deferred. A separate database gives stronger failure and credential isolation,
but an isolated schema and role in the existing cluster provide sufficient
ownership for the initial implementation. The module must avoid cross-schema
queries so the schema remains independently movable.

### Store booking submissions in Sanity

Rejected. Sanity owns public event content, not operational Crescat delivery
state or private booking workflow data.

### Adopt Temporal or Celery now

Rejected for the initial implementation. The workflow is short and its current
recovery requirement is satisfied by Postgres state, attempt rows, a lease, and
a small replay mechanism. A workflow engine can be reconsidered if the process
gains long waits, many independently retryable steps, or substantial operator
coordination.

### Full event sourcing

Rejected. Updating one authoritative submission row and appending attempt
records provides the required auditability without rebuilding state from an
event stream.

## Implementation boundary

This ADR records a future decision and does not change current runtime
behavior. Implementation requires a separate ExecPlan that defines database
provisioning, schema ownership, migrations, retry/reconciliation operations,
PII retention, observability, deployment order, and the change from direct
unrecorded Crescat dispatch to recorded dispatch from the booking module.

Current source evidence:

- `apps/web/src/features/booking/actions/submit-room-booking.ts`
- `apps/web/src/features/karaoke/actions/submit-karaoke-booking.ts`
- `apps/web/src/lib/integrations/crescat/client.ts`

Implementation reference only; these files do not make `kvarteret-personal`
the booking owner:

- `../kvarteret-personal/app/db/session.py`
- `../kvarteret-personal/app/db/table_defs/email_delivery.py`
- `../kvarteret-personal/app/email_outbox_service.py`
- `../kvarteret-personal/docs/reference/external-systems.md`
