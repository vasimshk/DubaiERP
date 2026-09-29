# Deployment

## What the repository establishes

- The app is configured as a Power Apps `CodeApp` in `power.config.json`.
- The configured build output is `dist/` and the build entry point is `index.html`.
- `vite.config.ts` registers the Power Apps Vite plugin.
- `@microsoft/power-apps-cli` is a package dependency.
- `npm run build` executes `tsc -b` and `vite build`, producing the local build output.

These facts establish build configuration only. The repository contains no checked-in deployment script, CI/CD workflow, deployment pipeline, or step-by-step publishing runbook.

## Requires verification outside the repository

The approved command/process for importing, publishing, or promoting this Code App; target environment selection; connection setup; user permissions; and production validation **Require verification** with the Power Platform administrators and the actual target environment. Do not infer that building `dist/` deploys the app, or invent a PAC command or sequence.

The checked-in Power Platform config contains environment-specific values. This guide intentionally does not reproduce them. Verify that the local configuration points to the intended environment before invoking Power Platform tooling, and do not transfer environment-bound identifiers into another environment without the approved process.

## Suggested evidence to add when deployment is verified

Document the exact supported tool/version, authenticated account requirements, target/environment selection, command sequence, resulting artifact, post-deployment validation, and rollback path only after those steps are confirmed by the actual deployment owner and environment.
