import { useState } from 'react'
import type { Craft_contract1s } from './generated/models/Craft_contract1sModel'
import type { Craft_employees } from './generated/models/Craft_employeesModel'
import type { Craft_inspections } from './generated/models/Craft_inspectionsModel'
import type { Craft_paymentapplications } from './generated/models/Craft_paymentapplicationsModel'
import type { Craft_permitapprovals } from './generated/models/Craft_permitapprovalsModel'
import type { Craft_projects } from './generated/models/Craft_projectsModel'
import type { Craft_purchaseorders } from './generated/models/Craft_purchaseordersModel'
import type { Craft_safetyincidents } from './generated/models/Craft_safetyincidentsModel'
import { Craft_contract1scraft_contractstatus } from './generated/models/Craft_contract1sModel'
import { Craft_inspectionscraft_inspectionresult } from './generated/models/Craft_inspectionsModel'
import { Craft_paymentapplicationscraft_status } from './generated/models/Craft_paymentapplicationsModel'
import { Craft_permitapprovalscraft_status } from './generated/models/Craft_permitapprovalsModel'
import { Craft_purchaseorderscraft_status } from './generated/models/Craft_purchaseordersModel'
import { Craft_safetyincidentscraft_incidentstatus } from './generated/models/Craft_safetyincidentsModel'

type ExecutiveSummaryProps = {
  contracts: Craft_contract1s[]
  permits: Craft_permitapprovals[]
  incidents: Craft_safetyincidents[]
  inspections: Craft_inspections[]
  payments: Craft_paymentapplications[]
  projects: Craft_projects[]
  purchaseOrders: Craft_purchaseorders[]
  employees: Craft_employees[]
}

type Severity = 'critical' | 'high' | 'medium'

const label = (options: Record<string, string>, value?: number) => value == null ? undefined : options[value]
const contractStatus = (item: Craft_contract1s) => item.craft_contractstatusname || label(Craft_contract1scraft_contractstatus, item.craft_contractstatus) || 'Unknown'
const permitStatus = (item: Craft_permitapprovals) => item.craft_statusname || label(Craft_permitapprovalscraft_status, item.craft_status) || 'Unknown'
const incidentStatus = (item: Craft_safetyincidents) => item.craft_incidentstatusname || label(Craft_safetyincidentscraft_incidentstatus, item.craft_incidentstatus) || 'Unknown'
const inspectionResult = (item: Craft_inspections) => item.craft_inspectionresultname || label(Craft_inspectionscraft_inspectionresult, item.craft_inspectionresult) || 'Unknown'
const paymentStatus = (item: Craft_paymentapplications) => item.craft_statusname || label(Craft_paymentapplicationscraft_status, item.craft_status) || 'Unknown'
const purchaseOrderStatus = (item: Craft_purchaseorders) => item.craft_statusname || label(Craft_purchaseorderscraft_status, item.craft_status) || 'Unknown'
const money = (value: number) => `AED ${Math.round(value).toLocaleString()}`
const daysFromToday = (date?: string) => date ? Math.ceil((new Date(date).getTime() - Date.now()) / 86400000) : Number.POSITIVE_INFINITY
const isPast = (date?: string) => Boolean(date && new Date(date).getTime() < Date.now())
const formatAsOf = () => new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export function ExecutiveSummary({ contracts, permits, incidents, inspections, payments, projects, purchaseOrders, employees }: ExecutiveSummaryProps) {
  const [activeSeverity, setActiveSeverity] = useState<Severity | 'all'>('all')
  const [selectedChartPoint, setSelectedChartPoint] = useState('')
  const ladExposure = contracts.filter((item) => isPast(item.craft_completiondate) && contractStatus(item) === 'Active').length
  const expiredPermits = permits.filter((item) => permitStatus(item) === 'Expired' || item.craft_isexpired || isPast(item.craft_expirydate)).length
  const openIncidents = incidents.filter((item) => incidentStatus(item) === 'Open').length
  const passedInspections = inspections.filter((item) => inspectionResult(item) === 'Passed').length
  const inspectionPassRate = inspections.length ? Math.round((passedInspections / inspections.length) * 100) : 0
  const retentionHeld = payments.reduce((total, item) => total + (item.craft_retentionamountaed ?? 0), 0)
  const pendingPayments = payments.filter((item) => ['Certified', 'Overdue'].includes(paymentStatus(item))).length
  const delayedProjects = projects.filter((item) => isPast(item.craft_enddate) && (item.craft_completionpercentage ?? 0) < 100).length
  const permitsExpiring = permits.filter((item) => { const days = daysFromToday(item.craft_expirydate); return days >= 0 && days <= 30 && permitStatus(item) !== 'Expired' }).length
  const pendingOrders = purchaseOrders.filter((item) => ['Draft', 'Issued', 'Invoiced'].includes(purchaseOrderStatus(item))).length
  const visaIssues = employees.filter((item) => { const status = (item.craft_visastatus ?? '').toLowerCase(); return status.length > 0 && !['valid', 'active', 'approved', 'clear'].some((safe) => status.includes(safe)) }).length
  const criticalCount = ladExposure + expiredPermits + openIncidents

  const painPoints: Array<{ title: string; severity: Severity; value: string; numericValue: number; impact: string; detail: string }> = [
    { title: 'LAD exposure', severity: 'critical', value: ladExposure.toString(), numericValue: ladExposure, impact: 'Financial risk on contracts past completion date', detail: `${ladExposure} active contracts past completion` },
    { title: 'Expired permits', severity: 'critical', value: expiredPermits.toString(), numericValue: expiredPermits, impact: 'Legal/compliance risk and potential stop-work orders', detail: `${expiredPermits} permits require immediate action` },
    { title: 'Open safety incidents', severity: 'critical', value: openIncidents.toString(), numericValue: openIncidents, impact: 'HSE liability and workforce safety exposure', detail: 'High-severity classification is not present in the current schema' },
    { title: 'Inspection pass rate', severity: 'high', value: `${inspectionPassRate}%`, numericValue: inspectionPassRate, impact: 'Quality control failure and rework costs', detail: `${passedInspections} of ${inspections.length} inspections passed` },
    { title: 'Retention held', severity: 'high', value: money(retentionHeld), numericValue: retentionHeld, impact: 'Cash flow pressure on contractors', detail: 'Total retention amount on payment applications' },
    { title: 'Pending payment applications', severity: 'high', value: pendingPayments.toString(), numericValue: pendingPayments, impact: 'Contractor disputes and delayed progress', detail: 'Certified or overdue applications' },
    { title: 'Delayed projects', severity: 'high', value: delayedProjects.toString(), numericValue: delayedProjects, impact: 'Portfolio schedule risk', detail: 'Past end date and below 100% completion' },
    { title: 'Permits expiring within 30 days', severity: 'medium', value: permitsExpiring.toString(), numericValue: permitsExpiring, impact: 'Imminent compliance deadlines', detail: 'Renewal window is now open' },
    { title: 'Pending purchase orders', severity: 'medium', value: pendingOrders.toString(), numericValue: pendingOrders, impact: 'Supply chain bottleneck', detail: 'Draft, issued, or invoiced orders' },
    { title: 'Employee visa issues', severity: 'medium', value: visaIssues.toString(), numericValue: visaIssues, impact: 'Workforce continuity risk', detail: 'Visa status requires review' },
  ]
  const visiblePainPoints = painPoints.filter((item) => activeSeverity === 'all' || item.severity === activeSeverity)
  const severityCounts = (['critical', 'high', 'medium'] as Severity[]).map((severity) => ({ severity, count: painPoints.filter((item) => item.severity === severity).length }))
  const chartPoints = painPoints.filter((item) => item.numericValue > 0 && item.title !== 'Inspection pass rate').sort((left, right) => right.numericValue - left.numericValue).slice(0, 5)
  const chartMax = Math.max(...chartPoints.map((item) => item.numericValue), 1)
  const healthScores = [
    { label: 'Inspection quality', value: inspectionPassRate, detail: `${passedInspections}/${inspections.length} passed`, color: 'teal' },
    { label: 'Permit readiness', value: permits.length ? Math.round(((permits.length - expiredPermits) / permits.length) * 100) : 0, detail: `${expiredPermits} expired`, color: 'amber' },
    { label: 'Schedule health', value: projects.length ? Math.round(((projects.length - delayedProjects) / projects.length) * 100) : 0, detail: `${delayedProjects} delayed`, color: 'red' },
  ]

  return (
    <div className="executive-view">
      <header className="executive-header">
        <div><p className="eyebrow">Dubai ERP / Executive control room</p><h1>Operational risk summary</h1><p className="subtitle">A focused view of the issues most likely to affect cash flow, compliance, safety, and delivery.</p></div>
        <div className="executive-asof"><span>Report date</span><strong>{formatAsOf()}</strong><small>{criticalCount} critical indicators require attention</small></div>
      </header>
      <section className="executive-hero"><div><span className="hero-label">Immediate attention</span><strong>{criticalCount}</strong><p>critical exposures across contracts, permits, and HSE</p></div><div className="hero-severity"><span><i className="severity-dot dot-critical" />Critical <b>{painPoints.filter((item) => item.severity === 'critical').length}</b></span><span><i className="severity-dot dot-high" />High <b>{painPoints.filter((item) => item.severity === 'high').length}</b></span><span><i className="severity-dot dot-medium" />Medium <b>{painPoints.filter((item) => item.severity === 'medium').length}</b></span></div></section>
      <section className="executive-charts">
        <article className="executive-chart severity-chart">
          <div className="chart-heading"><div><p className="eyebrow">Risk distribution</p><h2>Severity mix</h2></div><span className="chart-caption">{painPoints.length} indicators</span></div>
          <div className="severity-chart-body"><div className="severity-donut" style={{ background: `conic-gradient(#a33a3a 0 ${(severityCounts[0].count / painPoints.length) * 100}%, #f5a623 ${(severityCounts[0].count / painPoints.length) * 100}% ${((severityCounts[0].count + severityCounts[1].count) / painPoints.length) * 100}%, #007f86 ${((severityCounts[0].count + severityCounts[1].count) / painPoints.length) * 100}% 100%)` }}><div><strong>{painPoints.length}</strong><span>risks</span></div></div><div className="severity-legend">{severityCounts.map((item) => <button className={activeSeverity === item.severity ? 'active' : ''} type="button" key={item.severity} onClick={() => setActiveSeverity(activeSeverity === item.severity ? 'all' : item.severity)}><i className={`severity-dot dot-${item.severity}`} /><span>{item.severity}</span><b>{item.count}</b></button>)}<button className={activeSeverity === 'all' ? 'active all-filter' : 'all-filter'} type="button" onClick={() => setActiveSeverity('all')}>Show all</button></div></div>
        </article>
        <article className="executive-chart exposure-chart">
          <div className="chart-heading"><div><p className="eyebrow">Exposure queue</p><h2>Largest operational loads</h2></div><span className="chart-caption">Click a bar to focus</span></div>
          <div className="exposure-bars">{chartPoints.map((item) => <button className={selectedChartPoint === item.title ? 'exposure-bar active' : 'exposure-bar'} type="button" key={item.title} onClick={() => setSelectedChartPoint(selectedChartPoint === item.title ? '' : item.title)}><span>{item.title}</span><i><b style={{ width: `${(item.numericValue / chartMax) * 100}%` }} /></i><strong>{item.value}</strong></button>)}</div>
        </article>
        <article className="executive-chart health-chart">
          <div className="chart-heading"><div><p className="eyebrow">Control health</p><h2>Operational readiness</h2></div><span className="chart-caption">Live score</span></div>
          <div className="health-bars">{healthScores.map((item) => <div className="health-row" key={item.label}><div><span>{item.label}</span><small>{item.detail}</small></div><div className="health-track"><i className={`health-fill health-${item.color}`} style={{ width: `${item.value}%` }} /></div><strong>{item.value}%</strong></div>)}</div>
        </article>
      </section>
      <section className="pain-point-list" aria-label="Operational pain points"><div className="pain-point-head"><span>Operational pain point</span><span>Severity</span><span>Current exposure</span><span>Business impact</span></div>{visiblePainPoints.map((item) => <article className={selectedChartPoint === item.title ? `pain-point-row severity-row-${item.severity} focused` : `pain-point-row severity-row-${item.severity}`} key={item.title} onClick={() => setSelectedChartPoint(item.title)}><div className="pain-title"><i className={`severity-dot dot-${item.severity}`} /><strong>{item.title}</strong><small>{item.detail}</small></div><span className={`severity-pill pill-${item.severity}`}>{item.severity}</span><strong className="pain-value">{item.value}</strong><span className="pain-impact">{item.impact}</span></article>)}</section>
      <section className="executive-footer"><div><strong>Portfolio context</strong><span>{contracts.length} contracts · {permits.length} permits · {projects.length} projects · {employees.length} employees</span></div><div><strong>Priority lens</strong><span>Resolve critical items first, then protect cash flow and delivery milestones.</span></div></section>
    </div>
  )
}
