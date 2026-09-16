# Architecture Decision Records

Durable records of decisions that shape this repository. ADRs are history: do
not rewrite a decision, supersede it with a new ADR and update the status here.

| ADR | Title | Status |
| --- | --- | --- |
| [001](./001-crescat-integration.md) | Crescat event-request integration | Accepted |
| [002](./002-sanity-typegen-required-fields.md) | Enforce required fields with draft-safe projections | Accepted |
| [003](./003-sanity-template-nextjs-clean-learnings.md) | Sanity live editing architecture | Accepted; superseded in part by [ADR 007](./007-separate-studio-deployment.md) |
| [004](./004-sanity-query-organization.md) | Organize GROQ queries into queries and fragments | Accepted |
| [005](./005-materialized-event-instances-and-festival-event-graphs.md) | Materialized event instances and festival event graphs | Accepted (implemented) |
| [006](./006-series-child-authoring-and-program-desk.md) | Series/festival child authoring and the Program desk | Accepted |
| [007](./007-separate-studio-deployment.md) | Separate Studio deployment with a shared content contract | Accepted |
| [008](./008-durable-booking-submissions.md) | Durable booking submissions in Postgres | Deferred pending an evidence trigger |
| [009](./009-public-events-api-and-feed-alignment.md) | One complete versioned events API | Accepted |
| [010](./010-signed-volunteer-prospect-proxy-boundary.md) | Signed volunteer-prospect proxy boundary | Accepted |

Related durable docs live under `docs/how-to/` (procedures) and
`docs/reference/` (contracts).
