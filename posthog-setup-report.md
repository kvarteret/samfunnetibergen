# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Samfunnet i Bergen. Client-side initialization uses `instrumentation-client.ts` (Next.js 15.3+ pattern) which auto-initializes on every page load with session replay and error tracking enabled. A reverse proxy through Next.js rewrites routes PostHog traffic via `/ingest/*` to the EU region, improving ad-blocker resilience. Server-side events are captured via a shared `getPostHogClient()` singleton using `posthog-node`.

Thirteen events are instrumented across booking flows, volunteer applications, event submissions, feedback widgets, and event page engagement links.

| Event | Description | File |
|-------|-------------|------|
| `room_booking_submitted` | Successful room booking request sent to Crescat | `src/features/booking/actions/submit-room-booking.ts` |
| `room_booking_submit_failed` | Room booking failed (conflict, out-of-hours, or error) | `src/features/booking/actions/submit-room-booking.ts` |
| `karaoke_booking_submitted` | Successful karaoke booking request sent to Crescat | `src/features/karaoke/actions/submit-karaoke-booking.ts` |
| `karaoke_booking_submit_failed` | Karaoke booking failed (slot unavailable or error) | `src/features/karaoke/actions/submit-karaoke-booking.ts` |
| `volunteer_application_submitted` | Volunteer application successfully forwarded | `src/app/api/volunteer-prospects/route.ts` |
| `volunteer_application_submit_failed` | Volunteer application forwarding failed | `src/app/api/volunteer-prospects/route.ts` |
| `event_submission_submitted` | External organizer submitted a new event for review | `src/features/events/actions/submitEvent.ts` |
| `event_submission_submit_failed` | Event submission to Sanity failed | `src/features/events/actions/submitEvent.ts` |
| `feedback_submitted` | User submitted feedback via the /api/feedback endpoint | `src/app/api/feedback/route.ts` |
| `slack_feedback_submitted` | User submitted the home-page Slack feedback widget | `src/app/[locale]/_components/SlackFeedback.tsx` |
| `ticket_link_clicked` | User clicked the ticket purchase link on an event page | `src/app/[locale]/arrangementer/[event]/EventTrackedLinks.tsx` |
| `facebook_event_link_clicked` | User clicked the Facebook event link on an event page | `src/app/[locale]/arrangementer/[event]/EventTrackedLinks.tsx` |
| `karaoke_phone_link_clicked` | User clicked the same-day phone booking link on the karaoke page | `src/app/[locale]/karaoke/KaraokePhoneLink.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://eu.posthog.com/project/202551/dashboard/749502)
- [Booking submissions over time](https://eu.posthog.com/project/202551/insights/VSqBgjCe)
- [Booking failure rate](https://eu.posthog.com/project/202551/insights/ieoIdxV0)
- [Volunteer applications over time](https://eu.posthog.com/project/202551/insights/hWrZTdok)
- [Event submissions over time](https://eu.posthog.com/project/202551/insights/7rro6F4g)
- [Event page engagement clicks](https://eu.posthog.com/project/202551/insights/bJ3pq6Yj)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
