# Fill an arrangement from a link in Studio

Editors, developers and administrators can fill a single arrangement from any public event page: TicketCo, another ticket site, or the organizer's site. Open the arrangement, choose **Fyll ut fra lenke** in the document actions menu, paste the link and choose **Hent og fyll ut**. Contributors, viewers, festivals and series do not see the action.

KI (the Azure `gpt-6-luna` deployment) reads the page and fills title, description, type, date and door times, room or place, organizer, prices and links. The page image is uploaded. Found fields overwrite the draft. A warning lists what is still missing, using the same rules that block publishing. Facebook pages need login and cannot be read. The pasted link becomes the ticket link unless the event is free.

Rooms are cross-referenced with Crescat as in the TicketCo importer: a matching booking title, then the KI's choice, then the only room booked during the event. Booking data is model context only; it is never returned, stored or sent to analytics.

## How the request is trusted

1. `importFromUrlAction.tsx` creates a private document `eventImportRequest.<uuid>` holding the URL with the editor's own Studio session. Dotted IDs are unreadable without authentication.
2. It posts the request ID to `/api/studio/event-import` on the website. The origin is resolved like the Presentation preview, so a local Studio talks to `localhost:3187` and a deployed Studio talks to production.
3. `url-import/handler.ts` accepts only an unclaimed request younger than five minutes. It claims the request with a revision check and deletes it afterwards.
4. `url-import/public-fetch.ts` allows http(s) on default ports only. Every redirect hop must resolve to public addresses.

## Prompt and analytics

The PostHog prompt `event-url-extraction` (label `production`) holds the instructions; `url-import/prompt.ts` is the fallback. Generations are recorded as `$ai_generation` with `workflow: studio_url_import`.
