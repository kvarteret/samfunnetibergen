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
