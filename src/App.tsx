import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { OperationsCommandCenter } from './OperationsCommandCenter'
import { SortableTable } from './SortableTable'
import { ClientPage, ContractorsPage, ContractsPage, DailySiteReportsPage, EmployeesPage, InspectionsPage, PaymentApplicationsPage, PurchaseOrdersPage, SuppliersPage, PermitApprovalsPage, ProjectDocumentsPage, ProjectPhasesPage, ProjectsPage, SafetyIncidentsPage, VariationOrdersPage, WorkPackagesPage } from './ClientProjectViews'
import { ExecutiveSummary } from './ExecutiveSummary'
import type { Craft_clients } from './generated/models/Craft_clientsModel'
import type { Craft_contract1s } from './generated/models/Craft_contract1sModel'
import type { Craft_contractors } from './generated/models/Craft_contractorsModel'
import type { Craft_dailysitereports } from './generated/models/Craft_dailysitereportsModel'
import type { Craft_employees } from './generated/models/Craft_employeesModel'
import type { Craft_inspections } from './generated/models/Craft_inspectionsModel'
import type { Craft_paymentapplications } from './generated/models/Craft_paymentapplicationsModel'
import type { Craft_permitapprovals } from './generated/models/Craft_permitapprovalsModel'
import type { Craft_projectdocuments } from './generated/models/Craft_projectdocumentsModel'
import type { Craft_projectphases } from './generated/models/Craft_projectphasesModel'
import type { Craft_projects } from './generated/models/Craft_projectsModel'
import type { Craft_purchaseorders } from './generated/models/Craft_purchaseordersModel'
import type { Craft_safetyincidents } from './generated/models/Craft_safetyincidentsModel'
import type { Craft_suppliers } from './generated/models/Craft_suppliersModel'
import type { Craft_variationorders } from './generated/models/Craft_variationordersModel'
import type { Craft_workpackages } from './generated/models/Craft_workpackagesModel'
import type { Craft_equipments, Craft_equipmentsBase } from './generated/models/Craft_equipmentsModel'
import type { CommandCenterSource } from './services/operationsCommandCenterService'
import {
  Craft_equipmentscraft_currentstatus,
  Craft_equipmentscraft_equipmenttype,
  Craft_equipmentscraft_ownershipstatus,
} from './generated/models/Craft_equipmentsModel'
import { Craft_clientsService } from './generated/services/Craft_clientsService'
import { Craft_contract1sService } from './generated/services/Craft_contract1sService'
import { Craft_contractorsService } from './generated/services/Craft_contractorsService'
import { Craft_dailysitereportsService } from './generated/services/Craft_dailysitereportsService'
import { Craft_employeesService } from './generated/services/Craft_employeesService'
import { Craft_equipmentsService } from './generated/services/Craft_equipmentsService'
import { Craft_inspectionsService } from './generated/services/Craft_inspectionsService'
import { Craft_paymentapplicationsService } from './generated/services/Craft_paymentapplicationsService'
import { Craft_permitapprovalsService } from './generated/services/Craft_permitapprovalsService'
import { Craft_projectdocumentsService } from './generated/services/Craft_projectdocumentsService'
import { Craft_projectphasesService } from './generated/services/Craft_projectphasesService'
import { Craft_projectsService } from './generated/services/Craft_projectsService'
import { Craft_purchaseordersService } from './generated/services/Craft_purchaseordersService'
import { Craft_safetyincidentsService } from './generated/services/Craft_safetyincidentsService'
import { Craft_suppliersService } from './generated/services/Craft_suppliersService'
import { Craft_variationordersService } from './generated/services/Craft_variationordersService'
import { Craft_workpackagesService } from './generated/services/Craft_workpackagesService'

type ViewMode = 'dashboard' | 'executive' | 'clients' | 'projects' | 'contracts' | 'contractors' | 'daily-site-reports' | 'employees' | 'equipment' | 'inspections' | 'payment-applications' | 'permit-approvals' | 'project-documents' | 'project-phases' | 'purchase-orders' | 'safety-incidents' | 'suppliers' | 'variation-orders' | 'work-packages'

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

const loadWithTimeout = async <T,>(request: Promise<{ data?: T[] }>, fallback: T[] = [], onError?: (error: unknown) => void) => {
  let timeoutId: number | undefined
  try {
    const result = await Promise.race([
      request,
      new Promise<{ data: T[] }>((resolve) => {
        timeoutId = window.setTimeout(() => {
          onError?.(new Error('A data request timed out after 8 seconds.'))
          resolve({ data: fallback })
        }, 8000)
      }),
    ])
    return result.data ?? fallback
  } catch (error) {
    onError?.(error)
    return fallback
  } finally {
    if (timeoutId != null) window.clearTimeout(timeoutId)
  }
}

function EquipmentPanel({ records, loading, onRefresh }: { records: Craft_equipments[]; loading: boolean; onRefresh: () => Promise<void> }) {
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EquipmentDraft>(emptyDraft)

  const loadEquipment = async () => {
    try {
      setRefreshing(true)
      setError('')
      await onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load equipment records.')
    } finally {
      setRefreshing(false)
    }
  }

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
        <div className="equipment-header-actions"><button className="secondary-button" type="button" onClick={() => void loadEquipment()} disabled={refreshing}>{refreshing ? 'Refreshing...' : 'Refresh'}</button><button className="primary-button" type="button" onClick={resetForm}>New equipment</button></div>
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
              <SortableTable>
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
              </SortableTable>
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

function App() {
  const [view, setView] = useState<ViewMode>('dashboard')
  const [navigationCollapsed, setNavigationCollapsed] = useState(false)
  const [theme, setTheme] = useState<'light' | 'gray'>(() => {
    const savedTheme = window.localStorage.getItem('dubai-erp-theme')
    return savedTheme === 'gray' ? 'gray' : 'light'
  })
  const [clients, setClients] = useState<Craft_clients[]>([])
  const [projects, setProjects] = useState<Craft_projects[]>([])
  const [contracts, setContracts] = useState<Craft_contract1s[]>([])
  const [contractors, setContractors] = useState<Craft_contractors[]>([])
  const [dailySiteReports, setDailySiteReports] = useState<Craft_dailysitereports[]>([])
  const [permits, setPermits] = useState<Craft_permitapprovals[]>([])
  const [incidents, setIncidents] = useState<Craft_safetyincidents[]>([])
  const [inspections, setInspections] = useState<Craft_inspections[]>([])
  const [payments, setPayments] = useState<Craft_paymentapplications[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<Craft_purchaseorders[]>([])
  const [employees, setEmployees] = useState<Craft_employees[]>([])
  const [projectDocuments, setProjectDocuments] = useState<Craft_projectdocuments[]>([])
  const [projectPhases, setProjectPhases] = useState<Craft_projectphases[]>([])
  const [suppliers, setSuppliers] = useState<Craft_suppliers[]>([])
  const [variationOrders, setVariationOrders] = useState<Craft_variationorders[]>([])
  const [workPackages, setWorkPackages] = useState<Craft_workpackages[]>([])
  const [equipment, setEquipment] = useState<Craft_equipments[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshingDashboard, setRefreshingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [dashboardLastRefreshed, setDashboardLastRefreshed] = useState<Date | null>(null)
  const [projectClientFilter, setProjectClientFilter] = useState('All clients')
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null)
  const [selectedPermitId, setSelectedPermitId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null)
  const [selectedVariationOrderId, setSelectedVariationOrderId] = useState<string | null>(null)
  const [selectedProjectDocumentId, setSelectedProjectDocumentId] = useState<string | null>(null)
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null)
  const [selectedWorkPackageId, setSelectedWorkPackageId] = useState<string | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null)
  const [selectedPaymentApplicationId, setSelectedPaymentApplicationId] = useState<string | null>(null)
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState<string | null>(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const [selectedDailySiteReportId, setSelectedDailySiteReportId] = useState<string | null>(null)

  useEffect(() => {
    window.localStorage.setItem('dubai-erp-theme', theme)
  }, [theme])

  useEffect(() => {
    const load = async () => {
      setDashboardError(null)
      const reportDashboardError = (error: unknown) => setDashboardError(error instanceof Error ? error.message : 'Unable to load one or more dashboard data sources.')
      try {
      const [clients, projects, contracts, contractors, dailySiteReports, permits, incidents, inspections, payments, purchaseOrders, employees, projectDocuments, projectPhases, suppliers, variationOrders, workPackages, equipment] = await Promise.all([
        loadWithTimeout(Craft_clientsService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_projectsService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_contract1sService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_contractorsService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_dailysitereportsService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_permitapprovalsService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_safetyincidentsService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_inspectionsService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_paymentapplicationsService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_purchaseordersService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_employeesService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_projectdocumentsService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_projectphasesService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_suppliersService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_variationordersService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_workpackagesService.getAll({ top: 200 }), [], reportDashboardError),
        loadWithTimeout(Craft_equipmentsService.getAll({ top: 100, select: ['craft_equipmentid', 'craft_equipmentid1', 'craft_model', 'craft_currentproject', 'craft_currentstatus', 'craft_currentstatusname', 'craft_ownershipstatus', 'craft_ownershipstatusname', 'craft_dailyrateaed', 'craft_equipmenttypename', 'craft_isactive', 'statecode', 'statuscode'] }), [], reportDashboardError),
      ])

      setClients(clients)
      setProjects(projects)
      setContracts(contracts)
      setContractors(contractors)
      setDailySiteReports(dailySiteReports)
      setPermits(permits)
      setIncidents(incidents)
      setInspections(inspections)
      setPayments(payments)
      setPurchaseOrders(purchaseOrders)
      setEmployees(employees)
      setProjectDocuments(projectDocuments)
      setProjectPhases(projectPhases)
      setSuppliers(suppliers)
      setVariationOrders(variationOrders)
      setWorkPackages(workPackages)
      setEquipment(equipment)
      setDashboardLastRefreshed(new Date())
      } catch (error) {
        reportDashboardError(error)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const refreshDashboard = async () => {
    setRefreshingDashboard(true)
    setDashboardError(null)
    const requestRows = async <T,>(request: Promise<{ data?: T[] }>) => {
      let timeoutId: number | undefined
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error('Dashboard refresh timed out after 12 seconds.')), 12000)
      })
      try {
        const result = await Promise.race([request, timeout])
        return result.data ?? []
      } finally {
        if (timeoutId != null) window.clearTimeout(timeoutId)
      }
    }

    try {
      const [projects, contracts, contractors, phases, dailySiteReports, workPackages, payments, purchaseOrders, variationOrders, incidents, inspections, permits, equipment, documents, clients, suppliers, employees] = await Promise.all([
        requestRows(Craft_projectsService.getAll({ top: 200 })),
        requestRows(Craft_contract1sService.getAll({ top: 200 })),
        requestRows(Craft_contractorsService.getAll({ top: 200 })),
        requestRows(Craft_projectphasesService.getAll({ top: 200 })),
        requestRows(Craft_dailysitereportsService.getAll({ top: 200 })),
        requestRows(Craft_workpackagesService.getAll({ top: 200 })),
        requestRows(Craft_paymentapplicationsService.getAll({ top: 200 })),
        requestRows(Craft_purchaseordersService.getAll({ top: 200 })),
        requestRows(Craft_variationordersService.getAll({ top: 200 })),
        requestRows(Craft_safetyincidentsService.getAll({ top: 200 })),
        requestRows(Craft_inspectionsService.getAll({ top: 200 })),
        requestRows(Craft_permitapprovalsService.getAll({ top: 200 })),
        requestRows(Craft_equipmentsService.getAll({ top: 100, select: ['craft_equipmentid', 'craft_equipmentid1', 'craft_model', 'craft_currentproject', 'craft_currentstatus', 'craft_currentstatusname', 'craft_ownershipstatus', 'craft_ownershipstatusname', 'craft_dailyrateaed', 'craft_equipmenttypename', 'craft_isactive', 'statecode', 'statuscode'] })),
        requestRows(Craft_projectdocumentsService.getAll({ top: 200 })),
        requestRows(Craft_clientsService.getAll({ top: 200 })),
        requestRows(Craft_suppliersService.getAll({ top: 200 })),
        requestRows(Craft_employeesService.getAll({ top: 200 })),
      ])
      setProjects(projects)
      setContracts(contracts)
      setContractors(contractors)
      setProjectPhases(phases)
      setDailySiteReports(dailySiteReports)
      setWorkPackages(workPackages)
      setPayments(payments)
      setPurchaseOrders(purchaseOrders)
      setVariationOrders(variationOrders)
      setIncidents(incidents)
      setInspections(inspections)
      setPermits(permits)
      setEquipment(equipment)
      setProjectDocuments(documents)
      setClients(clients)
      setSuppliers(suppliers)
      setEmployees(employees)
      setDashboardLastRefreshed(new Date())
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to refresh dashboard data.')
    } finally {
      setRefreshingDashboard(false)
    }
  }

  const refreshEquipment = async () => {
    const result = await Craft_equipmentsService.getAll({ top: 100, select: ['craft_equipmentid', 'craft_equipmentid1', 'craft_model', 'craft_currentproject', 'craft_currentstatus', 'craft_currentstatusname', 'craft_ownershipstatus', 'craft_ownershipstatusname', 'craft_dailyrateaed', 'craft_equipmenttypename', 'craft_isactive', 'statecode', 'statuscode'] })
    setEquipment(result.data ?? [])
  }

  const dashboardSource = useMemo<CommandCenterSource>(() => ({
    projects,
    contracts,
    contractors,
    workPackages,
    payments,
    variationOrders,
    incidents,
    inspections,
    permits,
    equipment,
    phases: projectPhases,
    purchaseOrders,
    documents: projectDocuments,
    clients,
    dailySiteReports,
    suppliers,
    employees,
  }), [clients, contracts, contractors, dailySiteReports, employees, equipment, incidents, inspections, payments, permits, projectDocuments, projectPhases, projects, purchaseOrders, suppliers, variationOrders, workPackages])

  const openProjects = (clientId?: string) => {
    setProjectClientFilter(clientId ?? 'All clients')
    setSelectedPhaseId(null)
    setView('projects')
  }

  const openProjectPhase = (phase: Craft_projectphases) => {
    setSelectedPhaseId(phase.craft_projectphaseid)
    setView('project-phases')
  }

  const openPermitApproval = (permit: Craft_permitapprovals) => {
    setSelectedPermitId(permit.craft_permitapprovalid)
    setView('permit-approvals')
  }

  const openSafetyIncident = (incident: Craft_safetyincidents) => {
    setSelectedIncidentId(incident.craft_safetyincidentid)
    setView('safety-incidents')
  }

  const openVariationOrder = (variationOrder: Craft_variationorders) => {
    setSelectedVariationOrderId(variationOrder.craft_variationorderid)
    setView('variation-orders')
  }

  const openProjectDocument = (projectDocument: Craft_projectdocuments) => {
    setSelectedProjectDocumentId(projectDocument.craft_projectdocumentid)
    setView('project-documents')
  }

  const openContract = (contract: Craft_contract1s) => {
    setSelectedContractId(contract.craft_contract1id)
    setView('contracts')
  }

  const openContractorContract = (contract: Craft_contract1s) => {
    setSelectedContractId(contract.craft_contract1id)
    setView('contracts')
  }

  const openContractor = (contractor: Craft_contractors) => {
    setSelectedContractorId(contractor.craft_contractorid)
    setView('contractors')
  }

  const openWorkPackage = (workPackage: Craft_workpackages) => {
    setSelectedWorkPackageId(workPackage.craft_workpackageid)
    setView('work-packages')
  }

  const openEmployee = (employee: Craft_employees) => {
    setSelectedEmployeeId(employee.craft_employeeid)
    setView('employees')
  }

  const openInspection = (inspection: Craft_inspections) => {
    setSelectedInspectionId(inspection.craft_inspectionid)
    setView('inspections')
  }

  const openPaymentApplication = (paymentApplication: Craft_paymentapplications) => {
    setSelectedPaymentApplicationId(paymentApplication.craft_paymentapplicationid)
    setView('payment-applications')
  }

  const openPurchaseOrder = (purchaseOrder: Craft_purchaseorders) => {
    setSelectedPurchaseOrderId(purchaseOrder.craft_purchaseorderid)
    setView('purchase-orders')
  }

  const openSupplier = (supplier: Craft_suppliers) => {
    setSelectedSupplierId(supplier.craft_supplierid)
    setView('suppliers')
  }

  const openDailySiteReport = (report: Craft_dailysitereports) => {
    setSelectedDailySiteReportId(report.craft_dailysitereportid)
    setView('daily-site-reports')
  }

  const openProject = (project: Craft_projects) => {
    setProjectClientFilter('All clients')
    setSelectedProjectId(project.craft_projectid)
    setView('projects')
  }

  if (loading) {
    return <div className="loading-screen">Loading Dubai ERP dashboard...</div>
  }

  return (
    <div className="app-shell" data-theme={theme} data-navigation-collapsed={navigationCollapsed}>
      <button
        className="navigation-toggle"
        type="button"
        aria-label={navigationCollapsed ? 'Show navigation menu' : 'Hide navigation menu'}
        aria-expanded={!navigationCollapsed}
        aria-controls="main-navigation"
        title={navigationCollapsed ? 'Show navigation' : 'Hide navigation'}
        onClick={() => setNavigationCollapsed((collapsed) => !collapsed)}
      >
        <span aria-hidden="true"><i /><i /><i /></span>
      </button>
      <aside className="side-nav">
        <div className="side-nav-brand">Dubai ERP</div>
        <nav className="side-nav-links" id="main-navigation" aria-label="Main navigation">
          <button className={view === 'dashboard' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'executive' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('executive')}>Executive summary</button>
          <button className={view === 'clients' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('clients')}>Clients</button>
          <button className={view === 'projects' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('projects')}>Projects</button>
          <button className={view === 'contracts' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('contracts')}>Contracts</button>
          <button className={view === 'contractors' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('contractors')}>Contractors</button>
          <button className={view === 'daily-site-reports' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('daily-site-reports')}>Daily Site Reports</button>
          <button className={view === 'employees' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('employees')}>Employees</button>
          <button className={view === 'inspections' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('inspections')}>Inspections</button>
          <button className={view === 'payment-applications' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('payment-applications')}>Payment Applications</button>
          <button className={view === 'permit-approvals' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('permit-approvals')}>Permit Approvals</button>
          <button className={view === 'project-documents' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('project-documents')}>Project Documents</button>
          <button className={view === 'project-phases' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('project-phases')}>Project Phases</button>
          <button className={view === 'purchase-orders' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('purchase-orders')}>Purchase Orders</button>
          <button className={view === 'safety-incidents' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('safety-incidents')}>Safety Incidents</button>
          <button className={view === 'suppliers' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('suppliers')}>Suppliers</button>
          <button className={view === 'variation-orders' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('variation-orders')}>Variation Orders</button>
          <button className={view === 'work-packages' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('work-packages')}>Work Packages</button>
          <button className={view === 'equipment' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setView('equipment')}>Equipment</button>
        </nav>
      </aside>

      <main className="app-content">
      {view === 'dashboard' ? (
        <OperationsCommandCenter source={dashboardSource} loading={loading} refreshing={refreshingDashboard} error={dashboardError} lastRefreshed={dashboardLastRefreshed} onRefresh={() => void refreshDashboard()} theme={theme} onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'light' ? 'gray' : 'light')} />
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
        <ProjectsPage clients={clients} projects={projects} projectPhases={projectPhases} permitApprovals={permits} safetyIncidents={incidents} variationOrders={variationOrders} projectDocuments={projectDocuments} employees={employees} contracts={contracts} workPackages={workPackages} inspections={inspections} paymentApplications={payments} purchaseOrders={purchaseOrders} dailySiteReports={dailySiteReports} onOpenProjects={openProjects} onOpenProjectPhase={openProjectPhase} onOpenPermitApproval={openPermitApproval} onOpenSafetyIncident={openSafetyIncident} onOpenVariationOrder={openVariationOrder} onOpenProjectDocument={openProjectDocument} onOpenEmployee={openEmployee} onOpenContract={openContract} onOpenWorkPackage={openWorkPackage} onOpenInspection={openInspection} onOpenPaymentApplication={openPaymentApplication} onOpenPurchaseOrder={openPurchaseOrder} onOpenDailySiteReport={openDailySiteReport} selectedClientId={projectClientFilter} selectedProjectId={selectedProjectId} />
      ) : view === 'project-phases' ? (
        <ProjectPhasesPage clients={clients} projects={projects} projectPhases={projectPhases} selectedPhaseId={selectedPhaseId} onOpenProject={openProject} />
      ) : view === 'contracts' ? (
        <ContractsPage clients={clients} projects={projects} contractors={contractors} contracts={contracts} paymentApplications={payments} selectedContractId={selectedContractId} onOpenProject={openProject} onOpenContractor={openContractor} onOpenPaymentApplication={openPaymentApplication} />
      ) : view === 'contractors' ? (
        <ContractorsPage clients={clients} projects={projects} contractors={contractors} contracts={contracts} selectedContractorId={selectedContractorId} onOpenContract={openContractorContract} onOpenProject={openProject} />
      ) : view === 'daily-site-reports' ? (
        <DailySiteReportsPage projects={projects} employees={employees} reports={dailySiteReports} selectedReportId={selectedDailySiteReportId} onOpenProject={openProject} onOpenEmployee={openEmployee} />
      ) : view === 'employees' ? (
        <EmployeesPage projects={projects} employees={employees} inspections={inspections} dailySiteReports={dailySiteReports} selectedEmployeeId={selectedEmployeeId} onOpenProject={openProject} onOpenInspection={openInspection} onOpenDailySiteReport={openDailySiteReport} />
      ) : view === 'inspections' ? (
        <InspectionsPage projects={projects} employees={employees} inspections={inspections} selectedInspectionId={selectedInspectionId} onOpenProject={openProject} onOpenEmployee={openEmployee} />
      ) : view === 'payment-applications' ? (
        <PaymentApplicationsPage projects={projects} contracts={contracts} paymentApplications={payments} selectedPaymentApplicationId={selectedPaymentApplicationId} onOpenProject={openProject} onOpenContract={openContract} />
      ) : view === 'permit-approvals' ? (
        <PermitApprovalsPage clients={clients} projects={projects} permitApprovals={permits} selectedPermitId={selectedPermitId} onOpenProject={openProject} />
      ) : view === 'project-documents' ? (
        <ProjectDocumentsPage clients={clients} projects={projects} projectDocuments={projectDocuments} selectedProjectDocumentId={selectedProjectDocumentId} onOpenProject={openProject} />
      ) : view === 'purchase-orders' ? (
        <PurchaseOrdersPage projects={projects} suppliers={suppliers} purchaseOrders={purchaseOrders} selectedPurchaseOrderId={selectedPurchaseOrderId} onOpenProject={openProject} onOpenSupplier={openSupplier} />
      ) : view === 'safety-incidents' ? (
        <SafetyIncidentsPage clients={clients} projects={projects} incidents={incidents} selectedIncidentId={selectedIncidentId} onOpenProject={openProject} />
      ) : view === 'variation-orders' ? (
        <VariationOrdersPage clients={clients} projects={projects} variationOrders={variationOrders} selectedVariationOrderId={selectedVariationOrderId} onOpenProject={openProject} />
      ) : view === 'suppliers' ? (
        <SuppliersPage suppliers={suppliers} purchaseOrders={purchaseOrders} selectedSupplierId={selectedSupplierId} onOpenPurchaseOrder={openPurchaseOrder} />
      ) : view === 'work-packages' ? (
        <WorkPackagesPage projects={projects} projectPhases={projectPhases} contractors={contractors} workPackages={workPackages} selectedWorkPackageId={selectedWorkPackageId} onOpenProject={openProject} onOpenPhase={openProjectPhase} onOpenContractor={openContractor} />
      ) : (
        <EquipmentPanel records={equipment} loading={loading} onRefresh={refreshEquipment} />
      )}
      </main>
    </div>
  )
}

export default App
