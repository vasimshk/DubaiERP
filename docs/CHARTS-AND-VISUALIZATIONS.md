# Charts and visualizations

## Active visualization implementation

The active Dashboard view is `OperationsCommandCenter` in `src/OperationsCommandCenter.tsx`. `buildOperationsCommandCenter` in `src/services/operationsCommandCenterService.ts` currently defines **23** chart models in seven categories:

| Chart | Category | Kind | Data represented by the current model |
| --- | --- | --- | --- |
| Project Status Mix | Portfolio Health | Donut | Loaded selected projects grouped by derived current status |
| Projects by Type | Portfolio Health | Pie | Loaded selected projects grouped by recorded project type |
| Portfolio by Location | Portfolio Health | Treemap | Recorded contract value grouped by project location |
| Portfolio Completion | Portfolio Health | Gauge | Mean recorded project completion percentage |
| Phase Timeline | Project Performance | Timeline | Project phase planned versus actual end dates |
| Phase Progress | Project Performance | Stacked | Recorded phase progress and remaining percentage |
| Schedule Exposure | Project Performance | Scatter | Project elapsed days versus remaining days |
| Budget Health | Financial Control | Scatter | Phase budget totals against project total cost, at the available data grains |
| Cash Flow & Payments | Financial Control | Area | Net certified payment amount by payment/period-end month |
| Retention Money | Financial Control | Bar | Retention held compared with net certified amount per payment application |
| Variation Order Impact | Financial Control | Stacked | Variation order amount grouped by approval status |
| Reported Site Issues | Risk & Compliance | Bar | Site report records with non-empty reported issue text, grouped by project |
| Progress Trends | Project Performance | Line | No data series; explicitly unavailable because progress snapshots are not stored |
| Manager & Employee Coverage | Contractor & Workforce | Stacked | Project manager ID presence versus linked employee record |
| PO Procurement Pipeline | Procurement & Equipment | Funnel | Purchase order counts by a fixed set of generated status labels |
| Work Package Execution | Procurement & Equipment | Stacked | Package total amount versus executed amount by project |
| Rental Cost by Equipment Type | Procurement & Equipment | Pie | Daily rate by equipment type for rented, project-matched equipment |
| Safety Incidents by Type | Risk & Compliance | Donut | Project-linked incidents grouped by incident type |
| Inspection Defects | Risk & Compliance | Bar | Failed inspection records grouped by inspection type |
| Permit Expiry Timeline | Risk & Compliance | Timeline | Project-linked permit expiry dates |
| Document Submission Status | Risk & Compliance | Donut | Project documents grouped by recorded status |
| Project Risk Heatmap | Risk & Compliance | Heatmap | Selected project risk score and budget variance context; heat colors are relative bands in the selected distribution |
| Projects Requiring Attention | Executive Decision Matrix | Donut | Projects grouped by computed attention trigger |

The Dashboard tab's “All visualizations 23” caption is hard-coded and currently matches the 23 chart model definitions.

## Renderer and configuration

`ChartPanel` renders data-defined chart kinds using Recharts components: pie/donut, treemap, scatter, funnel, timeline (a scatter chart using dates), line, area, and bar/stacked bar. Gauge and heatmap are custom elements. A radar-chart branch exists in the renderer, but there is no radar chart definition in the current 23-model list. The alternate `OperationalDashboard` uses custom CSS donut/bar/comparison visuals and is not the active dashboard route.

Chart model definitions provide category, title, description, data, series, axes/category keys, optional suffix, optional related-table ID, and any unavailable message. Series visibility is held in `hiddenSeries` keyed by chart ID. Legend clicks toggle a series; donut/pie legend interactions hide/show categories.

## Interactions and reset

- A data point can drill down only when its payload contains project IDs. Project Status Mix sets the status dropdown; Projects by Type sets the type dropdown; other charts set drill-down IDs/label.
- Charts with a `tableId` have a button that opens the related table view.
- Each chart header has a reset button. It removes that chart's hidden-series/category state. It also clears a drill-down if its label identifies that chart; for the status/type charts, it restores that specific dropdown to `all`. It does not clear unrelated filters, other chart series states, or collapsed-panel state.
- Chart collapse/expand state is separate from reset.
- Metric indicators open their mapped related table; they do not themselves apply filter predicates.

## Data and interpretation

Chart records are calculated in-browser from the current project selection and already-loaded related records. Filtering, match keys, and formula details are in [`FILTERING-AND-CALCULATIONS.md`](FILTERING-AND-CALCULATIONS.md) and [`DATA-MODEL.md`](DATA-MODEL.md).

Notable constraints explicitly represented in code:

- The progress-trend chart is unavailable because progress snapshots are not stored; it does not draw an invented time series.
- Reported Site Issues counts reports with issue text; it is not a structured issue register.
- The budget scatter combines phase budget totals and project total cost at different available grains.
- Location uses the project location field; the chart definition notes no region field is available.
- Project Risk Heatmap uses a relative selected-distribution color band, not a universal risk threshold.
- Charts only include data supported by currently loaded source rows. Missing fields may produce an empty/unavailable message or a `Not recorded`/zero display depending on the individual calculation.
- `Schedule Exposure` data is elapsed and remaining days; current renderer uses a series color rather than a separate per-point delayed-status color, despite the description text saying delayed projects are highlighted.

## Loading, empty, and error states

While `loading` is true, the dashboard shows an overall loading state instead of its chart/table sections. When project data is empty, it displays a message and explicitly does not substitute sample records. Each chart may show its configured unavailable message or a no-records message; hiding every chart category/series also produces a restore-legend empty state. Data-source/refresh failures appear in the dashboard alert with a retry action; see [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md).

No separate chart API, historical-data endpoint, or background chart loading mechanism is present.
