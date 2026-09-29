# Instructions for AI coding agents

## Project

Dubai ERP is a React/TypeScript Power Apps Code App. It loads configured Dataverse data through the Microsoft Power Apps SDK, builds operational and executive summaries in the browser, and exposes entity views and related-record navigation. The detailed project documentation is indexed in [`docs/README.md`](docs/README.md).

## Read before changing code

1. Read the root [`README.md`](README.md) for setup, scripts, current status, and repository context.
2. Read [`docs/README.md`](docs/README.md), then the documentation relevant to the requested area. At minimum consult:
   - [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
   - [`docs/DATA-SOURCES.md`](docs/DATA-SOURCES.md) and [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) for Dataverse work
   - [`docs/UI-ARCHITECTURE.md`](docs/UI-ARCHITECTURE.md) and the feature-specific filtering, pagination, or charts guide for UI work
   - [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md), [`docs/TESTING.md`](docs/TESTING.md), and [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for validation or delivery work
3. Inspect the current implementation and Git state. Documentation can become stale; code and checked-in configuration are authoritative for current behavior.

## Required change discipline

> Make the smallest correct change that satisfies the requested requirement while preserving existing functionality.

- Trace the existing behavior through its callers, state, transformations, and UI before editing. Search for existing helpers and related implementations; reuse established patterns.
- Keep changes narrowly scoped to the request. Do not perform unrelated refactors, dependency changes, formatting churn, speculative improvements, or behavior changes.
- Preserve current user-facing behavior unless the request explicitly calls for a change. Identify affected surfaces (including dashboard and shared table variants) and maintain consistency.
- Do not infer, invent, or silently substitute Dataverse tables, columns, relationships, APIs, business rules, permissions, environment variables, authentication behavior, or deployment steps. Verify claims against repository artifacts and, where needed, the actual Power Platform environment. Mark anything that cannot be established as **Requires verification**.
- Generated files under `src/generated/` and `.power/schemas/appschemas/` are generator-owned. Do not edit them manually unless the task specifically requires it and the generation workflow is verified.
- Preserve explicit error handling and user feedback. Do not introduce broad catches, silent fallbacks, or success-shaped responses for failed operations.
- Do not expose credentials, tokens, tenant/environment identifiers, connection strings, or other secrets in code, commits, logs, or documentation.

## Validation

- Check `package.json` before choosing commands. The project defines `npm run build`, `npm run lint`, `npm run dev`, and `npm run preview`; it currently defines no test script or checked-in test files.
- Run the smallest applicable validation, then the build/type-check and lint when relevant. `npm run build` includes `tsc -b`.
- For changes to data-derived metrics, filters, chart interactions, or pagination, verify the exact changed behavior and edge cases rather than relying only on compilation.
- If a validation command cannot run or no tests exist, state that plainly; do not imply it passed.

## Git safety and review

- Before work, inspect `git status`, the current branch, and relevant recent history. The working tree may contain someone else's work.
- Never revert or overwrite unrelated user changes. Do not use destructive Git commands, amend commits, commit, or push unless explicitly requested.
- Before finishing, inspect the complete diff and `git status`; check that only intended files changed and that generated/build output has not been added accidentally.
- Report implementation scope, validation results, and any unresolved assumptions or external facts that require verification.

## Documentation maintenance

- Update the relevant documentation when behavior, architecture, configuration, data-source use, or operational guidance changes.
- Document only the implementation that exists. Keep implemented behavior separate from planned work; if no roadmap or plan is checked in, say so.
- Treat [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) as a description of code-side evidence, not as proof of live Dataverse relationships. Confirm actual relationship metadata in the target environment before documenting it as established.
- Keep this guide and [`docs/README.md`](docs/README.md) current when adding or renaming documentation.
