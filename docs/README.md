# Project documentation index

This folder contains implementation-oriented documentation for Dubai ERP. Start with the root [`README.md`](../README.md) for the project overview and common commands, then use this index to select the area relevant to your task.

| Topic | Document |
| --- | --- |
| Architecture, data flow, integration boundaries | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Dataverse sources, generated access services, configuration | [DATA-SOURCES.md](DATA-SOURCES.md) |
| Code-side entities, referenced fields, lookup evidence, schema uncertainty | [DATA-MODEL.md](DATA-MODEL.md) |
| Implemented capabilities and limits | [FEATURES.md](FEATURES.md) |
| Pages, navigation, layout, shared UI patterns | [UI-ARCHITECTURE.md](UI-ARCHITECTURE.md) |
| Dashboard filters, derivations, calculations | [FILTERING-AND-CALCULATIONS.md](FILTERING-AND-CALCULATIONS.md) |
| Table page state, page-size behavior, interactions | [PAGINATION.md](PAGINATION.md) |
| Current chart inventory, data derivation, interactions, states | [CHARTS-AND-VISUALIZATIONS.md](CHARTS-AND-VISUALIZATIONS.md) |
| Prerequisites, configuration, development commands | [DEVELOPMENT.md](DEVELOPMENT.md) |
| Test infrastructure and validation guidance | [TESTING.md](TESTING.md) |
| Verified deployment configuration and external requirements | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Repository-supported troubleshooting | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Architectural decisions and evidenced trade-offs | [DECISIONS.md](DECISIONS.md) |

## Source-of-truth rule

Documentation explains observed behavior but can lag implementation. Source code, `package.json`/lockfile, `vite.config.ts`, `power.config.json`, generated schema snapshots, and Git history are the implementation evidence. Read the current code before changing it. A client-side lookup field or code-side ID match does **not** by itself prove a live Dataverse relationship, cardinality, requiredness, or cascade behavior; those require verification in the target Power Platform environment.

No separate test suite, deployment runbook, or checked-in environment-variable example was found during this documentation pass. See the respective documents for the limits of what can be verified.
