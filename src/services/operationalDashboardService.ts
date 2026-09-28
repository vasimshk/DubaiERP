import type { Craft_dailysitereports } from '../generated/models/Craft_dailysitereportsModel'
import type { Craft_paymentapplications } from '../generated/models/Craft_paymentapplicationsModel'
import type { Craft_projectphases } from '../generated/models/Craft_projectphasesModel'
import type { Craft_projects } from '../generated/models/Craft_projectsModel'
import type { Craft_purchaseorders } from '../generated/models/Craft_purchaseordersModel'
import type { Craft_variationorders } from '../generated/models/Craft_variationordersModel'
import type { Craft_workpackages } from '../generated/models/Craft_workpackagesModel'

export interface OperationalDashboardSource {
  projects: Craft_projects[]
  phases: Craft_projectphases[]
  dailySiteReports: Craft_dailysitereports[]
  workPackages: Craft_workpackages[]
  payments: Craft_paymentapplications[]
  purchaseOrders: Craft_purchaseorders[]
  variationOrders: Craft_variationorders[]
}

export interface DashboardFilters {
  projectId: string
  projectType: string
  status: string
}

export const emptyDashboardFilters: DashboardFilters = {
  projectId: 'all',
  projectType: 'all',
  status: 'all',
}

export interface DashboardFilterOptions {
  projects: Array<{ id: string; label: string }>
  projectTypes: string[]
  statuses: string[]
}

export interface DashboardKpi {
  label: string
  value: string
  detail: string
  tone?: 'positive' | 'warning' | 'critical'
}

export interface DashboardChartPoint {
  label: string
  value: number
  secondaryValue?: number
}

export interface DashboardChart {
  id: string
  title: string
  description: string
  kind: 'bar' | 'donut' | 'comparison' | 'progress' | 'line'
  points: DashboardChartPoint[]
  unavailableMessage?: string
  seriesLabels?: { primary: string; secondary: string }
}

export interface DashboardCell {
  display: string
  sortValue: string | number
}

export interface DashboardTableColumn {
  key: string
  label: string
  align?: 'left' | 'right'
}

export interface DashboardTableRow {
  id: string
  cells: Record<string, DashboardCell>
}

export interface DashboardTable {
  id: string
  label: string
  description: string
  columns: DashboardTableColumn[]
  rows: DashboardTableRow[]
  emptyMessage: string
}

export interface OperationalDashboardModel {
  filters: DashboardFilterOptions
  filteredProjectCount: number
  kpis: DashboardKpi[]
  charts: DashboardChart[]
  tables: DashboardTable[]
  sourceProjectCount: number
  filteredProjects: Craft_projects[]
}

interface NormalizedProject {
  record: Craft_projects
  id: string
  name: string
  type: string
  location: string
  status: string
  progress: number | null
  contractValue: number | null
  actualCost: number | null
  completed: boolean
  active: boolean
  onHold: boolean
  delayed: boolean
  attention: boolean
  riskScore: number | null
  managerId: string
}

type ProjectLinkedRecord = {
  craft_projectid?: string
  craft_projectidentifier?: string
  _craft_project_value?: string
}

const todayAtMidnight = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
const parseDate = (value?: string) => value ? Date.parse(value) : Number.NaN
const numberOrNull = (value?: number) => value == null || !Number.isFinite(value) ? null : value
const displayName = (project: Craft_projects) => project.craft_projectname || project.craft_projectid1 || project.craft_projectid
const statusName = (project: Craft_projects) => project.craft_status?.trim() || project.statuscodename || project.statecodename || 'Unspecified'
const typeName = (project: Craft_projects) => project.craft_projecttype?.trim() || 'Unspecified'
const locationName = (project: Craft_projects) => project.craft_location?.trim() || 'Unspecified'
const normalized = (value: string) => value.trim().toLowerCase()
const isStatus = (value: string, ...terms: string[]) => terms.some((term) => normalized(value).includes(term))
const formatCurrency = (value: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(value)
const formatNumber = (value: number, maximumFractionDigits = 0) => new Intl.NumberFormat('en', { maximumFractionDigits }).format(value)
const formatPercent = (value: number | null) => value == null ? 'Unavailable' : `${formatNumber(value, 1)}%`
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString() : 'Not recorded'

const projectIds = (project: Craft_projects) => [project.craft_projectid, project.craft_projectid1].filter((value): value is string => Boolean(value))

const belongsToProject = (record: ProjectLinkedRecord, project: Craft_projects | NormalizedProject) => {
  const linkedIds = [record.craft_projectid, record.craft_projectidentifier, record._craft_project_value].filter((value): value is string => Boolean(value))
  const projectRecord = 'record' in project ? project.record : project
  return linkedIds.some((id) => projectIds(projectRecord).includes(id))
}

const normalizeProject = (project: Craft_projects, now: number): NormalizedProject => {
  const progress = numberOrNull(project.craft_completionpercentage)
  const status = statusName(project)
  const completed = isStatus(status, 'complete', 'closed') || (progress != null && progress >= 100)
  const onHold = isStatus(status, 'hold', 'paused', 'suspended')
  const endDate = parseDate(project.craft_enddate)
  const delayed = !completed && Number.isFinite(endDate) && endDate < now
  const active = !completed && !onHold && (
    isStatus(status, 'active', 'in progress', 'underway') || project.statecode === 0 || project.craft_isactive === true
  )
  const health = project.craft_healthstatusname || ''
  const attention = delayed || isStatus(status, 'attention', 'risk', 'blocked', 'issue', 'delayed') || isStatus(health, 'amber', 'red')

  return {
    record: project,
    id: project.craft_projectid,
    name: displayName(project),
    type: typeName(project),
    location: locationName(project),
    status,
    progress,
    contractValue: numberOrNull(project.craft_contractvalueaed),
    actualCost: numberOrNull(project.craft_totalcost),
    completed,
    active,
    onHold,
    delayed,
    attention,
    riskScore: numberOrNull(project.craft_riskscore),
    managerId: project.craft_projectmanagerid?.trim() || 'Unassigned',
  }
}

const sum = (values: Array<number | null | undefined>) => values.reduce<number>((total, value) => total + (value ?? 0), 0)
const average = (values: Array<number | null>) => {
  const available = values.filter((value): value is number => value != null && Number.isFinite(value))
  return available.length ? available.reduce((total, value) => total + value, 0) / available.length : null
}

const cell = (display: string, sortValue: string | number = display): DashboardCell => ({ display, sortValue })
const projectLabelCell = (project: NormalizedProject) => cell(project.name)

const makeTable = (
  id: string,
  label: string,
  description: string,
  columns: DashboardTableColumn[],
  rows: DashboardTableRow[],
  emptyMessage: string,
): DashboardTable => ({ id, label, description, columns, rows, emptyMessage })

const projectColumns: DashboardTableColumn[] = [
  { key: 'project', label: 'Project' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'location', label: 'Location' },
  { key: 'progress', label: 'Progress', align: 'right' },
  { key: 'value', label: 'Contract value', align: 'right' },
  { key: 'endDate', label: 'End date' },
]

const projectRows = (projects: NormalizedProject[]): DashboardTableRow[] => projects.map((project) => ({
  id: project.id,
  cells: {
    project: projectLabelCell(project),
    status: cell(project.status),
    type: cell(project.type),
    location: cell(project.location),
    progress: cell(formatPercent(project.progress), project.progress ?? -1),
    value: cell(project.contractValue == null ? 'Not recorded' : formatCurrency(project.contractValue), project.contractValue ?? -1),
    endDate: cell(formatDate(project.record.craft_enddate), parseDate(project.record.craft_enddate) || 0),
  },
}))

const groupCount = (values: string[]) => {
  const counts = new Map<string, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts].map(([label, value]) => ({ label, value })).sort((left, right) => right.value - left.value)
}

const groupSum = (items: Array<{ label: string; value: number | null }>) => {
  const sums = new Map<string, number>()
  items.forEach(({ label, value }) => {
    if (value != null) sums.set(label, (sums.get(label) ?? 0) + value)
  })
  return [...sums].map(([label, value]) => ({ label, value })).sort((left, right) => right.value - left.value)
}

const top = <T extends { value: number }>(values: T[], limit = 8) => values.sort((left, right) => right.value - left.value).slice(0, limit)
const pointData = (values: Array<{ label: string; value: number }>): DashboardChartPoint[] => values.map(({ label, value }) => ({ label, value }))

const phaseStatus = (phase: Craft_projectphases) => phase.craft_phasestatusname || (
  phase.craft_phasestatus === 0 ? 'Completed' : phase.craft_phasestatus === 1 ? 'In Progress' : phase.craft_phasestatus === 2 ? 'Not Started' : 'Unspecified'
)

const getRelated = <T extends ProjectLinkedRecord>(records: T[], projects: NormalizedProject[]) => {
  const selectedIds = new Set(projects.flatMap((project) => projectIds(project.record)))
  return records.filter((record) => [record.craft_projectid, record.craft_projectidentifier, record._craft_project_value].some((id) => id && selectedIds.has(id)))
}

const buildTables = (
  projects: NormalizedProject[],
  source: OperationalDashboardSource,
  now: number,
): DashboardTable[] => {
  const activeProjects = projects.filter((project) => project.active)
  const delayedProjects = projects.filter((project) => project.delayed)
  const completedProjects = projects.filter((project) => project.completed)
  const onHoldProjects = projects.filter((project) => project.onHold)
  const attentionProjects = projects.filter((project) => project.attention)
  const phases = getRelated(source.phases, projects)
  const upcomingPhases = phases.filter((phase) => {
    const plannedEnd = parseDate(phase.craft_plannedenddate)
    return Number.isFinite(plannedEnd) && plannedEnd >= now
  }).sort((left, right) => parseDate(left.craft_plannedenddate) - parseDate(right.craft_plannedenddate))
  const phaseProjectBudget = new Map<string, number>()
  phases.forEach((phase) => {
    const project = projects.find((candidate) => belongsToProject(phase, candidate))
    if (project && phase.craft_budgetaed != null) phaseProjectBudget.set(project.id, (phaseProjectBudget.get(project.id) ?? 0) + phase.craft_budgetaed)
  })
  const budgetColumns = [...projectColumns.slice(0, 1), { key: 'phaseBudget', label: 'Phase budget total', align: 'right' as const }, { key: 'actualCost', label: 'Project total cost', align: 'right' as const }, { key: 'variance', label: 'Actual less phase budget', align: 'right' as const }]
  const projectByForeignId = (record: ProjectLinkedRecord) => projects.find((project) => belongsToProject(record, project))

  const phaseColumns: DashboardTableColumn[] = [
    { key: 'phase', label: 'Phase / milestone' },
    { key: 'project', label: 'Project' },
    { key: 'status', label: 'Status' },
    { key: 'progress', label: 'Progress', align: 'right' },
    { key: 'plannedStart', label: 'Planned start' },
    { key: 'plannedEnd', label: 'Planned end' },
    { key: 'actualEnd', label: 'Actual end' },
    { key: 'budget', label: 'Budget', align: 'right' },
  ]
  const phaseRows = (records: Craft_projectphases[]): DashboardTableRow[] => records.map((phase) => {
    const project = projectByForeignId(phase)
    return {
      id: phase.craft_projectphaseid,
      cells: {
        phase: cell(phase.craft_phasename || phase.craft_phaseidentifier || phase.craft_projectphaseid),
        project: cell(project?.name || 'Unassigned'),
        status: cell(phaseStatus(phase)),
        progress: cell(formatPercent(phase.craft_progresspercentage ?? null), phase.craft_progresspercentage ?? -1),
        plannedStart: cell(formatDate(phase.craft_plannedstartdate), parseDate(phase.craft_plannedstartdate) || 0),
        plannedEnd: cell(formatDate(phase.craft_plannedenddate), parseDate(phase.craft_plannedenddate) || 0),
        actualEnd: cell(formatDate(phase.craft_actualenddate), parseDate(phase.craft_actualenddate) || 0),
        budget: cell(phase.craft_budgetaed == null ? 'Not recorded' : formatCurrency(phase.craft_budgetaed), phase.craft_budgetaed ?? -1),
      },
    }
  })

  const issueReports = getRelated(source.dailySiteReports, projects).filter((report) => report.craft_reportedissues?.trim())
  const reportProject = (report: Craft_dailysitereports) => projectByForeignId(report)
  const projectFinanceRows = projects.map((project) => {
    const budget = phaseProjectBudget.get(project.id) ?? null
    const actual = project.actualCost
    const payments = getRelated(source.payments, [project]).reduce((total, payment) => total + (payment.craft_netcertifiedamountaed ?? 0), 0)
    const purchaseOrders = getRelated(source.purchaseOrders, [project]).reduce((total, order) => total + (order.craft_amountaed ?? 0), 0)
    const variations = getRelated(source.variationOrders, [project]).reduce((total, item) => total + (item.craft_variationordervalueaed ?? 0), 0)
    return { project, budget, actual, payments, purchaseOrders, variations }
  })

  const projectTables = [
    makeTable('portfolio', 'Project Portfolio', 'All projects matching the global filters.', projectColumns, projectRows(projects), 'No projects match the selected filters.'),
    makeTable('active', 'Active Projects', 'Projects marked active and not completed or on hold.', projectColumns, projectRows(activeProjects), 'No active projects match the selected filters.'),
    makeTable('delayed', 'Delayed Projects', 'Incomplete projects with an end date before today.', projectColumns, projectRows(delayedProjects), 'No delayed projects match the selected filters.'),
    makeTable('completed', 'Completed Projects', 'Projects marked complete or at 100% recorded progress.', projectColumns, projectRows(completedProjects), 'No completed projects match the selected filters.'),
    makeTable('on-hold', 'Projects On Hold', 'Projects with an explicit hold, pause, or suspension status.', projectColumns, projectRows(onHoldProjects), 'No projects are marked on hold.'),
  ]

  const budgetRows = projectFinanceRows.filter(({ budget, actual }) => budget != null || actual != null).map(({ project, budget, actual }) => ({
    id: project.id,
    cells: {
      project: projectLabelCell(project),
      phaseBudget: cell(budget == null ? 'Not recorded' : formatCurrency(budget), budget ?? -1),
      actualCost: cell(actual == null ? 'Not recorded' : formatCurrency(actual), actual ?? -1),
      variance: cell(budget == null || actual == null ? 'Unavailable' : formatCurrency(actual - budget), budget == null || actual == null ? -1 : actual - budget),
    },
  }))
  const financeColumns: DashboardTableColumn[] = [
    { key: 'project', label: 'Project' },
    { key: 'contractValue', label: 'Contract value', align: 'right' },
    { key: 'revenue', label: 'Recorded revenue', align: 'right' },
    { key: 'cost', label: 'Total cost', align: 'right' },
    { key: 'certified', label: 'Net certified', align: 'right' },
    { key: 'purchaseOrders', label: 'Purchase orders', align: 'right' },
    { key: 'variations', label: 'Variation value', align: 'right' },
  ]
  const financeRows: DashboardTableRow[] = projectFinanceRows.map(({ project, payments, purchaseOrders, variations }) => ({
    id: project.id,
    cells: {
      project: projectLabelCell(project),
      contractValue: cell(project.contractValue == null ? 'Not recorded' : formatCurrency(project.contractValue), project.contractValue ?? -1),
      revenue: cell(project.record.craft_totalrevenue == null ? 'Not recorded' : formatCurrency(project.record.craft_totalrevenue), project.record.craft_totalrevenue ?? -1),
      cost: cell(project.actualCost == null ? 'Not recorded' : formatCurrency(project.actualCost), project.actualCost ?? -1),
      certified: cell(formatCurrency(payments), payments),
      purchaseOrders: cell(formatCurrency(purchaseOrders), purchaseOrders),
      variations: cell(formatCurrency(variations), variations),
    },
  }))
  const progressRows: DashboardTableRow[] = projects.map((project) => ({
    id: project.id,
    cells: {
      project: projectLabelCell(project),
      status: cell(project.status),
      start: cell(formatDate(project.record.craft_startdate), parseDate(project.record.craft_startdate) || 0),
      end: cell(formatDate(project.record.craft_enddate), parseDate(project.record.craft_enddate) || 0),
      elapsed: cell(project.record.craft_elapseddays == null ? 'Not recorded' : `${project.record.craft_elapseddays} days`, project.record.craft_elapseddays ?? -1),
      duration: cell(project.record.craft_durationdays == null ? 'Not recorded' : `${project.record.craft_durationdays} days`, project.record.craft_durationdays ?? -1),
      progress: cell(formatPercent(project.progress), project.progress ?? -1),
    },
  }))
  const riskRows: DashboardTableRow[] = projects.filter((project) => project.riskScore != null).map((project) => ({
    id: project.id,
    cells: {
      project: projectLabelCell(project),
      score: cell(formatNumber(project.riskScore!, 1), project.riskScore!),
      health: cell(project.record.craft_healthstatusname || 'Not recorded'),
      status: cell(project.status),
    },
  }))
  const issueRows: DashboardTableRow[] = issueReports.map((report) => ({
    id: report.craft_dailysitereportid,
    cells: {
      project: cell(reportProject(report)?.name || 'Unassigned'),
      date: cell(formatDate(report.craft_reportdate), parseDate(report.craft_reportdate) || 0),
      report: cell(report.craft_reportid || report.craft_dailysitereportid),
      issue: cell(report.craft_reportedissues || ''),
    },
  }))
  const managerRows: DashboardTableRow[] = projects.filter((project) => project.managerId !== 'Unassigned').map((project) => ({
    id: project.id,
    cells: { manager: cell(project.managerId), project: projectLabelCell(project), status: cell(project.status), progress: cell(formatPercent(project.progress), project.progress ?? -1) },
  }))
  return [
    ...projectTables,
    makeTable('milestones', 'Milestones', 'Project phases are used as milestone records because there is no separate milestone entity.', phaseColumns, phaseRows(phases), 'No project phases are available for the selected projects.'),
    makeTable('upcoming-milestones', 'Upcoming Milestones', 'Project phases with a planned end date on or after today.', phaseColumns, phaseRows(upcomingPhases), 'No upcoming phase milestones have a planned end date.'),
    makeTable('budget-actual', 'Budget vs Actual', 'Phase budget totals compared with project total cost; these fields are recorded at different levels.', budgetColumns, budgetRows, 'Budget or actual cost values are not available for these projects.'),
    makeTable('financial-summary', 'Financial Summary', 'Recorded project values plus related payment, purchase order, and variation totals.', financeColumns, financeRows, 'No financial records are available for the selected projects.'),
    makeTable('progress-details', 'Progress Details', 'Recorded progress and project schedule fields.', [
      { key: 'project', label: 'Project' }, { key: 'status', label: 'Status' }, { key: 'start', label: 'Start date' }, { key: 'end', label: 'End date' }, { key: 'elapsed', label: 'Elapsed' }, { key: 'duration', label: 'Duration' }, { key: 'progress', label: 'Progress', align: 'right' },
    ], progressRows, 'No project progress or schedule details are available.'),
    makeTable('risks', 'Risks', 'Project risk scores and health labels; no separate risk register is available.', [
      { key: 'project', label: 'Project' }, { key: 'score', label: 'Risk score', align: 'right' }, { key: 'health', label: 'Health' }, { key: 'status', label: 'Status' },
    ], riskRows, 'No project risk scores are recorded.'),
    makeTable('issues', 'Issues', 'Reported issue text from daily site reports; this is not a structured issue register.', [
      { key: 'project', label: 'Project' }, { key: 'date', label: 'Report date' }, { key: 'report', label: 'Report' }, { key: 'issue', label: 'Reported issues' },
    ], issueRows, 'No daily site reports contain reported issue text.'),
    makeTable('resources', 'Resources', 'Project-level employee/resource assignment fields are not present in the available schema.', [
      { key: 'project', label: 'Project' }, { key: 'resource', label: 'Resource' },
    ], [], 'Resource assignments are unavailable; employee records have no project allocation field.'),
    makeTable('teams-managers', 'Teams / Managers', 'Project manager identifiers are available; manager names and team assignments are not.', [
      { key: 'manager', label: 'Project manager ID' }, { key: 'project', label: 'Project' }, { key: 'status', label: 'Status' }, { key: 'progress', label: 'Progress', align: 'right' },
    ], managerRows, 'No project manager IDs are recorded.'),
    makeTable('attention', 'Projects Requiring Attention', 'Delayed, amber/red health, or explicit risk/issue/blocked/attention statuses.', projectColumns, projectRows(attentionProjects), 'No projects currently meet the attention criteria.'),
  ]
}

const buildCharts = (projects: NormalizedProject[], source: OperationalDashboardSource, now: number): DashboardChart[] => {
  const linkedPhases = getRelated(source.phases, projects)
  const linkedReports = getRelated(source.dailySiteReports, projects)
  const linkedPackages = getRelated(source.workPackages, projects)
  const linkedPayments = getRelated(source.payments, projects)
  const noHistory = 'Progress snapshots are not stored, so a historical trend cannot be calculated.'
  const noResourceAssignments = 'Employee project assignments and team membership are not present in the available schema.'
  const make = (id: string, title: string, description: string, points: DashboardChartPoint[], kind: DashboardChart['kind'] = 'bar', unavailableMessage?: string, seriesLabels?: DashboardChart['seriesLabels']): DashboardChart => ({ id, title, description, points, kind, unavailableMessage, seriesLabels })
  const phaseBudgetByProject = projects.map((project) => ({
    label: project.name,
    value: sum(linkedPhases.filter((phase) => belongsToProject(phase, project)).map((phase) => phase.craft_budgetaed)),
  }))
  const phaseEndVariance = linkedPhases.flatMap((phase) => {
    const planned = parseDate(phase.craft_plannedenddate)
    const actual = parseDate(phase.craft_actualenddate)
    if (!Number.isFinite(planned) || !Number.isFinite(actual)) return []
    return [{ label: phase.craft_phasename || phase.craft_phaseidentifier || phase.craft_projectphaseid, value: Math.round((actual - planned) / 86400000) }]
  })
  const managerProgress = new Map<string, number[]>()
  projects.forEach((project) => {
    if (project.managerId !== 'Unassigned' && project.progress != null) managerProgress.set(project.managerId, [...(managerProgress.get(project.managerId) ?? []), project.progress])
  })
  const paymentTotals = projects.map((project) => ({
    label: project.name,
    value: sum(linkedPayments.filter((payment) => belongsToProject(payment, project)).map((payment) => payment.craft_netcertifiedamountaed)),
  }))
  const workPackageComparison = projects.map((project) => {
    const records = linkedPackages.filter((item) => belongsToProject(item, project))
    return { label: project.name, value: sum(records.map((item) => item.craft_totalamountaed)), secondaryValue: sum(records.map((item) => item.craft_executedamountaed)) }
  })
  const issueCounts = projects.map((project) => ({
    label: project.name,
    value: linkedReports.filter((report) => belongsToProject(report, project) && Boolean(report.craft_reportedissues?.trim())).length,
  }))
  const today = todayAtMidnight(new Date(now))
  const upcoming = linkedPhases.flatMap((phase) => {
    const plannedEnd = parseDate(phase.craft_plannedenddate)
    if (!Number.isFinite(plannedEnd) || plannedEnd < today) return []
    return [{ label: phase.craft_phasename || phase.craft_phaseidentifier || phase.craft_projectphaseid, value: 1 }]
  })
  const statusGroups = groupCount(projects.map((project) => project.status))
  const typeValues = groupSum(projects.map((project) => ({ label: project.type, value: project.contractValue })))
  const costsByLocation = groupSum(projects.map((project) => ({ label: project.location, value: project.actualCost })))
  const healthGroups = groupCount(projects.map((project) => project.record.craft_healthstatusname || 'Unspecified'))
  const typeProgress = new Map<string, number[]>()
  projects.forEach((project) => {
    if (project.progress != null) typeProgress.set(project.type, [...(typeProgress.get(project.type) ?? []), project.progress])
  })

  return [
    make('status', 'Projects by Status', 'Project record status.', pointData(statusGroups), 'donut'),
    make('type', 'Projects by Type', 'Project count by recorded project type.', pointData(groupCount(projects.map((project) => project.type)))),
    make('location', 'Projects by Location / Region', 'Project count by recorded location; the schema stores location, not a normalized region.', pointData(groupCount(projects.map((project) => project.location)))),
    make('progress', 'Project Progress', 'Distribution by recorded progress bands.', pointData(groupCount(projects.map((project) => project.progress == null ? 'Not recorded' : project.progress >= 100 ? '100%' : project.progress >= 75 ? '75-99%' : project.progress >= 50 ? '50-74%' : project.progress >= 25 ? '25-49%' : '0-24%')))),
    make('schedule', 'Schedule / Delayed Projects', 'Delayed means end date is before today and project is below 100% complete.', pointData(groupCount(projects.map((project) => project.delayed ? 'Delayed' : project.completed ? 'Completed' : 'Not currently delayed'))), 'donut'),
    make('milestones', 'Milestones', 'Project phases shown as milestone proxies; no separate milestone entity exists.', pointData(groupCount(linkedPhases.map(phaseStatus))), 'donut', linkedPhases.length ? undefined : 'No project phases are available for the selected projects.'),
    make('completion', 'Project Completion', 'Top projects by recorded completion percentage.', top(projects.filter((project) => project.progress != null).map((project) => ({ label: project.name, value: project.progress! }))), 'progress'),
    make('budget-actual', 'Budget vs Actual', 'Phase budget totals compared with project total cost; values are recorded at different levels.', projects.map((project) => ({ label: project.name, value: sum(linkedPhases.filter((phase) => belongsToProject(phase, project)).map((phase) => phase.craft_budgetaed)), secondaryValue: project.actualCost ?? 0 })).filter((point) => point.value > 0 || point.secondaryValue > 0), 'comparison', undefined, { primary: 'Phase budget', secondary: 'Project total cost' }),
    make('project-value', 'Project Value', 'Sum of recorded contract value by project type.', pointData(typeValues), 'bar', typeValues.length ? undefined : 'Contract value is not recorded for the selected projects.'),
    make('cost', 'Cost', 'Project total cost by recorded location.', pointData(costsByLocation), 'bar', projects.some((project) => project.actualCost != null) ? undefined : 'Project total cost is not recorded.'),
    make('progress-trend', 'Progress Trends', noHistory, [], 'line', noHistory),
    make('resources', 'Resources / Teams', noResourceAssignments, [], 'bar', noResourceAssignments),
    make('managers', 'Managers', 'Average recorded project progress by manager ID; the schema does not provide manager names.', pointData([...managerProgress].map(([label, values]) => ({ label, value: average(values) ?? 0 }))), 'progress'),
    make('risks', 'Risks', 'Recorded project risk score by project; there is no separate risk register.', pointData(top(projects.flatMap((project) => project.riskScore == null ? [] : [{ label: project.name, value: project.riskScore }]))), 'bar', projects.some((project) => project.riskScore != null) ? undefined : 'Project risk scores are not recorded.'),
    make('issues', 'Issues', 'Daily site reports containing issue text; this is not a structured issue register.', pointData(top(issueCounts.filter((item) => item.value > 0))), 'bar', linkedReports.some((report) => report.craft_reportedissues?.trim()) ? undefined : 'No reported issue text is available in the selected projects’ site reports.'),
    make('attention', 'Projects Requiring Attention', 'Delayed, amber/red health, or explicit risk/issue/blocked/attention statuses.', pointData(groupCount(projects.filter((project) => project.attention).map((project) => isStatus(project.status, 'hold') ? 'On hold' : project.delayed ? 'Past end date' : project.record.craft_healthstatusname || 'Explicit status flag')))),
    make('health', 'Project Health', 'Projects by recorded health label.', pointData(healthGroups), 'donut'),
    make('completion-type', 'Completion by Project Type', 'Average recorded completion by project type.', pointData([...typeProgress].map(([label, values]) => ({ label, value: average(values) ?? 0 }))), 'progress'),
    make('upcoming-milestones', 'Upcoming Milestones', 'Nearest project phase planned end dates; phases are milestone proxies.', top(upcoming), 'bar', upcoming.length ? undefined : 'No future planned phase end dates are available.'),
    make('phase-budget', 'Phase Budget by Project', 'Sum of recorded phase budgets by project.', pointData(top(phaseBudgetByProject.filter((item) => item.value > 0))), 'bar', linkedPhases.some((phase) => phase.craft_budgetaed != null) ? undefined : 'Project phase budgets are not recorded.'),
    make('phase-schedule', 'Phase Schedule Variance', 'Actual phase end date minus planned phase end date, in days; positive means later.', pointData(top(phaseEndVariance.map((item) => ({ label: item.label, value: item.value })))), 'bar', phaseEndVariance.length ? undefined : 'No phases have both planned and actual end dates.'),
    make('work-packages', 'Resources / Work Packages', 'Work package total amount versus executed amount by project.', workPackageComparison.filter((item) => item.value > 0 || item.secondaryValue > 0), 'comparison', linkedPackages.length ? undefined : 'No work packages are available for the selected projects.', { primary: 'Package amount', secondary: 'Executed amount' }),
    make('cash-flow', 'Certified Payments', 'Net certified payment application amounts by project.', pointData(top(paymentTotals.filter((item) => item.value > 0))), 'bar', linkedPayments.length ? undefined : 'No payment applications are available for the selected projects.'),
  ]
}

export function getOperationalDashboardModel(source: OperationalDashboardSource, filters: DashboardFilters, now = Date.now()): OperationalDashboardModel {
  const normalizedProjects = source.projects.map((project) => normalizeProject(project, todayAtMidnight(new Date(now))))
  const filtered = normalizedProjects.filter((project) =>
    (filters.projectId === 'all' || project.id === filters.projectId) &&
    (filters.projectType === 'all' || project.type === filters.projectType) &&
    (filters.status === 'all' || project.status === filters.status)
  )
  const filteredRecords: OperationalDashboardSource = {
    ...source,
    projects: filtered.map((project) => project.record),
    phases: getRelated(source.phases, filtered),
    dailySiteReports: getRelated(source.dailySiteReports, filtered),
    workPackages: getRelated(source.workPackages, filtered),
    payments: getRelated(source.payments, filtered),
    purchaseOrders: getRelated(source.purchaseOrders, filtered),
    variationOrders: getRelated(source.variationOrders, filtered),
  }
  const filteredNormalized = filtered
  const today = todayAtMidnight(new Date(now))
  const weightedProjects = filtered.filter((project) => project.progress != null && (project.contractValue ?? 0) > 0)
  const weightedProgress = weightedProjects.length
    ? weightedProjects.reduce((total, project) => total + project.progress! * project.contractValue!, 0) / weightedProjects.reduce((total, project) => total + project.contractValue!, 0)
    : null
  const values = {
    total: filtered.length,
    active: filtered.filter((project) => project.active).length,
    completed: filtered.filter((project) => project.completed).length,
    delayed: filtered.filter((project) => project.delayed).length,
    onHold: filtered.filter((project) => project.onHold).length,
    completedValue: sum(filtered.filter((project) => project.completed).map((project) => project.contractValue)),
    activeValue: sum(filtered.filter((project) => project.active).map((project) => project.contractValue)),
    progress: average(filtered.map((project) => project.progress)),
    nearingCompletion: filtered.filter((project) => !project.completed && project.progress != null && project.progress >= 80 && project.progress < 100).length,
    attention: filtered.filter((project) => project.attention).length,
  }
  const filtersOptions: DashboardFilterOptions = {
    projects: normalizedProjects.map((project) => ({ id: project.id, label: project.name })).sort((left, right) => left.label.localeCompare(right.label)),
    projectTypes: [...new Set(normalizedProjects.map((project) => project.type))].sort((left, right) => left.localeCompare(right)),
    statuses: [...new Set(normalizedProjects.map((project) => project.status))].sort((left, right) => left.localeCompare(right)),
  }

  const kpis: DashboardKpi[] = [
    { label: 'Total Projects', value: formatNumber(values.total), detail: 'Projects after all filters' },
    { label: 'Active Projects', value: formatNumber(values.active), detail: 'Active; excludes complete and on hold', tone: 'positive' },
    { label: 'Completed Projects', value: formatNumber(values.completed), detail: 'Completed status or 100% progress' },
    { label: 'Delayed Projects', value: formatNumber(values.delayed), detail: 'Past end date and below 100% completion', tone: values.delayed ? 'critical' : undefined },
    { label: 'Projects On Hold', value: formatNumber(values.onHold), detail: 'Explicit hold, pause, or suspended status', tone: values.onHold ? 'warning' : undefined },
    { label: 'Total Project Value', value: formatCurrency(sum(filtered.map((project) => project.contractValue))), detail: 'Sum of recorded contract values' },
    { label: 'Completed Project Value', value: formatCurrency(values.completedValue), detail: 'Contract value for completed projects' },
    { label: 'Active Project Value', value: formatCurrency(values.activeValue), detail: 'Contract value for active projects' },
    { label: 'Average Project Progress', value: formatPercent(values.progress), detail: 'Unweighted mean of recorded completion percentages' },
    { label: 'Projects Nearing Completion', value: formatNumber(values.nearingCompletion), detail: '80% to under 100% recorded progress' },
    { label: 'Projects Requiring Attention', value: formatNumber(values.attention), detail: 'Delayed, amber/red, or explicitly flagged', tone: values.attention ? 'warning' : undefined },
    { label: 'Overall Portfolio Progress', value: formatPercent(weightedProgress), detail: 'Completion weighted by contract value' },
  ]

  return {
    filters: filtersOptions,
    filteredProjectCount: filtered.length,
    kpis,
    charts: buildCharts(filteredNormalized, filteredRecords, today),
    tables: buildTables(filteredNormalized, filteredRecords, today),
    sourceProjectCount: source.projects.length,
    filteredProjects: filtered.map((project) => project.record),
  }
}