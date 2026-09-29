# Evidenced implementation decisions

This file records choices observable in the current code/configuration and their directly verifiable consequences. It does not claim historical rationale unless code or repository documentation explicitly provides one.

## Power Apps Code App, React, TypeScript, and Vite

- **Current implementation:** `power.config.json` declares a Code App; `vite.config.ts` registers React and Power Apps Vite plugins; the UI is React/TypeScript.
- **Known reason:** these are the checked-in platform and framework selections; no additional historical rationale is recorded here.
- **Consequence:** local build and runtime use the Vite/Power Apps toolchain and SDK host context. Build config is not proof of deployment steps.

## Generated Dataverse clients are the data boundary

- **Current implementation:** generated models/services under `src/generated/` are called by app code; the SDK maps configured source aliases to Dataverse entity sets.
- **Known reason:** repository artifacts establish generated access as the current mechanism; no separate backend API exists in the project structure.
- **Consequence:** field availability and behavior depend on generated metadata and the external environment. Generated TypeScript types and code-side matching are not a live schema export.

## Calculations and filters run in the client

- **Current implementation:** `App` holds loaded rows; dashboard services filter and derive metrics/charts/tables in memory.
- **Known reason:** this is the implementation present in source; no server-side aggregation layer exists in the repository.
- **Consequence:** displayed results are bounded by current `getAll` request sizes and fields returned. Code formulas should not be represented as externally approved business definitions without confirmation.

## App view selection is local React state

- **Current implementation:** `App.tsx` stores the selected `ViewMode` and conditionally renders page components. No URL router dependency or route map is present.
- **Known reason:** no historical rationale is established.
- **Consequence:** view selection is not represented by a client route in the current implementation; changing navigation requires updating the app's state/render path.

## Equipment writes are narrower than generated service capabilities

- **Current implementation:** the Equipment UI uses generated create and update service methods. Generated CRUD methods do not mean every operation is exposed by the UI; other entity views are read-only and Equipment deletion is not wired into the UI.
- **Known reason:** the source code explicitly wires these calls; no historical rationale is established.
- **Consequence:** do not infer available user actions or required permissions from generated method availability alone.

## Tables paginate loaded rows in the browser

- **Current implementation:** shared and dashboard tables filter/sort/slice arrays in React state; source loading is separately bounded.
- **Known reason:** implementation details are verified; no historical rationale is established.
- **Consequence:** page navigation does not fetch additional Dataverse pages and cannot overcome upstream row limits. See [`PAGINATION.md`](PAGINATION.md).

## Historical progress chart is unavailable rather than synthesized

- **Current implementation:** active `Progress Trends` has no series and presents an unavailable state because no historical snapshots are stored.
- **Known reason:** the service explicitly describes this limitation and does not fabricate history.
- **Consequence:** no time-series progress claim can be inferred from current progress fields.

## Chart reset is chart-scoped

- **Current implementation:** each chart reset clears the chart's hidden series/categories and only its own associated drill-down or matching status/type dropdown.
- **Known reason:** the reset handler explicitly scopes its update; no historical rationale is asserted.
- **Consequence:** unrelated filters, other charts' series visibility, and collapsed panel state remain as they were.

## Theme and collapsed-panel state use browser storage

- **Current implementation:** theme is stored in `localStorage`; command-center collapsed panel IDs use `sessionStorage`.
- **Known reason:** storage choices are directly observable in source; no historical rationale is established.
- **Consequence:** the theme can survive browser sessions for that origin, while panel collapse persists only in the current browser session.

## Generated artifacts are not a substitute for live Dataverse metadata

- **Current implementation:** `.power/schemas/` and generated source files hold SDK/code snapshots, while the repository has no verified live relationship export.
- **Known reason:** the external environment is not represented by a live schema connection in this repository.
- **Consequence:** cardinality, requiredness, cascade behavior, permissions, and active relationship configuration **Require verification** in the target environment.
