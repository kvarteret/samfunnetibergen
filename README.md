# Samfunnet i Bergen

This repository contains a Next.js website and a Sanity Studio managed as npm
workspaces. The runnable applications live in `apps/web` and `apps/studio`;
the root package only orchestrates checks and builds.

## Getting Started

Install the single root lockfile and run the website development server:

```bash
npm ci
npm run dev:web
```

 

<details>

<summary>Tip: Ensure you have the right version of node! We use mise</summary>

[Mise](https://mise.jdx.dev/) replaces tools such as `direnv` `pyenv`, `nvm`, `asdf`, and `make`. It provides directory based environment switching and auto-configuration of desired language-runtime version based on [mise.toml](./mise.toml).


```sh
mise trust
```

Mise is told the trust the config file in this repo. Use mise activate to activate the environment.



Something off? Use `which` node to check that `mise` has shimmed your node. You may need to uninstall nvm. That's fine, mise is better.

</details>

Open [http://localhost:3187](http://localhost:3187) with your browser.

Optional: Run

`npm run dev:studio` in another terminal to start the local Studio.

## Deployment

The website Vercel project uses `apps/web` as its Root Directory. Studio is a
separate static deployment rooted at `apps/studio`; see the release guides for
the external cutover and promotion steps.

## Statutes app

The standalone Svelte app for comparing the statutes and preparing proposed
amendments is hosted at [statuttendring.samfunnetibergen.no](https://statuttendring.samfunnetibergen.no).
The original author was Morten Stene. The statutes data is in
`apps/statutter/src/lib/statuttar.json`; the Word form template is in
`apps/statutter/public/statuttendringsskjema.docx`. Drafts are saved in the
visitor's browser and can also be exported or imported as JSON files.

### Develop and build

From the repository root, install dependencies with `npm ci`, then run:

```sh
npm run dev:statutter
```

Create the static production files with `npm run build:statutter`. They are
written to `apps/statutter/dist`. The root `npm run build` also builds this app.

### Deploy to Azure Static Web Apps

The production app is the Azure Static Web App `samfunnet-statutter` in resource
group `rg-samfunnet-statutter` (West Europe, Free tier). Its default hostname is
`black-river-05d6a6903.6.azurestaticapps.net`; the public hostname is
`statuttendring.samfunnetibergen.no`. Sign in to Azure CLI with an account that
can deploy to that resource, then run these commands from the repository root:

```sh
npm run build:statutter
SWA_CLI_DEPLOYMENT_TOKEN="$(az staticwebapp secrets list \
  --name samfunnet-statutter \
  --resource-group rg-samfunnet-statutter \
  --query 'properties.apiKey' -o tsv)" \
  npx --yes @azure/static-web-apps-cli deploy apps/statutter/dist --env production
```

The deployment token is read directly from Azure for the deploy command; do not
store it in the repository. To inspect the Azure site or its custom-domain
binding, use the Azure portal or `az staticwebapp show` and
`az staticwebapp hostname show` with the resource name and group above.

### Domeneshop DNS

In the DNS zone for `samfunnetibergen.no`, the `statuttendring` host must point
to the Azure default hostname:

| Host | Type | Value |
| --- | --- | --- |
| `statuttendring` | CNAME | `black-river-05d6a6903.6.azurestaticapps.net` |

Azure also uses a TXT record to verify the custom hostname. If the domain needs
to be registered again, create the Azure binding with
`az staticwebapp hostname set --name samfunnet-statutter --resource-group rg-samfunnet-statutter --hostname statuttendring.samfunnetibergen.no --validation-method dns-txt-token --no-wait`, then retrieve its current token with:

```sh
az staticwebapp hostname show \
  --name samfunnet-statutter \
  --resource-group rg-samfunnet-statutter \
  --hostname statuttendring.samfunnetibergen.no \
  --query validationToken -o tsv
```

Add that token in Domeneshop as a TXT record with host
`_dnsauth.statuttendring`. Keep the TXT record alongside the CNAME. The token is
specific to the Azure binding and should be retrieved from Azure when needed;
do not copy it into this README.
