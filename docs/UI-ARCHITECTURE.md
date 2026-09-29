# UI architecture

## Entry and view selection

`src/main.tsx` imports `src/index.css`, mounts `App` at `#root`, and wraps it in React `StrictMode`. `App` in `src/App.tsx` owns a `ViewMode` state and renders one page conditionally. No routing library, URL-based route definitions, or separate page directory is present.

The app shell consists of a fixed side navigation (`aside.side-nav`), hamburger toggle, and main content region. The navigation toggle controls the `data-navigation-collapsed` state; view buttons update the app's view state.

## Pages and composition

| View | Implementation |
| --- | --- |
| Dashboard | `OperationsCommandCenter` in `src/OperationsCommandCenter.tsx` |
| Executive summary | `ExecutiveSummary` in `src/ExecutiveSummary.tsx` |
| Clients, Projects, Contracts, Contractors, Daily Site Reports, Employees, Equipment, Inspections, Payment Applications, Permit Approvals, Project Documents, Project Phases, Purchase Orders, Safety Incidents, Suppliers, Variation Orders, Work Packages | Entity page components in `src/ClientProjectViews.tsx`; Equipment form/panel is in `src/App.tsx` |

The project page and related entity pages receive record arrays and navigation callbacks as props. Selecting a related record updates the corresponding selected-ID/view state in `App`; entity detail selection within many pages remains local to that component.

## Reusable UI

- `SortableTable` wraps a semantic HTML table, sorts header columns, pages rows, and opens a `RecordDetailsDialog` on row click.
- `TablePagination` and `TablePageSizeInput` provide shared page controls used by `SortableTable` and both dashboard table implementations.
- `RecordDetailsDialog` is shared for table row details.
- `ChartPanel`, `MetricIndicator`, and `OperationalTable` are private dashboard components in `OperationsCommandCenter.tsx`.
- `ChartVisual`, `ChartCard`, `KpiCard`, and `DashboardDataTable` belong to the alternate `OperationalDashboard.tsx`; that component is not the currently selected dashboard route.

## UI interaction patterns

- Lists generally keep local search/filter/selection state in React hooks and receive their source records through props.
- Command-center project filters are held in `OperationsCommandCenter`; filtering and metrics are recalculated by `buildOperationsCommandCenter`.
- Chart clicks can set dashboard filter/drill-down state. Each chart's reset control restores that chart's hidden legend items and clears only a drill-down associated with that chart (or its corresponding project-status/type filter label).
- Entity table row clicks open record details in the shared wrapper, subject to the wrapper's nested-control click guard.
- Command-center table row clicks can both show row details and, when the row has project IDs, apply a project drill-down.
- Theme state is persisted in `localStorage`; command-center collapsed panel IDs are persisted in `sessionStorage`. Navigation collapse and other view/filter/tab state are in memory.

## Styling and responsive behavior

- `src/App.css` styles app shell, entity pages, shared tables/dialogs, themes, and navigation.
- `src/OperationalDashboard.css` styles the command-center and alternate dashboard visualizations and tables.
- `src/index.css` supplies base styles, focus/animation behavior, and reduced-motion handling.
- CSS includes responsive breakpoints at 980px and 640px for app shell/navigation and at several widths for dashboard layouts (1050/760/480px and 1080/720/420px).
- Reduced-motion preferences are explicitly handled in `src/index.css` and `src/OperationalDashboard.css`.

The root-level `index.css` is not imported by `src/main.tsx`; active root CSS comes from `src/index.css` and component stylesheets.

For filter ownership see [`FILTERING-AND-CALCULATIONS.md`](FILTERING-AND-CALCULATIONS.md). For table behavior see [`PAGINATION.md`](PAGINATION.md).
