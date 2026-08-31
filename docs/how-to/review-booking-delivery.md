# Review booking delivery before adding durable intake

The website currently owns validation and calls Crescat synchronously. Crescat
remains the booking system of record. The browser shows success only after the
Crescat endpoint returns HTTP 200 or 201; otherwise the populated form remains
available and asks the user to retry.

This review determines whether durable booking intake should become an
implementation task. It does not require a booking queue today.

## Review the evidence

Review the booking dashboard monthly during active booking periods and after a
reported Crescat outage:

- [Analytics basics dashboard](https://eu.posthog.com/project/202551/dashboard/749502)
- [Booking failure rate](https://eu.posthog.com/project/202551/insights/ieoIdxV0)
- [Booking submissions over time](https://eu.posthog.com/project/202551/insights/VSqBgjCe)
- [Successful booking retries](https://eu.posthog.com/project/202551/insights/XlYo10BE)

The server emits one `room_booking_submitted` or
`karaoke_booking_submitted` event only after Crescat returns HTTP 200 or 201.
It emits the corresponding `*_submit_failed` event when a submission cannot
complete. Use `failure_stage` to separate Crescat session, response, network,
timeout, rate-limit, and application failures.

The browser reuses `booking_submission_id` for another submit from the same
populated form and increments `submission_attempt`. Therefore:

- `submission_attempt > 1` on a success measures a successful user retry;
- repeated events with the same `booking_submission_id` measure repeated
  attempts without storing contact details in analytics;
- failures grouped over time show periods when Crescat or the integration made
  submission unavailable.

PostHog cannot prove that a user abandoned a failed form or that Crescat lost a
request after returning success. Room coordinators must record confirmed
missing-request complaints separately and include the approximate submission
time, without copying contact details into PostHog or ordinary logs.

## Trigger the downstream durable-delivery task

Keep synchronous delivery unless at least one of these is true:

1. The organization adopts a product requirement that a validated form must be
   accepted while Crescat is unavailable.
2. A confirmed missing-request complaint shows that user-owned retry caused a
   booking request to be abandoned.
3. In a rolling 30-day period, at least three booking attempts fail at the
   Crescat, network, or timeout stages and at least 1% of delivery attempts
   fail.
4. A Crescat or integration outage blocks submissions for at least 30 minutes
   during an active booking period.

When a trigger is met, create and prioritize the implementation task described
by [ADR 008](../adr/008-durable-booking-submissions.md). Attach the relevant
insight window and any incident record. Reconfirm that duplicate Crescat
requests remain acceptable; if so, ambiguous network outcomes may be retried
automatically and do not require pre-retry reconciliation.

## Current source boundary

- Owner and consumer: the `samfunnetibergen` web application.
- External system of record: Crescat Event Requests.
- Room caller: `apps/web/src/features/booking/actions/submit-room-booking.ts`.
- Karaoke caller: `apps/web/src/features/karaoke/actions/submit-karaoke-booking.ts`.
- Crescat adapter: `apps/web/src/lib/integrations/crescat/client.ts`.

The PostHog events are evidence for a product decision, not a delivery ledger.
They contain correlation IDs and categories, not submitted contact details.
