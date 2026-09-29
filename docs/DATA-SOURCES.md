# Data sources and access

## Source of configuration

`power.config.json` is the checked-in Power Apps Code App configuration. Its `databaseReferences.default.cds.dataSources` map connects application-facing names to Dataverse entity-set names and logical names. `.power/schemas/appschemas/dataSourcesInfo.ts` maps entity-set names to primary keys for the Power Apps SDK. Both files are generated/configuration artifacts; do not assume a copied configuration targets the intended environment.

`vite.config.ts` registers `@microsoft/power-apps-vite/plugin`. Generated service classes in `src/generated/services/` use `getClient(dataSourcesInfo)` from `@microsoft/power-apps/data`.

## Configured application data sources

| App-facing source name | Entity set | Logical name | Access invoked by app |
| --- | --- | --- | --- |
| `equipment` | `craft_equipments` | `craft_equipment` | `getAll` during load/refresh; `create` and `update` in Equipment form |
| `client` | `craft_clients` | `craft_client` | `getAll` |
| `project` | `craft_projects` | `craft_project` | `getAll` |
| `employees` | `craft_employees` | `craft_employee` | `getAll` |
| `contractor` | `craft_contractors` | `craft_contractor` | `getAll` |
| `supplier` | `craft_suppliers` | `craft_supplier` | `getAll` |
| `contract` | `craft_contract1s` | `craft_contract1` | `getAll` |
| `dailysitereports` | `craft_dailysitereports` | `craft_dailysitereport` | `getAll` |
| `inspections` | `craft_inspections` | `craft_inspection` | `getAll` |
| `paymentapplications` | `craft_paymentapplications` | `craft_paymentapplication` | `getAll` |
| `permitapprovals` | `craft_permitapprovals` | `craft_permitapproval` | `getAll` |
| `projectdocument` | `craft_projectdocuments` | `craft_projectdocument` | `getAll` |
| `projectphase` | `craft_projectphases` | `craft_projectphase` | `getAll` |
| `purchaseorder` | `craft_purchaseorders` | `craft_purchaseorder` | `getAll` |
| `safetyincidents` | `craft_safetyincidents` | `craft_safetyincident` | `getAll` |
| `variationorder` | `craft_variationorders` | `craft_variationorder` | `getAll` |
| `workpackages` | `craft_workpackages` | `craft_workpackage` | `getAll` |

The configured names and entity sets above are repository facts. Access is through the corresponding generated `Craft_*Service` class, which delegates to the SDK client. Generated classes expose standard create/read/update/delete methods, but the current application UI only invokes Equipment read/create/update; do not mistake generated method availability for an implemented user workflow.

## Fetch behavior

`src/App.tsx` starts initial reads concurrently through `Promise.all`. All listed sources request up to 200 records except Equipment, which requests up to 100 and supplies an explicit `select` list. Dashboard refresh again requests up to 200 records for most sources and 100 Equipment records. These are client call limits, not proof that the full Dataverse tables were retrieved. No application-level loop for paging every Dataverse source is present in this load path.

The initial data loader applies an 8-second per-request timeout; a timed-out source reports an error and resolves to an empty fallback for that source. Dashboard refresh wraps requests with a 12-second timeout and reports a refresh error. Equipment save refreshes only its Equipment list after a successful create/update.

The client dashboard and entity pages filter and associate data in memory. They operate only on the records returned by the configured service requests.

## Configuration and environment facts

- `power.config.json` identifies the app as a Code App and points the build path to `./dist` with `index.html` as entry point.
- The checked-in configuration has an empty `connectionReferences` object and empty `environmentVariableName`; no app environment-variable name is configured there.
- No `.env` file/example, environment-variable reader, custom API base URL, or application-managed credentials are present in the inspected source.
- The actual availability of entities, SDK host context, authentication, and user privileges **Requires verification** in the Power Platform environment where the app is run.
- Environment-specific identifiers/settings are intentionally not repeated here. Verify the checked-in target configuration in the approved environment before Power Platform operations.

See [`DATA-MODEL.md`](DATA-MODEL.md) for code-side model fields and the strict limits on relationship claims.
