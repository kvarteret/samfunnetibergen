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

## Remote Codex development

See [Set up Codex for remote work](docs/how-to/codex-environments.md) for the
repository-specific setup for local worktrees, Remote Control, and Codex Cloud.

## Deployment

The website Vercel project uses `apps/web` as its Root Directory. Studio is a
separate static deployment rooted at `apps/studio`; see the release guides for
the external cutover and promotion steps.
