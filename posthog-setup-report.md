# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into this Next.js 16.2.1 App Router project. The following changes were made:

- **`instrumentation-client.ts`** (new): Initializes PostHog client-side using the Next.js 15.3+ instrumentation pattern with session replay, error tracking, and a reverse proxy via `/ingest`.
- **`lib/posthog-server.ts`** (new): Singleton PostHog Node.js client for server-side event capture in API routes.
- **`next.config.ts`**: Added reverse proxy rewrites for `/ingest` to route PostHog traffic through the app, plus `skipTrailingSlashRedirect: true`.
- **`.env.local`**: Added `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables.
- **`components/volunteer-prospect-experience.tsx`**: Added client-side events for group selection, form submission success/failure, and passes the PostHog distinct ID to the API via `x-posthog-distinct-id` header for client–server correlation.
- **`components/volunteer-signup-page.tsx`**: Added client-side event for legacy volunteer signup form success.
- **`app/api/volunteer-prospects/route.ts`**: Added server-side events for prospect creation success and failure, reading the distinct ID from the request header.

| Event | Description | File |
|---|---|---|
| `volunteer_group_selected` | Fired when a user selects a volunteer group as first or second choice | `components/volunteer-prospect-experience.tsx` |
| `volunteer_form_submitted` | Fired when the volunteer prospect form is successfully submitted | `components/volunteer-prospect-experience.tsx` |
| `volunteer_form_submission_failed` | Fired when the form submission fails (API or server error) | `components/volunteer-prospect-experience.tsx` |
| `volunteer_prospect_created` | Server-side: prospect successfully created in the Personal app | `app/api/volunteer-prospects/route.ts` |
| `volunteer_prospect_creation_failed` | Server-side: prospect creation failed (upstream API error) | `app/api/volunteer-prospects/route.ts` |
| `volunteer_signup_submitted` | Fired when the legacy Supabase-based signup form succeeds | `components/volunteer-signup-page.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard – Analytics basics**: https://eu.posthog.com/project/156267/dashboard/613041
- **Volunteer Signup Funnel** (group selected → form submitted): https://eu.posthog.com/project/156267/insights/pnhU6nzj
- **Form Submissions vs Failures** (daily trend): https://eu.posthog.com/project/156267/insights/A0IpfnYI
- **Most Popular Volunteer Groups** (breakdown by group_slug): https://eu.posthog.com/project/156267/insights/p9IqREvo
- **Volunteer Prospect API Success vs Failure** (weekly): https://eu.posthog.com/project/156267/insights/DgLG0PFT
- **Daily Active Users Exploring Groups** (top-of-funnel DAU): https://eu.posthog.com/project/156267/insights/iBxjjAay

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
