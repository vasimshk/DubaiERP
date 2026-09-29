# Testing and validation

## Current test infrastructure

The checked-in `package.json` defines `dev`, `build`, `lint`, and `preview`; it does not define a test script. No checked-in test/spec files or configured test runner were found during this documentation pass. Therefore, there is no repository test command to report as passing.

## Available validation

```sh
npm run build
npm run lint
```

`npm run build` runs `tsc -b` and then `vite build`. `npm run lint` runs `eslint .`. Neither command is a unit or integration test suite.

During this documentation pass, `npm run build` completed successfully (including `tsc -b`) and Vite emitted a bundle-size warning for a minified JavaScript chunk over 500 kB. `npm run lint` exited nonzero with 24 errors and 1 warning in the existing UI source, including `react-hooks/set-state-in-effect` and `react-hooks/preserve-manual-memoization` findings. This task did not modify application source. Re-run validation against the current checkout before treating these counts as current.

## Regression areas to exercise

For changes in these areas, validate the exact behavior in the host/runtime where possible:

- **Dataverse:** initial and refresh load success/failure, timeout and empty/error states, correct selected source, Equipment create/update behavior, and permission boundaries.
- **Dashboard filters:** project/type/status intersections, chart-originated filters, drill-down clearing, chart reset preserving unrelated state, and empty project results.
- **Calculations:** known example records, missing/null fields, date boundaries, generated enum mappings, and record caps. Confirm business definitions with the owner rather than treating code formulas as approved policy.
- **Pagination:** empty/one/many pages, final short page, resizing, custom size limits, filtering from a later page, sorting, detail dialogs, and command-center row drill-down. See [`PAGINATION.md`](PAGINATION.md).
- **Charts:** each chart's empty/unavailable state, legend toggle/reset, chart-to-table navigation, drill-down behavior, and the progress-trend unavailable state.
- **UI/navigation:** navigation collapse, active view rendering, related-record navigation, responsive breakpoints, keyboard dialog close, and reduced-motion behavior.

These are validation recommendations based on implemented behavior, not claims of existing automated tests. Use only test facilities added to the repository after checking the current manifests and scripts.
