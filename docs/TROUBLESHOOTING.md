# Troubleshooting

This guide includes only issues or limits evidenced by repository configuration/source. It does not claim a verified external fix where none is documented.

| Symptom or constraint | Evidence and safe next step |
| --- | --- |
| Data appears empty or some sources fail to load | `App.tsx` loads each configured source through generated services, applies an individual initial-load timeout, and records source errors; the dashboard also presents load/refresh error feedback. Check the app's visible error message and verify Power Apps host context, selected environment, source availability, and user Dataverse access with the environment owner. Exact external permission or connection remedies **Require verification**. |
| A source shows fewer rows than expected | Current initial/refresh requests use `top: 200` for most sources and `top: 100` for Equipment. Browser pagination operates only on returned rows, not further Dataverse pages. See [`DATA-SOURCES.md`](DATA-SOURCES.md) and [`PAGINATION.md`](PAGINATION.md). |
| Local launch URL differs from Power Apps configuration | Vite defaults to 5173 while `power.config.json` sets `localAppUrl` to 3000. No repository setting reconciles the difference. Verify the expected launch command/host rather than assuming either port is required. |
| Dataverse calls fail outside the Power Apps host | The repository does not provide a standalone authentication flow or mock-data fallback. Use the supported Power Apps runtime context; authentication configuration and external account access **Require verification**. |
| Progress Trends has no plotted history | This is the current implemented state, not a failed request: the active service has no historical progress snapshots and returns an unavailable message. Do not treat current progress as a historical series. |
| No automated test command is available | `package.json` has no test script and no checked-in tests were found in the repository inspection. Use build and lint as available validations; do not report them as test-suite passes. |
| Lint currently exits nonzero | In the documentation validation run, `npm run lint` reported 24 errors and 1 warning across existing UI source files, including React hook effect state updates and a preserved-memoization diagnostic. Application source was not changed in that task. Re-run lint before acting on this snapshot; remediation is outside this documentation-only change. |
| No deployment instructions are available | There is no checked-in deployment runbook or CI/CD pipeline. See [`DEPLOYMENT.md`](DEPLOYMENT.md); obtain the approved process from Power Platform owners. |

For a new recurring issue, add a troubleshooting entry only after reproducing or verifying both the symptom and resolution. Avoid recording credentials, tenant/environment IDs, connection strings, or other secrets.
