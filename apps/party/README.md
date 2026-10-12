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

```bash
npx wrangler login
npm --workspace @samfunnet/party run deploy
```

Then set `NEXT_PUBLIC_PARTY_HOST` on the website (for example
`samfunnet-lekeplass.<account>.workers.dev`, or a custom domain) and redeploy
it. The "Spill med andre" option only appears when that variable is set.
`ALLOWED_ORIGINS` in `wrangler.jsonc` lists the origins that may connect.

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
