# Investigate submission and infrastructure errors

Use the issue's environment, release and trace/request identifiers to distinguish production failures from previews. Exception messages can contain submitted data; diagnostics deliberately use stable codes and field names instead. Do not log request bodies, email addresses, phone numbers, SQL parameters or provider credentials.

## Volunteer applications

The website's `apps/web/src/app/api/volunteer-prospects/route.ts` forwards applications to Personal's `app/api/v1/volunteer_prospects.py`. HTTP 400/422 means validation rejected the request; it does not establish an outage. Check `issue_codes`, `field_paths` and the `volunteer.application.rejected` operational event. Personal logs `volunteer.prospect.validation_failed` with `validation_codes` and `validation_fields`; its stable rejection code is passed in `X-Kvarteret-Rejection-Code`.

`group_not_found` requires comparing public choices with Personal's active groups. `duplicate_group_choices` requires distinct first and second choices. `field_validation` has field-specific feedback. Other domain rejections use `domain_validation`; inspect the named validation branch in Personal without exporting applicant values. The public proxy preserves recognized field errors, including each friend address, for `GroupVolunteerForm.tsx` to show beside the field and in its error summary.

Count successful `volunteer_application_submitted` events as well as failures. September 30's six HTTP 400 events were closely correlated with retries in a browser session that ultimately created registration 471. A backend `anonymous` distinct ID is not a reliable count of people.

## Personal role points and database failures

Personal's `app/web/routes/groups/actions.py` constrains role points to PostgreSQL's signed 32-bit integer range. `app/domain/groups/service.py` also checks points and identifiers before issuing SQL. Rejected out-of-range inputs are validation failures, not database incidents.

For database availability incidents, read `error_chain`, `error_category`, `db_sqlstate`, `request_id` and `trace_id`. Personal's auth middleware logs `auth.context.unavailable` with `failure_stage=auth_session_load` and returns HTTP 503 with retry guidance. It does not present a database failure as a missing login. Match the timestamp and SQLSTATE against provider status and database connection configuration; these diagnostics cannot prove that the provider has recovered.

## SMTP and mobile-card access codes

Personal's SMTP adapter reports `failure_stage` as connect, greeting, TLS, authenticate, send or quit. Read `error_category`, `smtp_status_class`, `retryable` and `delivery_uncertain`. A timeout while sending can occur after the server accepted the message: check delivery before retrying. The adapter marks ambiguous delivery as non-retryable for automatic outbox retries and performs no automatic resend itself.

The mobile-card API returns HTTP 503 and asks the user to check their inbox before requesting another code. `app/error_tracking.py` reports an exception chain only once within a request, even when multiple layers log it. Two historical issues (`SmtpDeliveryError` and `MobileCardError`) sharing a trace represented one failed email request; do not count them as separate affected people.

## Unattributed Safari exceptions

`apps/web/src/lib/posthog/browser-exception.ts` keeps unknown errors, including Safari's source-less `UnavailableError`. Additional fields show `error_source`, counts in `exception_frame_sources`, `browser_page_phase`, `page_elapsed_ms` and the room-booking workflow. The extra diagnostics contain no raw script URLs or query strings. `missing` frames do not prove extension noise.

Use those fields together with the session timeline to distinguish a page-load error from a failed booking submission. Existing document-only injected-script filtering still applies. Reproduce source-less errors in Safari before suppressing them or claiming an application fix.

## Resolution

Record whether a change is local, reviewed, deployed or verified in production. Keep incidents active until the deployed change is verified. Do not mark a provider timeout resolved solely because it stopped recurring, or claim that added diagnostics prevent the underlying failure.
