# Implemented features

This document describes behavior present in the current source. The code does not contain a roadmap; items absent from this list should not be assumed implemented or planned.

## Active application views

The app shell in `src/App.tsx` conditionally renders the current view from React state (there is no URL router):

- Dashboard / Operations Command Center
- Executive Summary
- Clients and Projects
- Contracts, Contractors, Employees, Equipment, Suppliers
- Daily Site Reports, Inspections, Payment Applications, Permit Approvals, Project Documents, Project Phases, Purchase Orders, Safety Incidents, Variation Orders, Work Packages

The entity views provide a listing, local filtering/search where implemented, record details, and cross-navigation using currently loaded identifiers. See [`UI-ARCHITECTURE.md`](UI-ARCHITECTURE.md) and [`DATA-MODEL.md`](DATA-MODEL.md).

## Dashboard

The active Dashboard renders `OperationsCommandCenter`. Implemented behavior includes:

- Project, project-type, and status filters plus reset and visible project counts.
- A command-center overview with operational indicators, the top-five KPI marquee, chart-category navigation, and operational tables.
- Twenty-three chart model definitions across portfolio health, financial control, project performance, contractor/workforce, procurement/equipment, risk/compliance, and executive decision categories.
- Chart legend visibility toggles, chart-point drill-down where project IDs are provided, chart-specific reset, collapse/expand, and navigation to a related operational table where configured.
- Fifteen generated operational table views with local search, sort, paging, page-size selection, and row detail dialogs.
- Dashboard refresh, last-refreshed display, initial loading indicator, and refresh/data-source error states.

The “All visualizations 23” tab caption currently matches the 23 chart definitions in the active chart service.

## Executive summary

`ExecutiveSummary` calculates a focused operational risk overview from the loaded project, contract, permit, incident, inspection, payment, purchase order, and employee arrays. It includes ten pain-point indicators, severity counts, three operational readiness scores, a severity filter, and a clickable exposure focus. Definitions are code-level formulas, not independently approved business rules.

## Tables and data interaction

- `SortableTable` adds client-side sorting, pagination, configurable page size, and a row detail dialog to entity tables that use it.
- The current command-center table and the separate `OperationalDashboard` table component each implement their own filter/sort/page pipelines and use the shared page controls/dialog.
- Equipment form UI creates and updates records through its generated Dataverse service. Entity editing/deletion workflows for other tables are not implemented in the app UI.
- Dashboard filters and related-record navigation act on arrays already loaded by the app; they do not prove complete Dataverse retrieval.

## Presentation and persisted preferences

- Light and gray visual themes; theme choice is stored under `dubai-erp-theme` in browser `localStorage`.
- Collapsible side navigation, responsive CSS layouts, rounded/hover/focus styling, and reduced-motion rules.
- Command-center collapsed panel IDs are kept in browser `sessionStorage`.
- Shared record detail dialogs close by close button, Escape, or clicking the backdrop.

## Present but not selected by app navigation

`src/OperationalDashboard.tsx` and `src/services/operationalDashboardService.ts` contain a separate dashboard UI/model with their own KPI/chart/table definitions. `App.tsx` currently routes its Dashboard view to `OperationsCommandCenter`, not `OperationalDashboard`. Document or change the alternate implementation as present-but-inactive; do not describe it as the active UI without verifying a routing change.

## Not established as implemented

No checked-in roadmap, separate mock-data mode, historical snapshot store, deployment automation, test suite, or non-Equipment editing workflow was found. Historical progress trend is explicitly unavailable in the active command-center service because progress snapshots are not stored. Do not present these as shipped features.
