# Lekeplass

The realtime server behind "Spill med andre" in partymodus. It is a Cloudflare
Worker with one Durable Object per page (built with
[partyserver](https://github.com/cloudflare/partykit), the successor to
PartyKit). The server relays each visitor's steered mascot to everyone else on
the same page and keeps no history.

- `src/protocol.ts` is the wire format. The website imports it as
  `@samfunnet/party/protocol`, and both ends validate what they receive.
- `src/index.ts` is the Worker and the `Lekeplass` room. It checks the
  connection's `Origin` against `ALLOWED_ORIGINS`, caps a room at 40 players,
  and drops more than 30 messages a second from one connection.

## Local development

```bash
npm run dev:party
NEXT_PUBLIC_PARTY_HOST=localhost:1999 npm run dev:web
```

## Deploy

The production release workflow (`.github/workflows/release-production.yml`)
deploys the Worker together with the website, but only when the Worker that
would run actually changes. `scripts/fingerprint.mjs` hashes the bundle
wrangler would upload together with `wrangler.jsonc`, and every deploy records
that fingerprint in the version message. The release compares it with the live
version's (`npm --workspace @samfunnet/party run deploy:check`). So website
changes, dependency bumps that do not reach the Worker bundle, tests, docs and
comments never redeploy it. A live version without a fingerprint, such as one
deployed with plain `wrangler deploy`, is redeployed once.

The Worker goes out after the staged website passes its smoke tests and before
promotion, then must answer `/health`. If either step fails, the website is not
promoted. Keep the Worker compatible with the website that is live for those
few minutes.

CI authenticates with `CLOUDFLARE_API_TOKEN` from Infisical's Samfunnet
Deployments project (`/nettside`, `prod`). The account is pinned in
`wrangler.jsonc`. The website finds the Worker through `NEXT_PUBLIC_PARTY_HOST`
(`samfunnet-lekeplass.samfunnetibergen.workers.dev`), and `ALLOWED_ORIGINS`
lists the origins that may connect.

To deploy by hand, for example to hotfix the Worker alone (this records the
fingerprint too):

```bash
npx wrangler login
npm --workspace @samfunnet/party run deploy
```

## Central infoskjerm controls

Open `/infoskjerm` on the physical display. Open `/infoskjerm?player=Anna` on
one or more phones to join. Each connection gets a random penguin or hedgehog;
names are internal and never displayed or included in the screen roster.
Repeated names and animals still create separate players. The controller shows
the assigned animal and touch arrows, with WASD and arrow-key support too.
Hold ↑ for a higher jump, tap it again for a double jump, and use ↓ to drop
through a ledge.

The dedicated `infoskjerm-central` room relays button inputs. The physical
screen runs movement, ledge collisions and power-ups. Controllers cannot send
positions into that room. Multiple physical screens receive the same inputs
and run their own scenes. Losing controller input for a second releases held
buttons; disconnecting removes the animal. Player animals stay visible outside
the ambient mascot schedule.

Production requires `NEXT_PUBLIC_PARTY_HOST` and the
`partymodus-spill-med-andre` PostHog flag enabled for the `infoskjerm` distinct
ID. The existing `/api/infoskjerm/party` endpoint evaluates this flag separately
from `infoskjerm-maskoter`, without initializing browser analytics. Local
development skips the multiplayer flag. Deploy both the Worker and website
for this protocol extension.
