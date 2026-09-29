# Development

## Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`, as stated in the project README for Vite 7. `package.json` does not itself pin a Node version.
- npm and the checked-in `package-lock.json`.
- For live data, a compatible Power Apps runtime/host context and access to the configured Dataverse environment. This is an external prerequisite, not a local mock mode.

The repository has no checked-in `.env` file or example and current application source does not read app-specific `.env` variables. `power.config.json` holds Code App configuration. Do not copy its environment-specific identifiers into documentation or unrelated environments.

## Install and run locally

From the repository root:

```sh
npm ci
npm run dev
```

Vite serves the local development build and reports its URL in the terminal (Vite's default is port 5173). `power.config.json` separately contains a `localAppUrl` at port 3000. The repository does not document a custom Vite port or explain how the configured URL is reconciled; verify the expected Power Apps tooling/host launch flow before relying on it.

The application expects the Power Apps SDK host context for Dataverse operations. A standalone browser session without that context is not documented as a supported data mode.

## Available npm commands

| Command | Script implementation | Purpose |
| --- | --- | --- |
| `npm run dev` | `vite` | Vite development server |
| `npm run build` | `tsc -b && vite build` | TypeScript project build/check followed by production Vite build to `dist/` |
| `npm run lint` | `eslint .` | ESLint |
| `npm run preview` | `vite preview` | Locally serve an existing production build |

`npm test`, a standalone type-check script, and a format script are not defined. Build includes `tsc -b`; do not claim an independent type-check command exists.

## Configuration touchpoints

- `vite.config.ts`: React plugin and Power Apps Vite plugin.
- `power.config.json`: Code App type, build output and entry point, configured Dataverse data sources, local app URL, and connection/environment configuration.
- `tsconfig*.json`: TypeScript project settings.
- `eslint.config.js`: ESLint flat configuration.
- `.power/schemas/`: SDK/generated data-source metadata and Dataverse schema snapshots. Generated artifacts are not authoritative proof of the live environment; do not edit them manually unless the supported generator workflow is established.
- `src/generated/`: generated models and service wrappers.

See [`DATA-SOURCES.md`](DATA-SOURCES.md) for the source maps and access behavior.

## Git workflow and review

Git history and a GitHub remote are present. No repository-level branching, pull-request, release, or deployment workflow was found to mandate a particular sequence. Follow the team's approved workflow rather than inferring branch policy from the current checkout or commit history.

Before changes, inspect `git status`, branch, and relevant commit history. Preserve unrelated work. Before finishing, inspect the full diff and status; do not commit or push unless explicitly asked. Agent-specific safety guidance is in [`../AGENTS.md`](../AGENTS.md).

## Project status

The checked-in app is an actively configured Code App with the active dashboard, entity views, and generated Dataverse integrations described in [`FEATURES.md`](FEATURES.md). A second dashboard implementation exists but is not selected by the app shell. The repository does not currently provide checked-in test files, deployment automation/runbook, or an explicit roadmap. Live relationship metadata and the approved publishing process require verification outside the repository.
