# Data model evidence

## Scope and confidence

The application is typed against generated Dataverse entity models and the `.power/schemas/dataverse/*.Schema.json` snapshots. Those files establish the table/entity-set names, generated primary IDs, fields exposed to this code generation snapshot, and some lookup-typed attributes. Application source shows which fields it reads and which identifier values it compares.

This repository does **not** provide a verified export of live Dataverse relationship metadata. A lookup-typed model property, a foreign-key-like name, or a client-side identifier comparison does not establish a live relationship or its cardinality. The Git history contains commits whose messages describe certain changes as 1:N, but confirm the relationship itself, requiredness, cascade behavior, and target schema in the actual environment. Those facts **Require verification**.

## Configured entities and primary IDs

The 17 entities below are in `power.config.json`; primary IDs are from `.power/schemas/appschemas/dataSourcesInfo.ts`. Fields in the final column are examples actually referenced by app code, not an exhaustive Dataverse column inventory.

| Entity set | Generated primary ID | Representative fields referenced by current UI/services |
| --- | --- | --- |
| `craft_clients` | `craft_clientid` | `craft_clientname`, `craft_clienttype`, `craft_clientstatusname`, `craft_contactperson`, `craft_contactemail`, `craft_contactphone`, `craft_clientaddress`, `craft_paymentterms`, `craft_creditlimitaed`, `craft_lastactivitydate` |
| `craft_projects` | `craft_projectid` | `craft_projectname`, `craft_projectid1`, `craft_projecttype`, `craft_status`, `craft_healthstatusname`, `craft_completionpercentage`, `craft_startdate`, `craft_enddate`, `craft_location`, `craft_contractvalueaed`, `craft_totalcost`, `craft_totalrevenue`, `craft_budgetvariancepercentage`, `craft_riskscore`, `craft_elapseddays`, `craft_remainingdays`, `craft_projectmanagerid` |
| `craft_contract1s` | `craft_contract1id` | `craft_contractid1`, `craft_contractstatusname`, `craft_completiondate`, `craft_contractvalueaed`, `craft_projectid`, `craft_contractorid` |
| `craft_contractors` | `craft_contractorid` | `craft_contractorid1`, `craft_companyname`, `craft_specialty`, `craft_ratingname`, `craft_prequalifiedname` |
| `craft_dailysitereports` | `craft_dailysitereportid` | `craft_reportid`, `craft_reportdate`, `craft_reportedissues`, `craft_weatherconditionname`, `craft_projectid` |
| `craft_employees` | `craft_employeeid` | `craft_employeeid1`, `craft_fullname`, `craft_department`, `craft_designation`, `craft_employmentstatusname`, `craft_visastatus` |
| `craft_equipments` | `craft_equipmentid` | `craft_equipmentid1`, `craft_model`, `craft_serialnumber`, `craft_currentproject`, `craft_currentstatusname`, `craft_equipmenttypename`, `craft_ownershipstatusname`, `craft_dailyrateaed`, `craft_isactive`, `craft_operatorrequired`, `craft_internalnotes` |
| `craft_inspections` | `craft_inspectionid` | `craft_inspectionid1`, `craft_inspectiondate`, `craft_inspectiontypename`, `craft_inspectionresultname`, `craft_defectsfound`, `craft_correctiveaction`, `craft_inspectorid`, `craft_projectid` |
| `craft_paymentapplications` | `craft_paymentapplicationid` | `craft_certificatenumber`, `craft_statusname`, `craft_paymentdate`, `craft_periodstartdate`, `craft_periodenddate`, `craft_netcertifiedamountaed`, `craft_retentionamountaed`, `craft_projectid`, `craft_contractid` |
| `craft_permitapprovals` | `craft_permitapprovalid` | `craft_permitid1`, `craft_permittypename`, `craft_statusname`, `craft_expirydate`, `craft_isexpired`, `craft_projectid` |
| `craft_projectdocuments` | `craft_projectdocumentid` | `craft_documentnumber`, `craft_documenttypename`, `craft_statusname`, `craft_submissiondate`, `craft_title`, `craft_projectid` |
| `craft_projectphases` | `craft_projectphaseid` | `craft_phaseidentifier`, `craft_phasename`, `craft_phasestatusname`, `craft_progresspercentage`, `craft_budgetaed`, `craft_plannedstartdate`, `craft_plannedenddate`, `craft_actualstartdate`, `craft_actualenddate`, `craft_projectidentifier` |
| `craft_purchaseorders` | `craft_purchaseorderid` | `craft_purchaseorderid1`, `craft_purchaseordertypename`, `craft_statusname`, `craft_deliverydate`, `craft_totalamountaed`, `craft_projectid`, `craft_supplierid` |
| `craft_safetyincidents` | `craft_safetyincidentid` | `craft_incidentdate`, `craft_incidentdescription`, `craft_incidentlocation`, `craft_incidentstatusname`, `craft_incidenttypename`, `craft_numberofinjuredpersons`, `craft_projectid` |
| `craft_suppliers` | `craft_supplierid` | `craft_supplierid1`, `craft_companyname`, `craft_ratingname`, `craft_prequalifiedname`, `craft_tradelicensenumber` |
| `craft_variationorders` | `craft_variationorderid` | `craft_variationorderid1`, `craft_variationordernumber`, `craft_statusname`, `craft_variationordervalueaed`, `craft_timeimpactdays`, `craft_projectid` |
| `craft_workpackages` | `craft_workpackageid` | `craft_packageid`, `craft_itemdescription`, `craft_totalamountaed`, `craft_executedamountaed`, `craft_executedquantity`, `craft_projectid`, `craft_phaseid`, `craft_contractorid` |

The names above are drawn from references in `src/App.tsx`, `src/ClientProjectViews.tsx`, `src/ExecutiveSummary.tsx`, and the dashboard service modules. Actual nullability, business meaning, allowed values, and target-environment schema may differ and **Require verification**.

## Lookup/identifier matching used by the application

This table records comparisons performed in `src/ClientProjectViews.tsx` and `src/services/operationsCommandCenterService.ts`. It describes application behavior only, not independently validated Dataverse relationships.

| Code compares these record groups | Identifier/lookup values used in code |
| --- | --- |
| Client ↔ Project | Project `_craft_client_value` or `craft_clientid`; compared to client `craft_clientid` / `craft_clientid1` |
| Employee ↔ Project | Project `_craft_employeerecord_value` or `craft_projectmanagerid`; compared to employee `craft_employeeid` / `craft_employeeid1` |
| Project ↔ Contract | Contract `craft_projectid` / `_craft_project_value`; compared to project `craft_projectid` / `craft_projectid1` |
| Contractor ↔ Contract | Contract `craft_contractorid` / `_craft_contractor_value`; compared to contractor IDs |
| Project ↔ Project Phase | Phase `craft_projectidentifier` / `_craft_project_value`; compared to project IDs |
| Project ↔ Permit Approval, Safety Incident, Variation Order, Project Document | Child `craft_projectid` / `_craft_project_value`; compared to project IDs |
| Project ↔ Work Package, Inspection, Payment Application, Daily Site Report, Purchase Order | Child `craft_projectid` / `_craft_project_value`; compared to project IDs |
| Project Phase ↔ Work Package | Work Package `craft_phaseid` / `_craft_projectphase_value`; compared to phase `craft_projectphaseid` / `craft_phaseidentifier` |
| Contractor ↔ Work Package | Work Package `craft_contractorid` / `_craft_contractor_value`; compared to contractor IDs |
| Employee ↔ Inspection | Inspection `craft_inspectorid` / `_craft_employeerecord_value`; compared to employee IDs |
| Contract ↔ Payment Application | Payment Application `craft_contractid` / `_craft_contract1_value`; compared to contract IDs |
| Employee ↔ Daily Site Report | Daily Site Report `_craft_employee_value`; compared to employee IDs |
| Supplier ↔ Purchase Order | Purchase Order `_craft_supplier_value` / `craft_vendorid`; compared to supplier IDs |
| Project ↔ Equipment | Equipment `craft_currentproject` text is compared to project ID/name keys in the dashboard service |

Identifier fallbacks and comparisons in code accommodate more than one available identifier representation; they do not prove those values are unique, referentially valid, or configured as a Dataverse relationship. Verify that in the target environment.

## Relationship history

Git commit messages describe 1:N additions: Employee–Project (`ecc9d9e`), Project–Contract (`32e88b8`), Contractor–Contract (`f28c5ce`), Project/Phase/Contractor–Work Package (`006b9f1`), Project/Employee–Inspection (`6ef9d16`), Project/Contract–Payment Application (`664106c`), Project–Project Document (`f97f944`), and Project/Daily Site Report (`4d39b93`). Commit `8a2bf57` describes “Project/Phase–Permit Approval” work, but that wording does not establish whether it means a direct Phase–Permit relationship or multiple related views. `ec9a987` describes Project–Variation Order integration.

These commit messages are historical claims, not a substitute for the live relationship definitions. Exact relationship schema, including whether each remains active and its cardinality/cascade rules, **Requires verification**.

## Known non-relational code behavior

Several associations are performed by client-side string matching across the currently loaded records. Equipment project assignment specifically uses `craft_currentproject` text in the command-center service. Do not assume all related-record displays are backed by formal Dataverse lookup relationships.
