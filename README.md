# Dubai ERP — Power Apps Code App

## Overview

Dubai ERP is a browser-based operational and executive dashboard for a construction-project portfolio. It presents project, contract, workforce, procurement, equipment, payment, safety, inspection, permit, and document information held in Microsoft Dataverse. Users can review summary indicators, explore charts and tables, and navigate between related business records.

The application is implemented as a React single-page app and configured as a Power Apps Code App. Its Dataverse access uses the Microsoft Power Apps SDK and generated data-source models/services. It does not contain a separate application server or a standalone authentication implementation.

## Technology stack

| Technology | Use |
| --- | --- |
| Power Apps Code Apps / Power Platform | Application type, host environment, and Dataverse integration configuration |
| React (`^19.2.0`) | User interface |
| TypeScript (`~5.9.3`) | Application and generated model/service types |
| Vite (`^7.2.4`) | Local development server and production bundler |
| `@microsoft/power-apps` (`^1.2.5`) | Power Apps data SDK, including the Dataverse client |
| `@microsoft/power-apps-vite` (`^1.0.2`) | Vite integration for Power Apps Code Apps |
| `@microsoft/power-apps-cli` (`1.0.2`) | Power Platform CLI package available to the project |
| Recharts (`^3.10.1`) | Dashboard charts |
| ESLint 9 and typescript-eslint | Linting |
| npm | Dependency management and project scripts |
| Git | Source control; the repository is hosted on GitHub |

The versions above are the ranges or pins declared in `package.json`; `package-lock.json` records the resolved dependency tree. Vite 7 requires Node.js `^20.19.0` or `>=22.12.0`. The project does not pin a Node.js version in a version file.

Vite is configured with `@vitejs/plugin-react`; the React Compiler is not configured.

## Architecture

```text
Power Apps host / Power Platform environment
                 │
                 │ host context and Dataverse access
                 ▼
React + TypeScript single-page UI (Vite)
                 │
                 │ @microsoft/power-apps data client
                 ▼
Dataverse data sources configured in power.config.json
```

`src/App.tsx` loads records through generated services and passes the data to dashboard and entity views. The operational metrics and chart/table models are calculated in frontend services from the records returned by Dataverse. Related-record panels match lookup identifiers in those loaded records. Authentication and data authorization are not implemented as a separate login flow in this repository; access depends on the Power Apps runtime/SDK context and the signed-in user's Power Platform and Dataverse permissions.

## Current features

### Operational dashboard

- Portfolio filters for project, project type, and status, with drill-down filtering from chart and table selections.
- Key operational indicators and executive summary, including schedule, financial, safety, inspection, payment, procurement, permit, and workforce measures.
- Interactive charts grouped into portfolio health, financial control, project performance, contractor/workforce, procurement/equipment, risk/compliance, and executive decision areas.
- Related data tables, dashboard refresh, collapsible chart panels, and a reset action on each chart.
- Analytical values are derived from the fields available in the current Dataverse records; they are not a separate forecast or historical data service.

### Entity views and navigation

The navigation includes Clients, Projects, Contracts, Contractors, Daily Site Reports, Employees, Equipment, Inspections, Payment Applications, Permit Approvals, Project Documents, Project Phases, Purchase Orders, Safety Incidents, Suppliers, Variation Orders, and Work Packages. Entity lists and detail panels provide the available search/filtering and cross-navigation where a matching lookup record is available.

### Tables and presentation

- Column sorting, pagination, preset and custom rows-per-page controls, and record-detail dialogs on shared data tables.
- Dashboard tables also provide paged data with page-size selection and record details.
- Equipment records can be created and updated in the app. Other entity views are read-only in the current UI; delete is not wired into the interface.
- Light and gray (`#363636`) themes, with the theme choice saved in browser local storage.
- Collapsible hamburger navigation, responsive layouts, rounded panels, hover/focus feedback, and reduced-motion-aware animation.
- Client contact email is displayed with the contact name in the Clients list.

## Project structure

```text
.
├── .power/
│   └── schemas/
│       ├── appschemas/dataSourcesInfo.ts   # SDK data-source map (generated)
│       └── dataverse/                      # Dataverse schema snapshots
├── public/                                 # Static assets
├── index.css                               # Root-level stylesheet (not imported by src/main.tsx)
├── src/
│   ├── generated/
│   │   ├── models/                         # Generated Dataverse models
│   │   └── services/                       # Generated Dataverse services
│   ├── services/
│   │   ├── operationalDashboardService.ts
│   │   └── operationsCommandCenterService.ts
│   ├── App.tsx                             # Data loading, navigation, equipment form
│   ├── ClientProjectViews.tsx              # Entity lists and related-record panels
│   ├── ExecutiveSummary.tsx
│   ├── OperationsCommandCenter.tsx         # Current dashboard
│   ├── OperationalDashboard.tsx            # Additional dashboard implementation
│   ├── SortableTable.tsx                   # Shared table, pagination, detail dialog
│   ├── App.css
│   ├── OperationalDashboard.css
│   └── index.css
├── index.html
├── package.json
├── package-lock.json
├── power.config.json
├── vite.config.ts
├── tsconfig*.json
├── eslint.config.js
└── README.md
```

`src/OperationalDashboard.tsx` and `src/services/operationalDashboardService.ts` are present in the repository; the application entry point currently renders `OperationsCommandCenter` for the Dashboard view.

## Dataverse data sources

The current Power Apps configuration maps the following Dataverse entity sets. Primary keys are from the generated data-source metadata.

| App data source | Dataverse entity set | Primary key |
| --- | --- | --- |
| Clients | `craft_clients` | `craft_clientid` |
| Contracts | `craft_contract1s` | `craft_contract1id` |
| Contractors | `craft_contractors` | `craft_contractorid` |
| Daily Site Reports | `craft_dailysitereports` | `craft_dailysitereportid` |
| Employees | `craft_employees` | `craft_employeeid` |
| Equipment | `craft_equipments` | `craft_equipmentid` |
| Inspections | `craft_inspections` | `craft_inspectionid` |
| Payment Applications | `craft_paymentapplications` | `craft_paymentapplicationid` |
| Permit Approvals | `craft_permitapprovals` | `craft_permitapprovalid` |
| Projects | `craft_projects` | `craft_projectid` |
| Project Documents | `craft_projectdocuments` | `craft_projectdocumentid` |
| Project Phases | `craft_projectphases` | `craft_projectphaseid` |
| Purchase Orders | `craft_purchaseorders` | `craft_purchaseorderid` |
| Safety Incidents | `craft_safetyincidents` | `craft_safetyincidentid` |
| Suppliers | `craft_suppliers` | `craft_supplierid` |
| Variation Orders | `craft_variationorders` | `craft_variationorderid` |
| Work Packages | `craft_workpackages` | `craft_workpackageid` |

### Lookup relationships represented in the app

The generated models expose Dataverse lookup bind properties and returned lookup IDs (for example, `craft_project@odata.bind` and `_craft_project_value`). The current UI matches those values to display related records. The relationships used are:

| Parent/lookup record | Related child records | Lookup examples present in generated models or app matching code |
| --- | --- | --- |
| Client | Projects | Project `craft_client` / `_craft_client_value` or `craft_clientid` |
| Employee | Projects | Project `craft_employeerecord` / `_craft_employeerecord_value`; project manager identifier is also considered by the UI |
| Project | Contracts | Contract `craft_project` / `_craft_project_value` |
| Contractor | Contracts | Contract `craft_contractor` / `_craft_contractor_value` |
| Project | Project Phases | Project Phase `craft_projectidentifier` / `_craft_project_value` |
| Project | Permit Approvals | Permit `craft_project` / `_craft_project_value` |
| Project | Safety Incidents | Incident `craft_project` / `_craft_project_value` |
| Project | Variation Orders | Variation Order `craft_project` / `_craft_project_value` |
| Project | Project Documents | Document `craft_project` / `_craft_project_value` |
| Project | Work Packages | Work Package `craft_project` / `_craft_project_value` |
| Project Phase | Work Packages | Work Package `craft_projectphase` / `_craft_projectphase_value` |
| Contractor | Work Packages | Work Package `craft_contractor` / `_craft_contractor_value` |
| Project | Inspections | Inspection `craft_project` / `_craft_project_value` |
| Employee | Inspections | Inspection `craft_inspectorid` / `_craft_employeerecord_value` |
| Project | Payment Applications | Payment Application `craft_project` / `_craft_project_value` |
| Contract | Payment Applications | Payment Application `craft_contract1` / `_craft_contract1_value` |
| Project | Daily Site Reports | Daily Site Report `craft_project` / `_craft_project_value` |
| Employee | Daily Site Reports | Daily Site Report `_craft_employee_value` |
| Project | Purchase Orders | Purchase Order `craft_project` / `_craft_project_value` |
| Supplier | Purchase Orders | Purchase Order `craft_supplier` / `_craft_supplier_value` |

Recent Git commits explicitly describe the Employee–Project, Project–Contract, Contractor–Contract, Project/Phase/Contractor–Work Package, Project/Employee–Inspection, Project/Contract–Payment Application, Project–Project Document, and Project–Daily Site Report relationship work. The current UI also has lookup matching for the other pairs listed above.

**Schema limitation:** this repository contains generated client models and code that uses lookup fields, but it does not contain an export of the live Dataverse relationship metadata. The table above documents relationships represented by the application and commits; confirm cardinality, requiredness, cascade behavior, and lookup configuration in the target Dataverse environment before changing its schema.

### Data access and record limits

Generated services call the Power Apps SDK Dataverse client for record retrieval. The app initially loads data sources concurrently; the current calls request up to 200 rows for most entity sets and up to 100 Equipment rows, with an explicit Equipment column selection. Dashboard refresh requests up to 200 rows for most sources and 100 Equipment rows. Related-record matching and most dashboard calculations happen in the browser using the records returned by those calls.

The Equipment screen uses the generated create and update operations. Although generated services also contain retrieval and delete methods, the current UI does not offer Equipment deletion. The other entity screens currently display and navigate records without editing them.

## Power Apps Code App configuration

`power.config.json` is the checked-in Code App configuration. It identifies the application as a `CodeApp`, uses `dist` as the build path and `index.html` as the build entry point, and declares the Dataverse sources under `databaseReferences.default.cds`. `vite.config.ts` registers both the React plugin and the `@microsoft/power-apps-vite` plugin.

The configuration currently has an empty `connectionReferences` object and an empty `environmentVariableName`. No `.env`-based application configuration is declared or read by the current source. The selected Power Platform environment is represented in `power.config.json`; verify that target and its data sources before using Power Platform tooling. Do not copy production-bound configuration into an unintended environment.

There is no app-specific login page or authentication configuration in source code. Use the supported Power Apps host/runtime and SDK context, and ensure each user's Dataverse role grants only the required table privileges. Based on the current interface, users need read access to the displayed data and create/update access to Equipment only if they are expected to use the Equipment form.

## Prerequisites

- Node.js `^20.19.0` or `>=22.12.0` (Vite 7 requirement).
- npm, using the checked-in `package-lock.json`.
- Access to the repository and a compatible local development environment.
- For live Dataverse-backed use: access to the configured Power Platform environment, the listed Dataverse tables, and appropriate user permissions.
- The Power Apps Vite integration and Power Apps CLI are included as project dependencies. No separate global CLI installation procedure is documented in this repository.

## Local setup and development

From the repository root:

```sh
npm ci
npm run dev
```

Vite prints the local development URL in the terminal (its default port is `5173`). The configured `power.config.json` also contains `localAppUrl: "http://localhost:3000"`; verify the expected local launch flow and port when using Power Apps tooling.

The application requires a valid Power Apps/Dataverse runtime context for live data operations. The source does not provide a standalone `.env` setup or mock-data mode.

## Build, lint, and preview

```sh
npm run build
npm run lint
npm run preview
```

- `npm run build` runs `tsc -b` followed by `vite build`; the production assets are written to `dist/`.
- `npm run lint` runs ESLint over the project.
- `npm run preview` serves the existing Vite production build locally; run the build first.
- `package.json` does not define a test script.

## Deployment

The repository is configured for a Power Apps Code App build (`dist` and `index.html` in `power.config.json`) and includes the Power Apps Vite plugin and CLI dependency. It does **not** currently contain a deployment script, CI/CD workflow, or checked-in deployment runbook. Consequently, no Power Platform deployment command or manual publishing sequence can be verified from this repository; follow the approved deployment process for the target environment rather than assuming a command.

## Git workflow

The observed repository uses `master` as its initial/default branch and has feature branches named `feature/*`. There is no checked-in policy specifying pull-request requirements, merge strategy, or release tagging. The current checkout and HEAD are recorded in [Current status](#current-status).

Typical branch and commit workflow:

```sh
git status
git switch -c feature/<short-description>
# edit and verify changes
git add <specific-files>
git commit -m "Describe the change"
git push -u origin feature/<short-description>
```

Use `git status` before staging and stage only intended files; do not commit credentials or environment-specific secrets.

## Development history

The README in the initial commit was the Vite starter template; project documentation was added in `f8fc491`. The following milestones are grouped from the repository history and current implementation:

### Dashboard

- Added interactive operational charts and dashboard capabilities (`43319c7`, 2026-09-28).
- Expanded portfolio and executive indicators, charts, filters, drill-downs, and related tables in the current dashboard implementation.

### Dataverse relationships and entity navigation

- Added Project–Variation Order and Project–Project Document relationship views.
- Added 1:N-related navigation for Employee–Project, Project–Contract, Contractor–Contract, and Project/Phase/Contractor–Work Package.
- Added Project/Employee–Inspection and Project/Contract–Payment Application links.
- Added project/phase/permit approval and Daily Site Report related-record views.
- These changes are represented by relationship commits including `ecc9d9e`, `32e88b8`, `f28c5ce`, `006b9f1`, `6ef9d16`, `664106c`, `ec9a987`, `f97f944`, `8a2bf57`, and `4d39b93` (2026-09-28 to 2026-09-29). The commit messages describe the relationship additions as 1:N; the checked-in client schemas do not establish the live environment's cardinality or cascade rules.

### UI and table improvements

- Added the shared sortable table, pagination, row details, navigation toggle, theme switch, and related responsive/visual styling (`a3c0ecd`, 2026-09-29).
- The subsequent `f8fc491` commit includes follow-up pagination controls, hamburger-collapse styling, and per-chart reset behavior alongside its README update.

## Current status

- **Branch:** `feature/audit-readme` (the local `feature/gray-theme` branch and `origin/feature/gray-theme` also point to this HEAD in the inspected repository state).
- **HEAD:** `f8fc491` — “Update: updated README.md file”
- **Implemented:** multi-entity Dataverse read views, equipment create/update, operational and executive dashboards, lookup-based related-record navigation, and the table/theme/navigation interactions listed above.
- No project roadmap or explicit planned feature list is checked in; no additional feature is documented as planned. The deployment process and the live Dataverse relationship metadata remain to be confirmed/documented.
- The inspected working tree was clean before this README audit. The `f8fc491` commit includes the follow-up pagination, navigation CSS, chart-reset source changes, and README changes.

## Known limitations and troubleshooting

- **Result coverage:** current fetch calls cap most entity sets at 200 records and Equipment at 100. Dashboards and client-side related-record panels operate on those fetched rows; larger datasets may require paging or server-side filtering.
- **Metric coverage:** calculations depend on populated Dataverse fields. The dashboard explicitly notes that historical trends, CPI, return forecasts, and resource recommendations require source fields not present in the current data model.
- **Build size:** a recent production build succeeded but emitted Vite's warning that the minified JavaScript chunk exceeds 500 kB.
- **Local URL:** Vite's default development URL/port may differ from the `localAppUrl` value in `power.config.json`; check the terminal output and Power Apps tooling configuration if the host cannot open the local app.
- **Data access errors:** confirm that the intended Power Platform environment is selected, the data source/table names match `power.config.json`, the user is signed in through the supported runtime, and the user's Dataverse role allows the requested operation.
- **Branding:** `index.html` still uses the Vite starter page title and `/vite.svg` favicon.
- **Testing:** no test command is defined in `package.json`.
- **Deployment:** this repository has no checked-in deployment instructions or automation, as noted above.

## Security guidance

- Never commit passwords, tokens, API keys, client secrets, or private connection strings.
- Do not add credentials to source files or `power.config.json`; use approved Power Platform environment and secret-management facilities if future integrations require secrets.
- Rely on the supported Power Apps host/runtime authentication and Dataverse authorization. Do not treat hiding a UI action as a substitute for server-side/table permissions.
- Grant the least privilege required: read access for the data the app displays, and Equipment create/update privileges only where those actions are required.
- Check the target environment and data-source configuration before building or publishing with Power Platform tooling.
