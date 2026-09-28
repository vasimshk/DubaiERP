import type { Craft_clients } from '../generated/models/Craft_clientsModel'
import type { Craft_contract1s } from '../generated/models/Craft_contract1sModel'
import type { Craft_contractors } from '../generated/models/Craft_contractorsModel'
import type { Craft_dailysitereports } from '../generated/models/Craft_dailysitereportsModel'
import type { Craft_employees } from '../generated/models/Craft_employeesModel'
import type { Craft_equipments } from '../generated/models/Craft_equipmentsModel'
import type { Craft_inspections } from '../generated/models/Craft_inspectionsModel'
import type { Craft_paymentapplications } from '../generated/models/Craft_paymentapplicationsModel'
import type { Craft_permitapprovals } from '../generated/models/Craft_permitapprovalsModel'
import type { Craft_projectdocuments } from '../generated/models/Craft_projectdocumentsModel'
import type { Craft_projectphases } from '../generated/models/Craft_projectphasesModel'
import type { Craft_projects } from '../generated/models/Craft_projectsModel'
import type { Craft_purchaseorders } from '../generated/models/Craft_purchaseordersModel'
import type { Craft_safetyincidents } from '../generated/models/Craft_safetyincidentsModel'
import type { Craft_suppliers } from '../generated/models/Craft_suppliersModel'
import type { Craft_variationorders } from '../generated/models/Craft_variationordersModel'
import type { Craft_workpackages } from '../generated/models/Craft_workpackagesModel'

export interface CommandCenterSource {
  projects: Craft_projects[]
  contracts: Craft_contract1s[]
  contractors: Craft_contractors[]
  workPackages: Craft_workpackages[]
  payments: Craft_paymentapplications[]
  variationOrders: Craft_variationorders[]
  incidents: Craft_safetyincidents[]
  inspections: Craft_inspections[]
  permits: Craft_permitapprovals[]
  equipment: Craft_equipments[]
  phases: Craft_projectphases[]
  purchaseOrders: Craft_purchaseorders[]
  documents: Craft_projectdocuments[]
  clients: Craft_clients[]
  dailySiteReports: Craft_dailysitereports[]
  suppliers: Craft_suppliers[]
  employees: Craft_employees[]
}

export interface CommandFilters {
  projectId: string
  projectType: string
  status: string
  drilldownProjectIds: string[]
  drilldownLabel: string
}

export const emptyCommandFilters: CommandFilters = {
  projectId: 'all',
  projectType: 'all',
  status: 'all',
  drilldownProjectIds: [],
  drilldownLabel: '',
}

export interface CommandMetric {
  id: string
  label: string
  value: string
  detail: string
  rawValue: number | null
  tone: 'green' | 'amber' | 'red' | 'neutral'
  gauge?: number | null
}

export type CommandChartKind = 'donut' | 'pie' | 'treemap' | 'gauge' | 'area' | 'line' | 'stacked' | 'scatter' | 'radar' | 'heatmap' | 'funnel' | 'timeline' | 'bar'
export type CommandChartCategory = 'Portfolio Health' | 'Financial Control' | 'Project Performance' | 'Contractor & Workforce' | 'Procurement & Equipment' | 'Risk & Compliance' | 'Executive Decision Matrix'

export interface CommandChartPoint {
  name: string
  projectIds: string[]
  [key: string]: string | number | null | string[]
}

export interface CommandChartSeries {
  key: string
  label: string
  color: string
  stackId?: string
}

export interface CommandChart {
  id: string
  category: CommandChartCategory
  title: string
  description: string
  kind: CommandChartKind
  data: CommandChartPoint[]
  series: CommandChartSeries[]
  categoryKey?: string
  xKey?: string
  yKey?: string
  unavailableMessage?: string
  tableId?: string
  valueSuffix?: string
}

export interface CommandCell {
  display: string
  sortValue: string | number
  tone?: 'green' | 'amber' | 'red' | 'neutral'
}

export interface CommandColumn {
  key: string
  label: string
  align?: 'left' | 'right'
}

export interface CommandRow {
  id: string
  projectIds: string[]
  cells: Record<string, CommandCell>
}

export interface CommandTable {
  id: string
  title: string
  section: CommandChartCategory
  description: string
  columns: CommandColumn[]
  rows: CommandRow[]
  emptyMessage: string
}

export interface CommandCenterModel {
  filters: {
    projects: Array<{ id: string; label: string }>
    projectTypes: string[]
    statuses: string[]
  }
  filteredProjectCount: number
  sourceProjectCount: number
  metrics: CommandMetric[]
  charts: CommandChart[]
  tables: CommandTable[]
}

interface ProjectView {
  record: Craft_projects
  id: string
  name: string
  type: string
  status: string
  location: string
  progress: number | null
  value: number | null
  cost: number | null
  budgetVariance: number | null
  health: string
  riskScore: number | null
  active: boolean
  completed: boolean
  delayed: boolean
  onHold: boolean
  attention: boolean
}

type Linked = { craft_projectid?: string; craft_projectidentifier?: string; _craft_project_value?: string }
type FiltersInput = Pick<CommandFilters, 'projectId' | 'projectType' | 'status'> & Partial<Pick<CommandFilters, 'drilldownProjectIds'>>

const palette = {
  teal: '#087f80', green: '#31806c', amber: '#c58a25', red: '#ad4b42', blue: '#527b98', plum: '#8b688b', lime: '#8b9c4c', grey: '#9ba9ad',
}
const nowMidnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
const dateValue = (value?: string) => value ? Date.parse(value) : Number.NaN
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString() : 'Not recorded'
const money = (value: number | null | undefined) => value == null ? 'Not recorded' : new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(value)
const integer = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value)
const percent = (value: number | null) => value == null ? 'Unavailable' : `${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)}%`
const mean = (values: Array<number | null | undefined>) => {
  const usable = values.filter((value): value is number => value != null && Number.isFinite(value))
  return usable.length ? usable.reduce((total, value) => total + value, 0) / usable.length : null
}
const sum = (values: Array<number | null | undefined>) => values.reduce<number>((total, value) => total + (value ?? 0), 0)
const nameOf = (project: Craft_projects) => project.craft_projectname || project.craft_projectid1 || project.craft_projectid
const statusOf = (project: Craft_projects) => project.craft_status?.trim() || project.statuscodename || project.statecodename || 'Unspecified'
const typeOf = (project: Craft_projects) => project.craft_projecttype?.trim() || 'Unspecified'
const normalize = (value: string) => value.trim().toLowerCase()
const includesTerm = (value: string, terms: string[]) => terms.some((term) => normalize(value).includes(term))
const keysOf = (project: Craft_projects) => [project.craft_projectid, project.craft_projectid1, project.craft_projectname].filter((value): value is string => Boolean(value)).map(normalize)
const foreignKeys = (item: Linked) => [item.craft_projectid, item.craft_projectidentifier, item._craft_project_value].filter((value): value is string => Boolean(value)).map(normalize)
const belongs = (item: Linked, project: ProjectView) => foreignKeys(item).some((key) => keysOf(project.record).includes(key))
const related = <T extends Linked>(records: T[], projects: ProjectView[]) => records.filter((record) => projects.some((project) => belongs(record, project)))
const mapCell = (display: string, sortValue: string | number = display, tone: CommandCell['tone'] = 'neutral'): CommandCell => ({ display, sortValue, tone })
const row = (id: string, projectIds: string[], cells: CommandRow['cells']): CommandRow => ({ id, projectIds, cells })
const table = (id: string, title: string, section: CommandChartCategory, description: string, columns: CommandColumn[], rows: CommandRow[], emptyMessage: string): CommandTable => ({ id, title, section, description, columns, rows, emptyMessage })
const countBy = (values: Array<{ name: string; projectId?: string }>, projectIdsForValue?: Map<string, string[]>) => {
  const groups = new Map<string, { count: number; projects: Set<string> }>()
  values.forEach(({ name, projectId }) => {
    const current = groups.get(name) ?? { count: 0, projects: new Set<string>() }
    current.count += 1
    const ids = projectId ? [projectId] : projectIdsForValue?.get(name) ?? []
    ids.forEach((id) => current.projects.add(id))
    groups.set(name, current)
  })
  return [...groups].map(([name, group]) => ({ name, value: group.count, projectIds: [...group.projects] }))
}
const chart = (
  id: string,
  category: CommandChartCategory,
  title: string,
  description: string,
  kind: CommandChartKind,
  data: CommandChartPoint[],
  series: CommandChartSeries[],
  options: Partial<Pick<CommandChart, 'categoryKey' | 'xKey' | 'yKey' | 'unavailableMessage' | 'tableId' | 'valueSuffix'>> = {},
): CommandChart => ({ id, category, title, description, kind, data, series, ...options })
const series = (key: string, label: string, color = palette.teal, stackId?: string): CommandChartSeries => ({ key, label, color, stackId })

const projectTableColumns: CommandColumn[] = [
  { key: 'project', label: 'Project' }, { key: 'client', label: 'Client' }, { key: 'status', label: 'Status' }, { key: 'type', label: 'Type' }, { key: 'location', label: 'Location' }, { key: 'progress', label: 'Progress', align: 'right' }, { key: 'value', label: 'Contract value', align: 'right' }, { key: 'end', label: 'End date' },
]
export function buildOperationsCommandCenter(source: CommandCenterSource, filters: FiltersInput, now = Date.now()): CommandCenterModel {
  const today = nowMidnight(new Date(now))
  const allProjects: ProjectView[] = source.projects.map((record) => {
    const status = statusOf(record)
    const progress = record.craft_completionpercentage ?? null
    const complete = includesTerm(status, ['complete', 'closed']) || (progress != null && progress >= 100)
    const hold = includesTerm(status, ['hold', 'pause', 'suspend'])
    const end = dateValue(record.craft_enddate)
    const delayed = !complete && Number.isFinite(end) && end < today
    const health = record.craft_healthstatusname || 'Unspecified'
    const attention = delayed || hold || includesTerm(status, ['risk', 'attention', 'blocked', 'issue', 'delay']) || includesTerm(health, ['amber', 'red'])
    return {
      record, id: record.craft_projectid, name: nameOf(record), type: typeOf(record), status,
      location: record.craft_location || 'Unspecified', progress, value: record.craft_contractvalueaed ?? null,
      cost: record.craft_totalcost ?? null, budgetVariance: record.craft_budgetvariancepercentage ?? null,
      health, riskScore: record.craft_riskscore ?? null, active: !complete && !hold && (includesTerm(status, ['active', 'progress', 'underway']) || record.statecode === 0 || record.craft_isactive === true),
      completed: complete, delayed, onHold: hold, attention,
    }
  })
  const projects = allProjects.filter((project) =>
    (filters.projectId === 'all' || project.id === filters.projectId) &&
    (filters.projectType === 'all' || project.type === filters.projectType) &&
    (filters.status === 'all' || project.status === filters.status) &&
    (!(filters.drilldownProjectIds?.length) || filters.drilldownProjectIds.includes(project.id))
  )

  const projectOptions = allProjects.map((project) => ({ id: project.id, label: project.name })).sort((left, right) => left.label.localeCompare(right.label))
  const selectedPhases = related(source.phases, projects)
  const selectedContracts = related(source.contracts, projects)
  const selectedWorkPackages = related(source.workPackages, projects)
  const selectedPayments = related(source.payments, projects)
  const selectedVariations = related(source.variationOrders, projects)
  const selectedIncidents = related(source.incidents, projects)
  const selectedInspections = related(source.inspections, projects)
  const selectedPermits = related(source.permits, projects)
  const selectedPurchaseOrders = related(source.purchaseOrders, projects)
  const selectedDocuments = related(source.documents, projects)
  const selectedReports = related(source.dailySiteReports, projects)
  const selectedContractors = source.contractors
  const selectedEquipment = source.equipment.filter((equipment) => {
    const currentProject = normalize(equipment.craft_currentproject || '')
    return projects.some((project) => keysOf(project.record).includes(currentProject))
  })
  const projectByForeignKey = new Map<string, ProjectView>()
  projects.forEach((project) => keysOf(project.record).forEach((key) => projectByForeignKey.set(key, project)))
  const projectFor = (record: Linked) => foreignKeys(record).map((key) => projectByForeignKey.get(key)).find(Boolean)
  const projectClient = (project: ProjectView) => source.clients.find((client) => {
    const clientId = project.record._craft_client_value || project.record.craft_clientid
    return clientId && [client.craft_clientid, client.craft_clientid1].some((id) => id && normalize(id) === normalize(clientId))
  })
  const projectEmployee = (project: ProjectView) => source.employees.find((employee) => {
    const employeeId = project.record._craft_employeerecord_value
    return employeeId && [employee.craft_employeeid, employee.craft_employeeid1].some((id) => id && normalize(id) === normalize(employeeId))
  })
  const phaseBudgets = new Map<string, number>()
  selectedPhases.forEach((phase) => {
    const project = projectFor(phase)
    if (project && phase.craft_budgetaed != null) phaseBudgets.set(project.id, (phaseBudgets.get(project.id) ?? 0) + phase.craft_budgetaed)
  })

  const pendingPayments = selectedPayments.filter((payment) => !includesTerm(payment.craft_statusname || '', ['paid']))
  const approvedVariations = selectedVariations.filter((variation) => includesTerm(variation.craft_statusname || '', ['approved']))
  const openIncidents = selectedIncidents.filter((incident) => includesTerm(incident.craft_incidentstatusname || '', ['open']) || incident.craft_incidentstatus === 1)
  const passedInspections = selectedInspections.filter((inspection) => includesTerm(inspection.craft_inspectionresultname || '', ['passed']) || inspection.craft_inspectionresult === 0)
  const inspectionRate = selectedInspections.length ? (passedInspections.length / selectedInspections.length) * 100 : null
  const expiringPermits = selectedPermits.filter((permit) => {
    const expiry = dateValue(permit.craft_expirydate)
    const days = (expiry - today) / 86400000
    return Number.isFinite(expiry) && days >= 0 && days < 30 && !includesTerm(permit.craft_statusname || '', ['expired']) && !permit.craft_isexpired
  })
  const rentedEquipment = selectedEquipment.filter((equipment) => equipment.craft_ownershipstatusname === 'Rented' || equipment.craft_ownershipstatus === 2)
  const rentalDailyCost = rentedEquipment.reduce((total, equipment) => total + (equipment.craft_dailyrateaed ?? 0), 0)
  const knownBudgetVariance = projects.map((project) => project.budgetVariance).filter((value): value is number => value != null && Number.isFinite(value))
  const averageBudgetVariance = mean(knownBudgetVariance)
  const portfolioCompletion = mean(projects.map((project) => project.progress))
  const metrics: CommandMetric[] = [
    { id: 'active-projects', label: 'Active Projects', value: integer(projects.filter((project) => project.active).length), detail: 'Not completed or on hold', rawValue: projects.filter((project) => project.active).length, tone: 'green' },
    { id: 'delayed-projects', label: 'Delayed Projects', value: integer(projects.filter((project) => project.delayed).length), detail: 'End date passed; completion below 100%', rawValue: projects.filter((project) => project.delayed).length, tone: projects.some((project) => project.delayed) ? 'red' : 'green' },
    { id: 'contract-value', label: 'Total Contract Value', value: money(sum(projects.map((project) => project.value))), detail: 'Recorded project contract value', rawValue: sum(projects.map((project) => project.value)), tone: 'neutral' },
    { id: 'completion', label: 'Portfolio Completion', value: percent(portfolioCompletion), detail: 'Mean of recorded project completion', rawValue: portfolioCompletion, tone: portfolioCompletion == null ? 'neutral' : portfolioCompletion >= 75 ? 'green' : portfolioCompletion >= 45 ? 'amber' : 'red', gauge: portfolioCompletion },
    { id: 'budget-overrun', label: 'Budget Overrun %', value: percent(averageBudgetVariance), detail: 'Green ≤0%; amber 0-5%; red >5%. Negative means under budget.', rawValue: averageBudgetVariance, tone: averageBudgetVariance == null ? 'neutral' : averageBudgetVariance <= 0 ? 'green' : averageBudgetVariance <= 5 ? 'amber' : 'red', gauge: averageBudgetVariance == null ? null : Math.max(0, Math.min(averageBudgetVariance, 100)) },
    { id: 'pending-payments', label: 'Pending Payments', value: money(sum(pendingPayments.map((payment) => payment.craft_netcertifiedamountaed))), detail: `${pendingPayments.length} applications not marked paid`, rawValue: sum(pendingPayments.map((payment) => payment.craft_netcertifiedamountaed)), tone: pendingPayments.length ? 'amber' : 'green' },
    { id: 'approved-variations', label: 'Approved Variation Orders', value: integer(approvedVariations.length), detail: money(sum(approvedVariations.map((variation) => variation.craft_variationordervalueaed))), rawValue: approvedVariations.length, tone: 'neutral' },
    { id: 'cpi', label: 'Cost Performance Index', value: 'Unavailable', detail: 'Earned value is not stored in the available data model', rawValue: null, tone: 'neutral' },
    { id: 'open-incidents', label: 'Open Safety Incidents', value: integer(openIncidents.length), detail: `${selectedIncidents.length} total incidents`, rawValue: openIncidents.length, tone: openIncidents.length ? 'red' : 'green' },
    { id: 'inspection-rate', label: 'Inspection Pass Rate', value: percent(inspectionRate), detail: `${passedInspections.length} passed / ${selectedInspections.length} inspections`, rawValue: inspectionRate, tone: inspectionRate == null ? 'neutral' : inspectionRate >= 95 ? 'green' : inspectionRate >= 85 ? 'amber' : 'red', gauge: inspectionRate },
    { id: 'permits-expiring', label: 'Permits Expiring <30 Days', value: integer(expiringPermits.length), detail: 'Active permits with a recorded expiry date', rawValue: expiringPermits.length, tone: expiringPermits.length ? 'amber' : 'green' },
    { id: 'rental-cost', label: 'Rented Equipment Cost / Day', value: money(rentalDailyCost), detail: `${rentedEquipment.length} rented assets linked by current project`, rawValue: rentalDailyCost, tone: 'neutral' },
  ]

  const makeProjectChartData = (groupOf: (project: ProjectView) => string, valueOf: (project: ProjectView) => number, seriesKey = 'value') => {
    const groups = new Map<string, { [key: string]: number | string | string[]; name: string; projectIds: string[] }>()
    projects.forEach((project) => {
      const group = groupOf(project)
      const point = groups.get(group) ?? { name: group, projectIds: [] as string[], [seriesKey]: 0 }
      point[seriesKey] = Number(point[seriesKey] ?? 0) + valueOf(project)
      point.projectIds = [...point.projectIds, project.id]
      groups.set(group, point)
    })
    return [...groups.values()]
  }
  const projectStatusData = makeProjectChartData((project) => project.status, () => 1)
  const projectTypeData = makeProjectChartData((project) => project.type, () => 1)
  const valuedProjects = projects.filter((project) => project.value != null)
  const budgetData = projects.flatMap((project) => {
    const budget = phaseBudgets.get(project.id)
    if (budget == null || project.cost == null) return []
    return [{ name: project.name, budget, actual: project.cost, projectIds: [project.id] }]
  })
  const phaseProgress = selectedPhases.map((phase) => ({ name: phase.craft_phasename || phase.craft_phaseidentifier || phase.craft_projectphaseid, project: projectFor(phase)?.name || 'Unassigned', progress: phase.craft_progresspercentage ?? 0, remaining: Math.max(0, 100 - (phase.craft_progresspercentage ?? 0)), projectIds: projectFor(phase) ? [projectFor(phase)!.id] : [] }))
  const milestoneTimeline = selectedPhases.filter((phase) => phase.craft_plannedenddate).map((phase) => ({ name: phase.craft_phasename || phase.craft_phaseidentifier || 'Project phase', date: dateValue(phase.craft_plannedenddate), actualDate: dateValue(phase.craft_actualenddate) || dateValue(phase.craft_plannedenddate), projectIds: projectFor(phase) ? [projectFor(phase)!.id] : [] }))
  const paymentByPeriod = new Map<string, { name: string; value: number; projectIds: string[] }>()
  selectedPayments.forEach((payment) => {
    const paymentProject = projectFor(payment)
    const date = payment.craft_paymentdate || payment.craft_periodenddate
    const key = date ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Undated'
    const item = paymentByPeriod.get(key) ?? { name: key, value: 0, projectIds: [] }
    item.value += payment.craft_netcertifiedamountaed ?? 0
    if (paymentProject) item.projectIds.push(paymentProject.id)
    paymentByPeriod.set(key, item)
  })
  const incidentTypes = countBy(selectedIncidents.map((incident) => ({ name: incident.craft_incidenttypename || 'Unspecified', projectId: projectFor(incident)?.id })))
  const documentStatuses = countBy(selectedDocuments.map((document) => ({ name: document.craft_statusname || 'Unspecified', projectId: projectFor(document)?.id })))
  const inspectionFailures = countBy(selectedInspections.filter((inspection) => inspection.craft_inspectionresult === 2 || includesTerm(inspection.craft_inspectionresultname || '', ['failed'])).map((inspection) => ({ name: inspection.craft_inspectiontypename || 'Inspection', projectId: projectFor(inspection)?.id })))
  const assignmentCoverage = projects.map((project) => ({ name: project.name, manager: project.record.craft_projectmanagerid ? 1 : 0, employee: projectEmployee(project) ? 1 : 0, projectIds: [project.id] }))
  const reportedIssueCounts = countBy(selectedReports.filter((report) => report.craft_reportedissues?.trim()).map((report) => ({ name: projectFor(report)?.name || 'Unassigned project', projectId: projectFor(report)?.id })))
  const attentionReasons = countBy(projects.filter((project) => project.attention).map((project) => ({
    name: project.delayed ? 'Past planned end date' : includesTerm(project.health, ['amber', 'red']) ? `${project.health} health` : project.onHold ? 'On hold' : 'Explicit flagged status',
    projectId: project.id,
  })))
  const noProgressHistory = 'Progress snapshots are not stored, so a historical project progress trend cannot be calculated.'
  const poStageValues = ['Draft', 'Issued', 'Invoiced', 'Delivered', 'Paid'].map((status) => ({ name: status, value: selectedPurchaseOrders.filter((order) => order.craft_statusname === status).length, projectIds: [...new Set(selectedPurchaseOrders.filter((order) => order.craft_statusname === status).map((order) => projectFor(order)?.id).filter((id): id is string => Boolean(id)))] }))
  const charts: CommandChart[] = [
    chart('project-status', 'Portfolio Health', 'Project Status Mix', 'Portfolio records by current project status.', 'donut', projectStatusData, [series('value', 'Projects')], { categoryKey: 'name', tableId: 'new-projects' }),
    chart('project-type', 'Portfolio Health', 'Projects by Type', 'Project count grouped by recorded type.', 'pie', projectTypeData, [series('value', 'Projects')], { categoryKey: 'name', tableId: 'new-projects' }),
    chart('location-treemap', 'Portfolio Health', 'Portfolio by Location', 'Contract value by recorded location; no region field is available.', 'treemap', makeProjectChartData((project) => project.location, (project) => project.value ?? 0).filter((point) => valuedProjects.some((project) => point.projectIds.includes(project.id))), [series('value', 'Contract value')], { categoryKey: 'name', tableId: 'new-projects', unavailableMessage: valuedProjects.length ? undefined : 'Contract values are not recorded for the selected projects.' }),
    chart('completion-gauge', 'Portfolio Health', 'Portfolio Completion', 'Average recorded project completion percentage.', 'gauge', [{ name: 'Completion', value: mean(projects.map((project) => project.progress)) ?? 0, projectIds: projects.map((project) => project.id) }], [series('value', 'Completion', palette.green)], { tableId: 'phase-progress', valueSuffix: '%', unavailableMessage: mean(projects.map((project) => project.progress)) == null ? 'Project completion is not recorded for the current selection.' : undefined }),
    chart('phase-timeline', 'Project Performance', 'Phase Timeline', 'Planned versus actual phase end dates; phases are the available milestone source.', 'timeline', milestoneTimeline, [series('date', 'Planned end', palette.teal), series('actualDate', 'Actual end', palette.amber)], { categoryKey: 'name', xKey: 'date', yKey: 'actualDate', tableId: 'phase-progress', unavailableMessage: selectedPhases.some((phase) => phase.craft_plannedenddate) ? undefined : 'No project phases have planned end dates.' }),
    chart('phase-progress', 'Project Performance', 'Phase Progress', 'Recorded completion and remaining percentage for project phases.', 'stacked', phaseProgress, [series('progress', 'Complete', palette.teal, 'phase'), series('remaining', 'Remaining', '#e4eceb', 'phase')], { categoryKey: 'name', tableId: 'phase-progress', valueSuffix: '%' }),
    chart('schedule-scatter', 'Project Performance', 'Schedule Exposure', 'Project elapsed days against remaining days; delayed projects are highlighted.', 'scatter', projects.flatMap((project) => project.record.craft_elapseddays == null || project.record.craft_remainingdays == null ? [] : [{ name: project.name, x: project.record.craft_elapseddays, y: project.record.craft_remainingdays, value: project.progress ?? 0, projectIds: [project.id] }]), [series('value', 'Progress', palette.teal)], { xKey: 'x', yKey: 'y', tableId: 'new-projects', unavailableMessage: projects.some((project) => project.record.craft_elapseddays != null && project.record.craft_remainingdays != null) ? undefined : 'Elapsed and remaining day values are not recorded together.' }),
    chart('budget-health', 'Financial Control', 'Budget Health', 'Recorded phase budget versus project total cost, shown at their available data grains.', 'scatter', budgetData.map((item) => ({ ...item, x: item.budget, y: item.actual, value: item.actual })), [series('actual', 'Project total cost', palette.red)], { xKey: 'x', yKey: 'y', tableId: 'budget-health', unavailableMessage: budgetData.length ? undefined : 'No selected projects have both a phase budget total and project total cost.' }),
    chart('cash-flow', 'Financial Control', 'Cash Flow & Payments', 'Net certified payments by recorded payment month.', 'area', [...paymentByPeriod.values()].sort((left, right) => left.name.localeCompare(right.name)), [series('value', 'Net certified', palette.teal)], { categoryKey: 'name', tableId: 'cash-flow' }),
    chart('retention', 'Financial Control', 'Retention Money', 'Retention held alongside net certified amount by payment application; amounts are compared, not added.', 'bar', selectedPayments.map((payment) => ({ name: String(payment.craft_certificatenumber ?? payment.craft_paymentapplicationid), retention: payment.craft_retentionamountaed ?? 0, certified: payment.craft_netcertifiedamountaed ?? 0, projectIds: projectFor(payment) ? [projectFor(payment)!.id] : [] })), [series('retention', 'Retention', palette.amber), series('certified', 'Net certified', palette.teal)], { categoryKey: 'name', tableId: 'retention' }),
    chart('variation-impact', 'Financial Control', 'Variation Order Impact', 'Variation order value grouped by approval status.', 'stacked', countVariationValues(selectedVariations, projectFor), [series('value', 'Variation value', palette.amber)], { categoryKey: 'name', tableId: 'vo-impact' }),
    chart('issues', 'Risk & Compliance', 'Reported Site Issues', 'Daily site report records with issue text, grouped by project; this is not a structured issue register.', 'bar', reportedIssueCounts, [series('value', 'Reports with issues', palette.red)], { categoryKey: 'name', tableId: 'executive-matrix', unavailableMessage: selectedReports.some((report) => report.craft_reportedissues?.trim()) ? undefined : 'No selected-project site reports contain issue text.' }),
    chart('progress-trend', 'Project Performance', 'Progress Trends', noProgressHistory, 'line', [], [series('progress', 'Progress', palette.teal)], { tableId: 'phase-progress', unavailableMessage: noProgressHistory }),
    chart('assignment-coverage', 'Contractor & Workforce', 'Manager & Employee Coverage', 'Project manager ID presence versus a linked employee record; department/team assignments are not modeled.', 'stacked', assignmentCoverage, [series('manager', 'Project manager ID', palette.plum, 'assignment'), series('employee', 'Linked employee record', palette.blue, 'assignment')], { categoryKey: 'name', tableId: 'executive-matrix', unavailableMessage: projects.some((project) => project.record.craft_projectmanagerid || projectEmployee(project)) ? undefined : 'No manager IDs or project employee lookups are recorded.' }),
    chart('procurement-funnel', 'Procurement & Equipment', 'PO Procurement Pipeline', 'Purchase order count grouped by the generated status labels.', 'funnel', poStageValues.filter((item) => item.value > 0), [series('value', 'Orders', palette.amber)], { categoryKey: 'name', tableId: 'po-pipeline', unavailableMessage: selectedPurchaseOrders.length ? undefined : 'No purchase orders are linked to the selected projects.' }),
    chart('work-package-execution', 'Procurement & Equipment', 'Work Package Execution', 'Planned package amount against executed amount by project.', 'stacked', projects.map((project) => { const items = selectedWorkPackages.filter((item) => belongs(item, project)); return { name: project.name, planned: sum(items.map((item) => item.craft_totalamountaed)), executed: sum(items.map((item) => item.craft_executedamountaed)), projectIds: [project.id] } }).filter((item) => item.planned || item.executed), [series('executed', 'Executed amount', palette.green, 'package'), series('planned', 'Package amount', palette.blue, 'package')], { categoryKey: 'name', tableId: 'budget-health', unavailableMessage: selectedWorkPackages.length ? undefined : 'No selected-project work packages are available.' }),
    chart('rental-mix', 'Procurement & Equipment', 'Rental Cost by Equipment Type', 'Daily rate by equipment type for project-linked rented equipment.', 'pie', countEquipmentRates(rentedEquipment, selectedEquipment, projects), [series('value', 'Daily rate', palette.amber)], { categoryKey: 'name', tableId: 'equipment-alerts', unavailableMessage: rentedEquipment.length ? undefined : 'No rented equipment is linked to the selected projects.' }),
    chart('safety-incidents', 'Risk & Compliance', 'Safety Incidents by Type', 'Project-linked incidents grouped by incident type.', 'donut', incidentTypes.map((item) => ({ ...item, projectIds: item.projectIds })), [series('value', 'Incidents', palette.red)], { categoryKey: 'name', tableId: 'safety-incidents' }),
    chart('inspection-defects', 'Risk & Compliance', 'Inspection Defects', 'Failed inspection records grouped by inspection type.', 'bar', inspectionFailures.map((item) => ({ ...item, projectIds: item.projectIds })), [series('value', 'Failed inspections', palette.red)], { categoryKey: 'name', tableId: 'inspection-defects' }),
    chart('permit-expiry', 'Risk & Compliance', 'Permit Expiry Timeline', 'Permit expiries over time; near-term count is summarized in the portfolio strip.', 'timeline', selectedPermits.filter((permit) => permit.craft_expirydate).map((permit) => ({ name: permit.craft_permittypename || permit.craft_permitid1 || 'Permit', date: dateValue(permit.craft_expirydate), value: 1, projectIds: projectFor(permit) ? [projectFor(permit)!.id] : [] })), [series('value', 'Permits', palette.amber)], { xKey: 'date', yKey: 'value', tableId: 'permit-expiry', unavailableMessage: selectedPermits.some((permit) => permit.craft_expirydate) ? undefined : 'Permit expiry dates are not recorded.' }),
    chart('documents', 'Risk & Compliance', 'Document Submission Status', 'Project documents grouped by recorded review status.', 'donut', documentStatuses.map((item) => ({ ...item, projectIds: item.projectIds })), [series('value', 'Documents', palette.blue)], { categoryKey: 'name', tableId: 'document-status' }),
    chart('risk-heatmap', 'Risk & Compliance', 'Project Risk Heatmap', 'Recorded project risk scores with budget variance context; color is relative to the selected project distribution.', 'heatmap', projects.filter((project) => project.riskScore != null).map((project) => ({ name: project.name, value: project.riskScore!, variance: project.budgetVariance, projectIds: [project.id] })), [series('value', 'Risk score', palette.red)], { tableId: 'executive-matrix', unavailableMessage: projects.some((project) => project.riskScore != null) ? undefined : 'Project risk scores are not recorded.' }),
    chart('projects-attention', 'Executive Decision Matrix', 'Projects Requiring Attention', 'Attention conditions grouped by the recorded trigger; select a segment to filter its projects.', 'donut', attentionReasons, [series('value', 'Projects', palette.red)], { categoryKey: 'name', tableId: 'executive-matrix', unavailableMessage: projects.some((project) => project.attention) ? undefined : 'No projects currently meet the attention criteria.' }),
  ]

  const projectTableRows = projects.map((project) => row(project.id, [project.id], { project: mapCell(project.name), client: mapCell(projectClient(project)?.craft_clientname || projectClient(project)?.craft_clientid1 || 'Not assigned'), status: mapCell(project.status, project.status, project.delayed ? 'red' : project.onHold ? 'amber' : project.completed ? 'green' : 'neutral'), type: mapCell(project.type), location: mapCell(project.location), progress: mapCell(percent(project.progress), project.progress ?? -1), value: mapCell(money(project.value), project.value ?? -1), end: mapCell(dateLabel(project.record.craft_enddate), dateValue(project.record.craft_enddate) || 0), health: mapCell(project.health, project.health, includesTerm(project.health, ['green']) ? 'green' : includesTerm(project.health, ['amber']) ? 'amber' : includesTerm(project.health, ['red']) ? 'red' : 'neutral') }))
  const phaseRows = selectedPhases.map((phase) => { const project = projectFor(phase); return row(phase.craft_projectphaseid, project ? [project.id] : [], { phase: mapCell(phase.craft_phasename || phase.craft_phaseidentifier || phase.craft_projectphaseid), project: mapCell(project?.name || 'Unassigned'), status: mapCell(phase.craft_phasestatusname || 'Not recorded'), progress: mapCell(percent(phase.craft_progresspercentage ?? null), phase.craft_progresspercentage ?? -1), planned: mapCell(dateLabel(phase.craft_plannedenddate), dateValue(phase.craft_plannedenddate) || 0), actual: mapCell(dateLabel(phase.craft_actualenddate), dateValue(phase.craft_actualenddate) || 0), budget: mapCell(money(phase.craft_budgetaed), phase.craft_budgetaed ?? -1) }) })
  const contractRelations = selectedContracts.map((contract) => ({ contract, project: projectFor(contract) }))
  const contractorRecommendations = selectedContractors.map((contractor) => {
    const contracts = contractRelations.filter(({ contract }) => contract.craft_contractorid === contractor.craft_contractorid || contract._craft_contractor_value === contractor.craft_contractorid)
    const packages = selectedWorkPackages.filter((workPackage) => workPackage.craft_contractorid === contractor.craft_contractorid || workPackage._craft_contractor_value === contractor.craft_contractorid)
    const projectIds = [...new Set([...contracts.map(({ project }) => project?.id), ...packages.map((item) => projectFor(item)?.id)].filter((id): id is string => Boolean(id)))]
    return row(contractor.craft_contractorid, projectIds, { contractor: mapCell(contractor.craft_companyname || contractor.craft_contractorid1 || contractor.craft_contractorid), specialty: mapCell(contractor.craft_specialty || 'Not recorded'), rating: mapCell(contractor.craft_ratingname || 'Unrated'), prequalified: mapCell(contractor.craft_prequalifiedname || 'Not recorded'), packageValue: mapCell(money(sum(packages.map((item) => item.craft_totalamountaed))), sum(packages.map((item) => item.craft_totalamountaed))), projects: mapCell(integer(projectIds.length), projectIds.length) })
  }).filter((item) => item.projectIds.length)
  const paymentRows = selectedPayments.map((payment) => { const project = projectFor(payment); return row(payment.craft_paymentapplicationid, project ? [project.id] : [], { application: mapCell(String(payment.craft_certificatenumber ?? payment.craft_paymentapplicationid)), project: mapCell(project?.name || 'Unassigned'), status: mapCell(payment.craft_statusname || 'Not recorded', payment.craft_statusname || '', includesTerm(payment.craft_statusname || '', ['overdue']) ? 'red' : includesTerm(payment.craft_statusname || '', ['paid']) ? 'green' : 'amber'), certified: mapCell(money(payment.craft_netcertifiedamountaed), payment.craft_netcertifiedamountaed ?? -1), retention: mapCell(money(payment.craft_retentionamountaed), payment.craft_retentionamountaed ?? -1), date: mapCell(dateLabel(payment.craft_paymentdate), dateValue(payment.craft_paymentdate) || 0) }) })
  const purchaseRows = selectedPurchaseOrders.map((order) => { const project = projectFor(order); const supplier = source.suppliers.find((item) => [item.craft_supplierid, item.craft_supplierid1].some((id) => id && normalize(id) === normalize(order.craft_vendorid || ''))); return row(order.craft_purchaseorderid, project ? [project.id] : [], { order: mapCell(order.craft_purchaseorderid1 || order.craft_purchaseorderid), project: mapCell(project?.name || 'Unassigned'), supplier: mapCell(supplier?.craft_companyname || order.craft_vendorid || 'Not recorded'), status: mapCell(order.craft_statusname || 'Not recorded', order.craft_statusname || '', includesTerm(order.craft_statusname || '', ['paid', 'delivered']) ? 'green' : includesTerm(order.craft_statusname || '', ['draft']) ? 'amber' : 'neutral'), amount: mapCell(money(order.craft_amountaed), order.craft_amountaed ?? -1), delivery: mapCell(dateLabel(order.craft_deliverydate), dateValue(order.craft_deliverydate) || 0) }) })
  const variationRows = selectedVariations.map((variation) => { const project = projectFor(variation); return row(variation.craft_variationorderid, project ? [project.id] : [], { variation: mapCell(variation.craft_variationorderid1 || String(variation.craft_variationordernumber ?? variation.craft_variationorderid)), project: mapCell(project?.name || 'Unassigned'), reason: mapCell(variation.craft_reasonname || 'Not recorded'), status: mapCell(variation.craft_statusname || 'Not recorded'), value: mapCell(money(variation.craft_variationordervalueaed), variation.craft_variationordervalueaed ?? -1), impact: mapCell(variation.craft_timeimpactdays == null ? 'Not recorded' : `${variation.craft_timeimpactdays} days`, variation.craft_timeimpactdays ?? -1) }) })
  const safetyRows = selectedIncidents.map((incident) => { const project = projectFor(incident); return row(incident.craft_safetyincidentid, project ? [project.id] : [], { incident: mapCell(incident.craft_incidentid || incident.craft_safetyincidentid), project: mapCell(project?.name || 'Unassigned'), type: mapCell(incident.craft_incidenttypename || 'Unspecified'), severity: mapCell(incident.craft_severitylevelname || 'Unspecified'), status: mapCell(incident.craft_incidentstatusname || 'Unspecified', incident.craft_incidentstatusname || '', includesTerm(incident.craft_incidentstatusname || '', ['open']) ? 'red' : 'green'), date: mapCell(dateLabel(incident.craft_incidentdate), dateValue(incident.craft_incidentdate) || 0) }) })
  const inspectionRows = selectedInspections.map((inspection) => { const project = projectFor(inspection); return row(inspection.craft_inspectionid, project ? [project.id] : [], { inspection: mapCell(inspection.craft_inspectionid1 || inspection.craft_inspectionid), project: mapCell(project?.name || 'Unassigned'), type: mapCell(inspection.craft_inspectiontypename || 'Unspecified'), result: mapCell(inspection.craft_inspectionresultname || 'Unspecified', inspection.craft_inspectionresultname || '', inspection.craft_inspectionresult === 0 ? 'green' : inspection.craft_inspectionresult === 2 ? 'red' : 'amber'), defects: mapCell(integer(inspection.craft_defectsfound ?? 0), inspection.craft_defectsfound ?? 0), reinspect: mapCell(dateLabel(inspection.craft_reinspectiondate), dateValue(inspection.craft_reinspectiondate) || 0) }) })
  const permitRows = selectedPermits.map((permit) => { const project = projectFor(permit); const days = (dateValue(permit.craft_expirydate) - today) / 86400000; return row(permit.craft_permitapprovalid, project ? [project.id] : [], { permit: mapCell(permit.craft_permitid1 || permit.craft_permittypename || permit.craft_permitapprovalid), project: mapCell(project?.name || 'Unassigned'), type: mapCell(permit.craft_permittypename || 'Unspecified'), status: mapCell(permit.craft_statusname || 'Unspecified', permit.craft_statusname || '', days < 0 ? 'red' : days < 30 ? 'amber' : 'green'), expiry: mapCell(dateLabel(permit.craft_expirydate), dateValue(permit.craft_expirydate) || 0), days: mapCell(Number.isFinite(days) ? `${Math.ceil(days)} days` : 'Not recorded', Number.isFinite(days) ? days : -1) }) })
  const equipmentRows = selectedEquipment.map((equipment) => { const project = projects.find((item) => keysOf(item.record).includes(normalize(equipment.craft_currentproject || ''))); return row(equipment.craft_equipmentid, project ? [project.id] : [], { asset: mapCell(equipment.craft_equipmentid1 || equipment.craft_model || equipment.craft_equipmentid), project: mapCell(project?.name || equipment.craft_currentproject || 'Unassigned'), type: mapCell(equipment.craft_equipmenttypename || 'Unspecified'), ownership: mapCell(equipment.craft_ownershipstatusname || 'Unspecified'), status: mapCell(equipment.craft_currentstatusname || 'Unspecified', equipment.craft_currentstatusname || '', equipment.craft_currentstatus === 2 ? 'amber' : 'neutral'), rate: mapCell(money(equipment.craft_dailyrateaed), equipment.craft_dailyrateaed ?? -1), alert: mapCell(equipment.craft_currentstatus === 2 ? 'Maintenance' : equipment.craft_ownershipstatus === 2 ? 'Rented asset' : 'No alert', equipment.craft_currentstatus === 2 ? 2 : equipment.craft_ownershipstatus === 2 ? 1 : 0, equipment.craft_currentstatus === 2 ? 'amber' : 'neutral') }) })
  const voForProject = new Map<string, number>()
  selectedVariations.forEach((variation) => { const project = projectFor(variation); if (project) voForProject.set(project.id, (voForProject.get(project.id) ?? 0) + (variation.craft_variationordervalueaed ?? 0)) })
  const contractsForProject = new Map<string, Craft_contract1s[]>()
  selectedContracts.forEach((contract) => { const project = projectFor(contract); if (project) contractsForProject.set(project.id, [...(contractsForProject.get(project.id) ?? []), contract]) })
  const budgetRows = projects.map((project) => row(project.id, [project.id], { project: mapCell(project.name), variance: mapCell(percent(project.budgetVariance), project.budgetVariance ?? -1, project.budgetVariance == null ? 'neutral' : project.budgetVariance <= 0 ? 'green' : project.budgetVariance <= 5 ? 'amber' : 'red'), phaseBudget: mapCell(money(phaseBudgets.get(project.id)), phaseBudgets.get(project.id) ?? -1), totalCost: mapCell(money(project.cost), project.cost ?? -1), value: mapCell(money(project.value), project.value ?? -1) }))
  const documentRows = selectedDocuments.map((document) => { const project = projectFor(document); return row(document.craft_projectdocumentid, project ? [project.id] : [], { document: mapCell(document.craft_title || document.craft_documentnumber || document.craft_projectdocumentid), project: mapCell(project?.name || 'Unassigned'), type: mapCell(document.craft_documenttypename || 'Unspecified'), discipline: mapCell(document.craft_disciplinename || 'Unspecified'), status: mapCell(document.craft_statusname || 'Unspecified', document.craft_statusname || '', document.craft_statusname === 'Approved' ? 'green' : document.craft_statusname === 'For Review' ? 'amber' : 'neutral'), revision: mapCell(document.craft_revision || 'Not recorded') }) })
  const ladRows = selectedContracts.filter((contract) => {
    const completionDate = dateValue(contract.craft_completiondate)
    return includesTerm(contract.craft_contractstatusname || '', ['active']) && Number.isFinite(completionDate) && completionDate < today
  }).map((contract) => { const project = projectFor(contract); const lateDays = Math.floor((today - dateValue(contract.craft_completiondate)) / 86400000); const exposure = lateDays * (contract.craft_liquidateddamagesperdayaed ?? 0); return row(contract.craft_contract1id, project ? [project.id] : [], { contract: mapCell(contract.craft_contractid1 || contract.craft_contract1id), project: mapCell(project?.name || 'Unassigned'), completionDate: mapCell(dateLabel(contract.craft_completiondate), dateValue(contract.craft_completiondate)), lateDays: mapCell(integer(lateDays), lateDays, 'red'), rate: mapCell(money(contract.craft_liquidateddamagesperdayaed), contract.craft_liquidateddamagesperdayaed ?? -1), exposure: mapCell(money(exposure), exposure, exposure > 0 ? 'red' : 'amber') }) })
  const decisionRows = projects.filter((project) => project.attention || project.riskScore != null || project.delayed).sort((left, right) => Number(right.delayed) - Number(left.delayed) || (right.riskScore ?? -1) - (left.riskScore ?? -1)).map((project) => { const manager = source.employees.find((employee) => employee.craft_employeeid === project.record.craft_projectmanagerid || employee.craft_employeeid1 === project.record.craft_projectmanagerid); return row(project.id, [project.id], { project: mapCell(project.name), manager: mapCell(manager?.craft_fullname || project.record.craft_projectmanagerid || 'Not assigned'), status: mapCell(project.status, project.status, project.delayed || includesTerm(project.health, ['red']) ? 'red' : project.onHold || includesTerm(project.health, ['amber']) ? 'amber' : 'neutral'), risk: mapCell(project.riskScore == null ? 'Not recorded' : integer(project.riskScore), project.riskScore ?? -1), health: mapCell(project.health, project.health, includesTerm(project.health, ['green']) ? 'green' : includesTerm(project.health, ['amber']) ? 'amber' : includesTerm(project.health, ['red']) ? 'red' : 'neutral'), variance: mapCell(percent(project.budgetVariance), project.budgetVariance ?? -1), progress: mapCell(percent(project.progress), project.progress ?? -1), resource: mapCell(projectEmployee(project)?.craft_fullname || 'Not assigned'), issues: mapCell(integer(selectedReports.filter((report) => belongs(report, project) && report.craft_reportedissues?.trim()).length), selectedReports.filter((report) => belongs(report, project) && report.craft_reportedissues?.trim()).length) }) })
  const recentRows = [...projectTableRows].sort((left, right) => (dateValue(source.projects.find((project) => project.craft_projectid === right.id)?.craft_createdat) || 0) - (dateValue(source.projects.find((project) => project.craft_projectid === left.id)?.craft_createdat) || 0))
  const contractorColumns: CommandColumn[] = [{ key: 'contractor', label: 'Contractor' }, { key: 'specialty', label: 'Specialty' }, { key: 'rating', label: 'Rating' }, { key: 'prequalified', label: 'Prequalified' }, { key: 'packageValue', label: 'Package value', align: 'right' }, { key: 'projects', label: 'Linked projects', align: 'right' }]
  const tables: CommandTable[] = [
    table('new-projects', 'New & Recent Projects', 'Portfolio Health', 'Projects ordered by creation timestamp; this is a recent-record view, not a forecast.', projectTableColumns, recentRows, 'No project records match the current filters.'),
    table('phase-progress', 'Phase Progress', 'Project Performance', 'Project phases with planned/actual dates and progress.', [{ key: 'phase', label: 'Phase' }, { key: 'project', label: 'Project' }, { key: 'status', label: 'Status' }, { key: 'progress', label: 'Progress', align: 'right' }, { key: 'planned', label: 'Planned end' }, { key: 'actual', label: 'Actual end' }, { key: 'budget', label: 'Budget', align: 'right' }], phaseRows, 'No project phases are linked to the selected projects.'),
    table('contractor-recommendations', 'Contractor Recommendations', 'Contractor & Workforce', 'Linked contractor qualification, rating, specialty, and package exposure; no recommendation score or availability field exists.', contractorColumns, contractorRecommendations, 'No contractors are linked to selected project contracts or work packages.'),
    table('budget-health', 'Budget Health', 'Financial Control', 'Project budget variance and cost alongside summed phase budgets. Cross-level comparisons are labeled.', [{ key: 'project', label: 'Project' }, { key: 'variance', label: 'Budget variance', align: 'right' }, { key: 'phaseBudget', label: 'Phase budget sum', align: 'right' }, { key: 'totalCost', label: 'Project total cost', align: 'right' }, { key: 'value', label: 'Contract value', align: 'right' }], budgetRows, 'No projects are available for budget review.'),
    table('cash-flow', 'Cash Flow & Payments', 'Financial Control', 'Payment applications with certified amounts, status, retention, and payment date.', [{ key: 'application', label: 'Application' }, { key: 'project', label: 'Project' }, { key: 'status', label: 'Status' }, { key: 'certified', label: 'Net certified', align: 'right' }, { key: 'retention', label: 'Retention', align: 'right' }, { key: 'date', label: 'Payment date' }], paymentRows, 'No payment applications are linked to the selected projects.'),
    table('retention', 'Retention Money', 'Financial Control', 'Recorded retention value by payment application.', [{ key: 'application', label: 'Application' }, { key: 'project', label: 'Project' }, { key: 'status', label: 'Status' }, { key: 'retention', label: 'Retention', align: 'right' }, { key: 'certified', label: 'Net certified', align: 'right' }], paymentRows.filter((item) => (Number(item.cells.retention.sortValue) || 0) > 0), 'No retention values are recorded for the selected projects.'),
    table('equipment-alerts', 'Equipment Rental Alerts', 'Procurement & Equipment', 'Rented equipment and maintenance status. Rental return dates are not present in the equipment model.', [{ key: 'asset', label: 'Asset' }, { key: 'project', label: 'Project' }, { key: 'type', label: 'Type' }, { key: 'ownership', label: 'Ownership' }, { key: 'status', label: 'Status' }, { key: 'rate', label: 'Daily rate', align: 'right' }, { key: 'alert', label: 'Indicator' }], equipmentRows.filter((item) => item.cells.ownership.display === 'Rented' || item.cells.status.tone === 'amber'), 'No rented or maintenance equipment is linked to selected projects.'),
    table('po-pipeline', 'PO Procurement Pipeline', 'Procurement & Equipment', 'Purchase orders grouped by project, supplier reference, status, and amount.', [{ key: 'order', label: 'Purchase order' }, { key: 'project', label: 'Project' }, { key: 'supplier', label: 'Supplier ID' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount', align: 'right' }, { key: 'delivery', label: 'Delivery date' }], purchaseRows, 'No purchase orders are linked to selected projects.'),
    table('vo-impact', 'VO Impact', 'Financial Control', 'Variation order reason, status, value, and recorded time impact.', [{ key: 'variation', label: 'Variation' }, { key: 'project', label: 'Project' }, { key: 'reason', label: 'Reason' }, { key: 'status', label: 'Status' }, { key: 'value', label: 'Value', align: 'right' }, { key: 'impact', label: 'Time impact' }], variationRows, 'No variation orders are linked to selected projects.'),
    table('lad-risk', 'LAD Risk', 'Risk & Compliance', 'Estimated exposure uses active contract completion dates multiplied by the recorded LAD/day; incurred LAD is not stored.', [{ key: 'contract', label: 'Contract' }, { key: 'project', label: 'Project' }, { key: 'completionDate', label: 'Contract completion' }, { key: 'lateDays', label: 'Days late', align: 'right' }, { key: 'rate', label: 'LAD / day', align: 'right' }, { key: 'exposure', label: 'Estimated exposure', align: 'right' }], ladRows, 'No active contracts past their recorded completion date were found.'),
    table('safety-incidents', 'Safety Incidents', 'Risk & Compliance', 'Safety incidents linked to selected projects.', [{ key: 'incident', label: 'Incident' }, { key: 'project', label: 'Project' }, { key: 'type', label: 'Type' }, { key: 'severity', label: 'Severity' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Incident date' }], safetyRows, 'No safety incidents are linked to selected projects.'),
    table('inspection-defects', 'Inspection Defects', 'Risk & Compliance', 'Inspection result, defect count, and reinspection date.', [{ key: 'inspection', label: 'Inspection' }, { key: 'project', label: 'Project' }, { key: 'type', label: 'Type' }, { key: 'result', label: 'Result' }, { key: 'defects', label: 'Defects', align: 'right' }, { key: 'reinspect', label: 'Reinspection' }], inspectionRows, 'No inspections are linked to selected projects.'),
    table('permit-expiry', 'Permit Expiry', 'Risk & Compliance', 'Permit status and days until recorded expiry.', [{ key: 'permit', label: 'Permit' }, { key: 'project', label: 'Project' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }, { key: 'expiry', label: 'Expiry' }, { key: 'days', label: 'Time to expiry', align: 'right' }], permitRows, 'No permits are linked to selected projects.'),
    table('document-status', 'Document Submission Status', 'Risk & Compliance', 'Project documents by title, type, discipline, review status, and revision.', [{ key: 'document', label: 'Document' }, { key: 'project', label: 'Project' }, { key: 'type', label: 'Type' }, { key: 'discipline', label: 'Discipline' }, { key: 'status', label: 'Status' }, { key: 'revision', label: 'Revision' }], documentRows, 'No project documents are linked to selected projects.'),
    table('executive-matrix', 'Executive Decision Matrix', 'Executive Decision Matrix', 'Projects ranked by delay and recorded risk score with manager, assigned resource, reported issues, health, budget variance, and progress.', [{ key: 'project', label: 'Project' }, { key: 'manager', label: 'Manager' }, { key: 'resource', label: 'Assigned employee' }, { key: 'status', label: 'Status' }, { key: 'risk', label: 'Risk score', align: 'right' }, { key: 'health', label: 'Health' }, { key: 'variance', label: 'Budget variance', align: 'right' }, { key: 'progress', label: 'Progress', align: 'right' }, { key: 'issues', label: 'Site report issues', align: 'right' }], decisionRows, 'No delayed or risk-scored projects require a decision.'),
  ]

  return {
    filters: {
      projects: projectOptions,
      projectTypes: [...new Set(allProjects.map((project) => project.type))].sort(),
      statuses: [...new Set(allProjects.map((project) => project.status))].sort(),
    },
    filteredProjectCount: projects.length,
    sourceProjectCount: source.projects.length,
    metrics,
    charts,
    tables,
  }
}

const countVariationValues = (items: Craft_variationorders[], projectFor: (item: Linked) => ProjectView | undefined) => {
  const groups = new Map<string, { value: number; projectIds: string[] }>()
  items.forEach((item) => {
    const name = item.craft_statusname || 'Unspecified'
    const current = groups.get(name) ?? { value: 0, projectIds: [] }
    current.value += item.craft_variationordervalueaed ?? 0
    const project = projectFor(item)
    if (project) current.projectIds.push(project.id)
    groups.set(name, current)
  })
  return [...groups].map(([name, values]) => ({ name, ...values }))
}

const countEquipmentRates = (equipment: Craft_equipments[], _selectedEquipment: Craft_equipments[], projects: ProjectView[]) => {
  const groups = new Map<string, { value: number; projectIds: string[] }>()
  equipment.forEach((item) => {
    const name = item.craft_equipmenttypename || 'Unspecified'
    const current = groups.get(name) ?? { value: 0, projectIds: [] }
    current.value += item.craft_dailyrateaed ?? 0
    const project = projects.find((candidate) => keysOf(candidate.record).includes(normalize(item.craft_currentproject || '')))
    if (project) current.projectIds.push(project.id)
    groups.set(name, current)
  })
  return [...groups].map(([name, values]) => ({ name, ...values }))
}
