# Filtering and calculations

## Data and state boundaries

All app data is loaded into React state by `src/App.tsx` from generated Dataverse services. Current dashboard filters and entity searches run in the browser against those in-memory arrays; they are not Dataverse query filters. Initial records are bounded (`top: 200` for most sources, `top: 100` for Equipment), so calculations are limited to the records returned.

## Active command-center project filters

`OperationsCommandCenter` owns `CommandFilters`:

- `projectId`: selected project ID or `all`
- `projectType`: exact recorded project type or `all`
- `status`: exact normalized display status or `all`
- `drilldownProjectIds` and `drilldownLabel`: IDs selected from chart/table interactions

`buildOperationsCommandCenter` normalizes each project and retains rows matching every active filter. Project-type and status dropdown choices are derived from the loaded project records. Changing a dropdown clears prior drill-down IDs/label. The Reset filters button restores `emptyCommandFilters`.

Project status text is chosen from trimmed `craft_status`, then generated status/state labels, then `Unspecified`. Project type uses trimmed `craft_projecttype` or `Unspecified`. The service calculates status/health flags from status text, state code, health name, completion, and dates; these are implementation predicates, not verified organizational policy.

### Interaction paths

- Status-mix chart points set the status filter and clear project selection.
- Project-type chart points set the type filter and clear project selection.
- Other chart points set the drill-down ID list from their `projectIds`.
- A table row with project IDs applies a selected-record drill-down. Rows without project IDs only open details.
- A clear-drill-down action clears drill-down IDs/label while leaving dropdown filters in place.
- Ordinary dropdown changes clear any drill-down.
- A chart's reset clears hidden legend selections for that chart and only clears a filter/drill-down if its label indicates that this chart originated it; unrelated filters are retained.
- Clicking a KPI opens its associated operational table. It does not set a project filter.

## Related-record filtering

After filtering projects, the command-center service associates phases, contracts, work packages, payments, variation orders, incidents, inspections, permits, purchase orders, documents, and daily reports to those projects by matching available project keys. Related-record matching is performed in code; exact identifier source and confidence are listed in [`DATA-MODEL.md`](DATA-MODEL.md). Equipment is associated by matching `craft_currentproject` to project identifiers/name keys. Contractor lists are not narrowed by the selected projects in the service (`selectedContractors` uses all loaded contractors).

## Command-center derived indicators

The service derives its twelve metrics from currently selected project and related-record arrays:

- Active projects: project status/state flags, excluding complete/on-hold.
- Delayed projects: not complete and end date earlier than the current local day.
- Total contract value: sum of recorded project `craft_contractvalueaed`.
- Portfolio completion: mean of non-null project completion percentages.
- Budget overrun percentage: mean of known project budget variance percentages; tone thresholds are encoded as green at or below 0%, amber above 0% through 5%, and red above 5%.
- Pending payments: sum of net certified values for selected payment applications whose status text does not contain “paid”.
- Approved variation orders: count and sum of variation orders whose status text contains “approved”.
- CPI: explicitly unavailable because earned value is not present in the available model.
- Open incidents: status text containing “open” or the current enum numeric test.
- Inspection pass rate: passed inspections divided by all selected inspections; pass detection checks status text or the current enum numeric test.
- Permits expiring in under 30 days: future expiry less than 30 days away, excluding expired status/flag.
- Rented equipment cost/day: sum of daily rates for project-matched equipment identified as rented by label or enum value.

Missing numeric values are skipped for means or treated as zero in sums according to the helper used. The exact enum numeric values and status strings are in generated models/source; confirm them in Dataverse before treating a derived value as a formal business rule.

### Other dashboard calculations

Chart/table data includes project status/type counts, value by location, project completion, phase planned/actual dates and progress, elapsed/remaining schedule days, phase budget versus project total cost, certified payments grouped by recorded month, payment retention comparisons, variation value by status, daily report records containing issue text, project manager/employee linkage counts, purchase-order status buckets, work-package total/executed values, rented equipment daily rate by type, incident/inspection/document groupings, permit expiries, and risk-score distribution. Chart-level data definitions are documented in [`CHARTS-AND-VISUALIZATIONS.md`](CHARTS-AND-VISUALIZATIONS.md).

The service explicitly does not fabricate historical progress snapshots. Its progress-trend chart has an empty series and an unavailable message. Other empty/unavailable cases depend on whether source fields are present.

## Executive summary formulas

`ExecutiveSummary` calculates separately from the command-center filters using the full arrays passed by `App`:

- LAD exposure: active contracts whose completion date is in the past.
- Expired permits: status says expired, expiry flag is set, or expiry date is past.
- Open incidents: incident status is exactly the generated/display label `Open`.
- Inspection pass rate: passed inspection count divided by all inspections.
- Retention held: sum of payment application retention amounts.
- Pending payment applications: statuses `Certified` or `Overdue`.
- Delayed projects: project end date in the past and completion below 100%.
- Permits expiring: expiry within 0–30 days and status not `Expired`.
- Pending purchase orders: statuses `Draft`, `Issued`, or `Invoiced`.
- Employee visa issues: non-empty visa status not containing `valid`, `active`, `approved`, or `clear`.

Severity groups, labels, and date semantics are hard-coded presentation/calculation rules. The page's severity selector filters displayed pain points; selecting an exposure bar focuses the matching item. It does not filter the Dataverse source arrays.

## Entity-page search/filtering

Each page in `ClientProjectViews.tsx` defines its own local search and, where present, dropdown filter state. Search predicates differ by page and often combine display names, identifiers, status, and related project/person names. Check the specific page component before changing a search rule; there is no shared global search service. Those pages generally filter only rows already loaded in `App`.

## Alternate dashboard model

`src/services/operationalDashboardService.ts` implements a second filter/model pipeline with project, type, and status criteria, and `src/OperationalDashboard.tsx` exposes corresponding controls. That component is currently not selected by `App` for the Dashboard view; do not conflate its separate filter state or metrics with the active command-center pipeline.
