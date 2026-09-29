# Architecture

## Overview

The repository contains a browser-side React single-page application configured as a Power Apps Code App. There is no application server or separate backend API implementation in the checked-in source. Data access is through the Microsoft Power Apps SDK's Dataverse client and the data sources declared in `power.config.json`.

```text
Power Apps Code App host/runtime
             │
             │ SDK context / configured data-source access
             ▼
src/main.tsx → React App and view components
             │
             ├── generated Dataverse services → Power Apps data client → Dataverse
             └── frontend services → normalized metrics, chart models, table models
                                  ↓
                dashboard, executive, and entity views
```

The diagram shows the boundary visible in this repository; it does not describe an independently implemented authentication protocol or a server-side business API.

## Major layers

### Bootstrap and host configuration

- `src/main.tsx` mounts `<App />` into `#root` under React `StrictMode`.
- `vite.config.ts` configures Vite with `@vitejs/plugin-react` and `@microsoft/power-apps-vite`.
- `power.config.json` declares the Code App build path/entry point and the `default.cds` Dataverse data-source map.
- `.power/schemas/appschemas/dataSourcesInfo.ts` provides the generated data-source metadata used by generated services.

### App shell and data loading

`src/App.tsx` owns current view selection, navigation collapse, theme persistence, fetched records, loading/error/refresh timestamps, and selected related-record IDs. Initial loads issue concurrent `getAll` requests for the configured business data sources. Most request up to 200 records; Equipment requests up to 100 with a selected column list. The app places the resulting arrays into React state and passes them to views.

Equipment is the only entity for which app UI code invokes generated `create` and `update` operations. Other entity pages consume data passed from the app and navigate among matching loaded records.

### Generated data access

`src/generated/models/` contains typed data-source models, and `src/generated/services/` contains SDK wrappers for CRUD/retrieval and metadata methods. Services obtain the SDK client using `dataSourcesInfo`. These files are generated; treat the checked-in source and `.power` metadata as the evidence for field names and data-source names.

### Presentation and calculations

- `src/OperationsCommandCenter.tsx` renders the active Dashboard view.
- `src/ExecutiveSummary.tsx` calculates the separate executive risk summary from the records supplied by `App`.
- `src/ClientProjectViews.tsx` implements entity listings, details, search/filter state, and lookup-ID-based related-record panels.
- `src/services/operationsCommandCenterService.ts` normalizes project rows, applies dashboard filters, and builds current metrics, 23 chart definitions, and 15 table definitions.
- `src/services/operationalDashboardService.ts` and `src/OperationalDashboard.tsx` implement a second dashboard model and UI, but the current `App.tsx` dashboard branch renders `OperationsCommandCenter`; the alternate component is not selected by current app navigation.
- `src/SortableTable.tsx` provides shared table sorting, paging controls, page-size input, and record detail dialog behavior for tables that wrap it.

## Data flow

1. The Power Apps SDK services retrieve records from configured Dataverse entity sets.
2. `App` stores returned arrays in React state. A request failure or initial-load timeout is surfaced in dashboard error state; an initial timeout can resolve to an empty fallback array for that source. There is no sample-data substitution.
3. Entity pages render those arrays, apply local search/filter operations, and associate records by comparing available IDs/lookup values. The app does not rely on a separately implemented API to retrieve child records.
4. The command-center service derives a normalized project view from project fields, applies project/type/status and drill-down filters, then associates loaded operational arrays to the selected project set using available project identifiers.
5. The service builds metric, chart, and table view models from those filtered arrays. Dashboard UI components render them and maintain interaction state locally.
6. User-triggered Dashboard refresh requests the sources again and replaces their arrays on success. Equipment save calls `create` or `update`, then refreshes the Equipment list.

## State and integration boundaries

- No router package or URL route table is present. `App` switches views using a `ViewMode` state value and conditional rendering.
- Dashboard filter state, selected dashboard tab, hidden chart series, and selected table are React component state.
- Theme selection is saved in browser `localStorage` (`dubai-erp-theme`).
- Collapsed command-center panel IDs are saved in `sessionStorage`.
- The source contains no `.env` loading, standalone login UI, external analytics API, or separately hosted application backend.
- Power Apps host authentication and effective Dataverse permissions are external runtime/environment concerns and require verification in the target environment.

## Important dependencies

React/React DOM provide the UI runtime; TypeScript provides static types; Vite builds and serves the app; the Microsoft Power Apps SDK and Vite integration support the Code App data/runtime boundary; Recharts renders command-center charts. See [`DEVELOPMENT.md`](DEVELOPMENT.md) and the root `package.json` for declared versions.

## Change guidance

Keep generated SDK files intact, trace data from `App` through its service/model to the view, and update all affected implementations where the same behavior exists more than once. In particular, there are three table paging approaches and an inactive alternate dashboard implementation; see [`PAGINATION.md`](PAGINATION.md).
