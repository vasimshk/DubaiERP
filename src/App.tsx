import { useEffect, useState } from 'react'
import './App.css'
import { ClientPage, ProjectsPage } from './ClientProjectViews'
import { ExecutiveSummary } from './ExecutiveSummary'
import type { Craft_clients } from './generated/models/Craft_clientsModel'
import type { Craft_contract1s } from './generated/models/Craft_contract1sModel'
import type { Craft_employees } from './generated/models/Craft_employeesModel'
import type { Craft_inspections } from './generated/models/Craft_inspectionsModel'
import type { Craft_paymentapplications } from './generated/models/Craft_paymentapplicationsModel'
import type { Craft_permitapprovals } from './generated/models/Craft_permitapprovalsModel'
import type { Craft_projects } from './generated/models/Craft_projectsModel'
import type { Craft_purchaseorders } from './generated/models/Craft_purchaseordersModel'
import type { Craft_safetyincidents } from './generated/models/Craft_safetyincidentsModel'
import type { Craft_equipments, Craft_equipmentsBase } from './generated/models/Craft_equipmentsModel'
import {
  Craft_equipmentscraft_currentstatus,
  Craft_equipmentscraft_equipmenttype,
  Craft_equipmentscraft_ownershipstatus,
} from './generated/models/Craft_equipmentsModel'
import { Craft_clientsService } from './generated/services/Craft_clientsService'
import { Craft_contract1sService } from './generated/services/Craft_contract1sService'
import { Craft_employeesService } from './generated/services/Craft_employeesService'
import { Craft_equipmentsService } from './generated/services/Craft_equipmentsService'
import { Craft_inspectionsService } from './generated/services/Craft_inspectionsService'
import { Craft_paymentapplicationsService } from './generated/services/Craft_paymentapplicationsService'
import { Craft_permitapprovalsService } from './generated/services/Craft_permitapprovalsService'
import { Craft_projectsService } from './generated/services/Craft_projectsService'
import { Craft_purchaseordersService } from './generated/services/Craft_purchaseordersService'
import { Craft_safetyincidentsService } from './generated/services/Craft_safetyincidentsService'

type ViewMode = 'dashboard' | 'executive' | 'clients' | 'projects' | 'equipment'

type EquipmentDraft = Partial<Omit<Craft_equipmentsBase, 'craft_equipmentid'>> & {
  craft_equipmentid?: string
}

const emptyDraft: EquipmentDraft = {
  craft_model: '',
  craft_serialnumber: '',
  craft_equipmenttype: 1,
  craft_currentstatus: 1,
  craft_ownershipstatus: 0,
  craft_dailyrateaed: 0,
  craft_isactive: true,
  craft_operatorrequired: false,
  craft_internalnotes: '',
  statuscode: 1,
  statecode: 0,
}

const enumOptions = (source: Record<string, string>) =>
  Object.entries(source)
    .filter(([key]) => !Number.isNaN(Number(key)))
    .map(([key, label]) => ({ value: Number(key), label }))

const formatMoney = (value?: number) =>
  value == null ? '—' : new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0,
    }).format(value)

const equipmentTypeOptions = enumOptions(Craft_equipmentscraft_equipmenttype as Record<string, string>)
const statusOptions = enumOptions(Craft_equipmentscraft_currentstatus as Record<string, string>)
const ownershipOptions = enumOptions(Craft_equipmentscraft_ownershipstatus as Record<string, string>)

const loadWithTimeout = async <T,>(request: Promise<{ data?: T[] }>, fallback: T[] = []) => {
  try {
    const result = await Promise.race([
      request,
      new Promise<{ data: T[] }>((resolve) => window.setTimeout(() => resolve({ data: fallback }), 8000)),
    ])
    return result.data ?? fallback
  } catch {
    return fallback
  }
}

function EquipmentPanel() {
  const [records, setRecords] = useState<Craft_equipments[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EquipmentDraft>(emptyDraft)

  const loadEquipment = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await Craft_equipmentsService.getAll({
        top: 100,
        select: [
          'craft_equipmentid',
          'craft_model',
          'craft_serialnumber',
          'craft_equipmenttype',
          'craft_currentstatus',
          'craft_ownershipstatus',
          'craft_dailyrateaed',
          'craft_isactive',
          'craft_operatorrequired',
          'craft_internalnotes',
          'statuscode',
          'statecode',
        ],
      })
      setRecords(result.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load equipment records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEquipment()
  }, [])

  const summary = {
    total: records.length,
    active: records.filter((item) => item.craft_isactive).length,
    leased: records.filter((item) => item.craft_ownershipstatus === 1).length,
    dailyRate: records.reduce((sum, item) => sum + (item.craft_dailyrateaed ?? 0), 0),
  }

  const resetForm = () => {
    setDraft(emptyDraft)
    setEditingId(null)
  }

  const handleFieldChange = <K extends keyof EquipmentDraft>(field: K, value: EquipmentDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleEdit = (record: Craft_equipments) => {
    setEditingId(record.craft_equipmentid)
    setDraft({
      craft_equipmentid: record.craft_equipmentid,
      craft_model: record.craft_model ?? '',
      craft_serialnumber: record.craft_serialnumber ?? '',
      craft_equipmenttype: record.craft_equipmenttype ?? 1,
      craft_currentstatus: record.craft_currentstatus ?? 1,
      craft_ownershipstatus: record.craft_ownershipstatus ?? 0,
      craft_dailyrateaed: record.craft_dailyrateaed ?? 0,
      craft_isactive: record.craft_isactive ?? true,
      craft_operatorrequired: record.craft_operatorrequired ?? false,
      craft_internalnotes: record.craft_internalnotes ?? '',
      statuscode: record.statuscode ?? 1,
      statecode: record.statecode ?? 0,
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const payload: Omit<Craft_equipmentsBase, 'craft_equipmentid'> = {
      craft_model: draft.craft_model ?? '',
      craft_serialnumber: draft.craft_serialnumber ?? '',
      craft_equipmenttype: draft.craft_equipmenttype ?? 1,
      craft_currentstatus: draft.craft_currentstatus ?? 1,
      craft_ownershipstatus: draft.craft_ownershipstatus ?? 0,
      craft_dailyrateaed: draft.craft_dailyrateaed ?? 0,
      craft_isactive: draft.craft_isactive ?? true,
      craft_operatorrequired: draft.craft_operatorrequired ?? false,
      craft_internalnotes: draft.craft_internalnotes ?? '',
      statuscode: draft.statuscode ?? 1,
      statecode: draft.statecode ?? 0,
    }

    try {
      setSaving(true)
      setError('')
      if (editingId) {
        await Craft_equipmentsService.update(editingId, payload)
      } else {
        await Craft_equipmentsService.create(payload)
      }
      resetForm()
      await loadEquipment()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save equipment record.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="equipment-app">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dubai ERP / Equipment</p>
          <h1>Equipment register</h1>
        </div>
        <button className="primary-button" type="button" onClick={resetForm}>New equipment</button>
      </header>

      <section className="summary-grid">
        <div className="summary-card accent">
          <span>Total equipment</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="summary-card">
          <span>Active</span>
          <strong>{summary.active}</strong>
        </div>
        <div className="summary-card">
          <span>Leased</span>
          <strong>{summary.leased}</strong>
        </div>
        <div className="summary-card">
          <span>Daily rate</span>
          <strong>{formatMoney(summary.dailyRate)}</strong>
        </div>
      </section>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Equipment records</h2>
            <span>{records.length} items</span>
          </div>

          {loading ? (
            <p className="state-text">Loading equipment records...</p>
          ) : error ? (
            <p className="state-text error">{error}</p>
          ) : records.length === 0 ? (
            <p className="state-text">No equipment records found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Model</th>
                    <th>Serial</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Daily rate</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((item) => (
                    <tr key={item.craft_equipmentid}>
                      <td>{item.craft_equipmentid}</td>
                      <td>{item.craft_model || '—'}</td>
                      <td>{item.craft_serialnumber || '—'}</td>
                      <td>{item.craft_equipmenttypename || equipmentTypeOptions.find((option) => option.value === item.craft_equipmenttype)?.label || '—'}</td>
                      <td><span className="status-badge">{item.craft_currentstatusname || statusOptions.find((option) => option.value === item.craft_currentstatus)?.label || '—'}</span></td>
                      <td>{formatMoney(item.craft_dailyrateaed)}</td>
                      <td><button className="secondary-button" type="button" onClick={() => handleEdit(item)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="panel form-panel">
          <div className="panel-header">
            <h2>{editingId ? 'Edit equipment' : 'Add equipment'}</h2>
          </div>

          <form onSubmit={handleSubmit} className="equipment-form">
            <label>
              Model
              <input value={draft.craft_model ?? ''} onChange={(event) => handleFieldChange('craft_model', event.target.value)} />
            </label>

            <label>
              Serial number
              <input value={draft.craft_serialnumber ?? ''} onChange={(event) => handleFieldChange('craft_serialnumber', event.target.value)} />
            </label>

            <label>
              Equipment type
              <select value={String(draft.craft_equipmenttype ?? 1)} onChange={(event) => handleFieldChange('craft_equipmenttype', Number(event.target.value) as Craft_equipmentsBase['craft_equipmenttype'])}>
                {equipmentTypeOptions.map((option) => <option key={option.value} value={String(option.value)}>{option.label}</option>)}
              </select>
            </label>

            <label>
              Current status
              <select value={String(draft.craft_currentstatus ?? 1)} onChange={(event) => handleFieldChange('craft_currentstatus', Number(event.target.value) as Craft_equipmentsBase['craft_currentstatus'])}>
                {statusOptions.map((option) => <option key={option.value} value={String(option.value)}>{option.label}</option>)}
              </select>
            </label>

            <label>
              Ownership status
              <select value={String(draft.craft_ownershipstatus ?? 0)} onChange={(event) => handleFieldChange('craft_ownershipstatus', Number(event.target.value) as Craft_equipmentsBase['craft_ownershipstatus'])}>
                {ownershipOptions.map((option) => <option key={option.value} value={String(option.value)}>{option.label}</option>)}
              </select>
            </label>

            <label>
              Daily rate (AED)
              <input type="number" min="0" value={draft.craft_dailyrateaed ?? 0} onChange={(event) => handleFieldChange('craft_dailyrateaed', Number(event.target.value))} />
            </label>

            <label className="checkbox-row">
              <input type="checkbox" checked={draft.craft_isactive ?? true} onChange={(event) => handleFieldChange('craft_isactive', event.target.checked)} />
              Active
            </label>

            <label className="checkbox-row">
              <input type="checkbox" checked={draft.craft_operatorrequired ?? false} onChange={(event) => handleFieldChange('craft_operatorrequired', event.target.checked)} />
              Operator required
            </label>

            <label>
              Internal notes
              <textarea rows={4} value={draft.craft_internalnotes ?? ''} onChange={(event) => handleFieldChange('craft_internalnotes', event.target.value)} />
            </label>

            {error && <p className="form-error">{error}</p>}

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update equipment' : 'Add equipment'}</button>
              <button className="secondary-button" type="button" onClick={resetForm}>Reset</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  )
}

function DashboardView({ clients, projects, contracts, employees }: { clients: Craft_clients[]; projects: Craft_projects[]; contracts: Craft_contract1s[]; employees: Craft_employees[] }) {
  return (
    <div className="dashboard-view">
      <header className="entity-header">
        <div>
          <p className="eyebrow">Dubai ERP</p>
          <h1>Dashboard</h1>
          <p className="subtitle">A quick view of the current portfolio.</p>
        </div>
      </header>
      <section className="metric-grid">
        <article className="metric-card metric-card-primary"><span>Clients</span><strong>{clients.length}</strong><small>Portfolio accounts</small></article>
        <article className="metric-card"><span>Projects</span><strong>{projects.length}</strong><small>Delivery portfolio</small></article>
        <article className="metric-card"><span>Contracts</span><strong>{contracts.length}</strong><small>Active records</small></article>
        <article className="metric-card"><span>Employees</span><strong>{employees.length}</strong><small>Workforce records</small></article>
      </section>
    </div>
  )
}

function App() {
  const [view, setView] = useState<ViewMode>('dashboard')
  const [clients, setClients] = useState<Craft_clients[]>([])
  const [projects, setProjects] = useState<Craft_projects[]>([])
  const [contracts, setContracts] = useState<Craft_contract1s[]>([])
  const [permits, setPermits] = useState<Craft_permitapprovals[]>([])
  const [incidents, setIncidents] = useState<Craft_safetyincidents[]>([])
  const [inspections, setInspections] = useState<Craft_inspections[]>([])
  const [payments, setPayments] = useState<Craft_paymentapplications[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<Craft_purchaseorders[]>([])
  const [employees, setEmployees] = useState<Craft_employees[]>([])
  const [loading, setLoading] = useState(true)
  const [projectClientFilter, setProjectClientFilter] = useState('All clients')

  useEffect(() => {
    const load = async () => {
      setLoading(false)
      const [clients, projects, contracts, permits, incidents, inspections, payments, purchaseOrders, employees] = await Promise.all([
        loadWithTimeout(Craft_clientsService.getAll({ top: 200 })),
        loadWithTimeout(Craft_projectsService.getAll({ top: 200 })),
        loadWithTimeout(Craft_contract1sService.getAll({ top: 200 })),
        loadWithTimeout(Craft_permitapprovalsService.getAll({ top: 200 })),
        loadWithTimeout(Craft_safetyincidentsService.getAll({ top: 200 })),
        loadWithTimeout(Craft_inspectionsService.getAll({ top: 200 })),
        loadWithTimeout(Craft_paymentapplicationsService.getAll({ top: 200 })),
        loadWithTimeout(Craft_purchaseordersService.getAll({ top: 200 })),
        loadWithTimeout(Craft_employeesService.getAll({ top: 200 })),
      ])

      setClients(clients)
      setProjects(projects)
      setContracts(contracts)
      setPermits(permits)
      setIncidents(incidents)
      setInspections(inspections)
      setPayments(payments)
      setPurchaseOrders(purchaseOrders)
      setEmployees(employees)
    }

    void load()
  }, [])

  const openProjects = (clientId?: string) => {
    setProjectClientFilter(clientId ?? 'All clients')
    setView('projects')
  }

  if (loading) {
    return <div className="loading-screen">Loading Dubai ERP dashboard...</div>
  }

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="side-nav-brand">Dubai ERP</div>
        <nav className="side-nav-links" aria-label="Main navigation">
          <button className={view === 'dashboard' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'executive' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('executive')}>Executive summary</button>
          <button className={view === 'clients' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('clients')}>Clients</button>
          <button className={view === 'projects' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('projects')}>Projects</button>
          <button className={view === 'equipment' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('equipment')}>Equipment</button>
        </nav>
      </aside>

      <main className="app-content">
      {view === 'dashboard' ? (
        <DashboardView clients={clients} projects={projects} contracts={contracts} employees={employees} />
      ) : view === 'executive' ? (
        <ExecutiveSummary
          contracts={contracts}
          permits={permits}
          incidents={incidents}
          inspections={inspections}
          payments={payments}
          projects={projects}
          purchaseOrders={purchaseOrders}
          employees={employees}
        />
      ) : view === 'clients' ? (
        <ClientPage clients={clients} projects={projects} onOpenProjects={openProjects} />
      ) : view === 'projects' ? (
        <ProjectsPage clients={clients} projects={projects} onOpenProjects={openProjects} selectedClientId={projectClientFilter} />
      ) : (
        <EquipmentPanel />
      )}
      </main>
    </div>
  )
}

export default App
