import { useEffect, useMemo, useState } from 'react'
import {
  Craft_clientscraft_clientstatus,
} from './generated/models/Craft_clientsModel'
import { Craft_projectscraft_healthstatus } from './generated/models/Craft_projectsModel'
import type { Craft_clients } from './generated/models/Craft_clientsModel'
import type { Craft_contract1s } from './generated/models/Craft_contract1sModel'
import type { Craft_contractors } from './generated/models/Craft_contractorsModel'
import type { Craft_employees } from './generated/models/Craft_employeesModel'
import type { Craft_permitapprovals } from './generated/models/Craft_permitapprovalsModel'
import type { Craft_projectdocuments } from './generated/models/Craft_projectdocumentsModel'
import type { Craft_projectphases } from './generated/models/Craft_projectphasesModel'
import type { Craft_projects } from './generated/models/Craft_projectsModel'
import type { Craft_safetyincidents } from './generated/models/Craft_safetyincidentsModel'
import type { Craft_variationorders } from './generated/models/Craft_variationordersModel'

type ClientProjectViewProps = {
  clients: Craft_clients[]
  projects: Craft_projects[]
  projectPhases?: Craft_projectphases[]
  onOpenProjects: (clientId?: string) => void
}

const optionLabel = (options: Record<string, string>, value?: number) => value == null ? undefined : options[value]
const clientStatus = (client: Craft_clients) => client.craft_clientstatusname || optionLabel(Craft_clientscraft_clientstatus, client.craft_clientstatus) || 'Unknown'
const healthStatus = (project: Craft_projects) => project.craft_healthstatusname || optionLabel(Craft_projectscraft_healthstatus, project.craft_healthstatus) || 'Unknown'
const money = (value?: number) => value == null ? '-' : `AED ${value.toLocaleString()}`
const date = (value?: string) => value ? new Date(value).toLocaleDateString() : '-'
const clientName = (client?: Craft_clients) => client?.craft_clientname || client?.craft_clientid1 || client?.craft_clientid || 'Unassigned'
const projectClientId = (project: Craft_projects) => project._craft_client_value || project.craft_clientid
const phaseBelongsToProject = (phase: Craft_projectphases, project: Craft_projects) => {
  const phaseProjectIds = [phase.craft_projectidentifier, phase._craft_project_value].filter(Boolean)
  const projectIds = [project.craft_projectid, project.craft_projectid1].filter(Boolean)
  return phaseProjectIds.some((phaseProjectId) => projectIds.includes(phaseProjectId))
}
const permitBelongsToProject = (permit: Craft_permitapprovals, project: Craft_projects) => {
  const permitProjectIds = [permit.craft_projectid, permit._craft_project_value].filter(Boolean)
  const projectIds = [project.craft_projectid, project.craft_projectid1].filter(Boolean)
  return permitProjectIds.some((permitProjectId) => projectIds.includes(permitProjectId))
}
const incidentBelongsToProject = (incident: Craft_safetyincidents, project: Craft_projects) => {
  const incidentProjectIds = [incident.craft_projectid, incident._craft_project_value].filter(Boolean)
  const projectIds = [project.craft_projectid, project.craft_projectid1].filter(Boolean)
  return incidentProjectIds.some((incidentProjectId) => projectIds.includes(incidentProjectId))
}
const variationOrderBelongsToProject = (variationOrder: Craft_variationorders, project: Craft_projects) => {
  const variationProjectIds = [variationOrder.craft_projectid, variationOrder._craft_project_value].filter(Boolean)
  const projectIds = [project.craft_projectid, project.craft_projectid1].filter(Boolean)
  return variationProjectIds.some((variationProjectId) => projectIds.includes(variationProjectId))
}
const projectDocumentBelongsToProject = (projectDocument: Craft_projectdocuments, project: Craft_projects) => {
  const documentProjectIds = [projectDocument.craft_projectid, projectDocument._craft_project_value].filter(Boolean)
  const projectIds = [project.craft_projectid, project.craft_projectid1].filter(Boolean)
  return documentProjectIds.some((documentProjectId) => projectIds.includes(documentProjectId))
}
const contractBelongsToProject = (contract: Craft_contract1s, project: Craft_projects) => {
  const contractProjectIds = [contract.craft_projectid, contract._craft_project_value].filter(Boolean)
  const projectIds = [project.craft_projectid, project.craft_projectid1].filter(Boolean)
  return contractProjectIds.some((contractProjectId) => projectIds.includes(contractProjectId))
}
const contractorBelongsToContract = (contractor: Craft_contractors, contract: Craft_contract1s) => {
  const contractorIds = [contractor.craft_contractorid, contractor.craft_contractorid1].filter(Boolean)
  const contractContractorIds = [contract.craft_contractorid, contract._craft_contractor_value].filter(Boolean)
  return contractContractorIds.some((contractContractorId) => contractorIds.includes(contractContractorId))
}
const employeeBelongsToProject = (project: Craft_projects, employee: Craft_employees) => {
  const projectEmployeeIds = [project._craft_employeerecord_value, project.craft_projectmanagerid].filter(Boolean)
  const employeeIds = [employee.craft_employeeid, employee.craft_employeeid1].filter(Boolean)
  return projectEmployeeIds.some((projectEmployeeId) => employeeIds.includes(projectEmployeeId))
}

export function ClientPage({ clients, projects, onOpenProjects }: ClientProjectViewProps) {
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Craft_clients | null>(null)
  const filteredClients = useMemo(() => {
    const query = search.toLowerCase()
    return clients.filter((client) => [clientName(client), client.craft_clienttype, client.craft_contactperson, client.craft_contactemail, client.craft_clientaddress].some((value) => value?.toLowerCase().includes(query)))
  }, [clients, search])
  const active = clients.filter((client) => clientStatus(client) === 'Active').length
  const revenue = clients.reduce((total, client) => total + (client.craft_lifetimerevenue ?? 0), 0)
  const projectsForClient = selectedClient ? projects.filter((project) => projectClientId(project) === selectedClient.craft_clientid) : []
  const atRisk = clients.filter((client) => clientStatus(client) === 'Not in Contact' || clientStatus(client) === 'Blacklisted').length

  return (
    <div className="entity-view">
      <header className="entity-header">
        <div><p className="eyebrow">Dubai ERP / Relationships</p><h1>Client portfolio</h1><p className="subtitle">Understand client health, value, and the projects connected to each account.</p></div>
        <button className="primary-button" type="button" onClick={() => onOpenProjects()}>View all projects</button>
      </header>
      <section className="metric-grid entity-metrics">
        <article className="metric-card metric-card-primary"><span>Total clients</span><strong>{clients.length}</strong><small>Across the portfolio</small></article>
        <article className="metric-card"><span>Active clients</span><strong>{active}</strong><small className="metric-positive">Currently engaged</small></article>
        <article className="metric-card"><span>Client lifetime value</span><strong>{money(revenue)}</strong><small>Recorded revenue</small></article>
        <article className="metric-card"><span>Needs attention</span><strong>{atRisk}</strong><small className="metric-warning">Not in contact or blacklisted</small></article>
      </section>
      <section className="entity-toolbar"><label className="search-field"><span>Search clients</span><input type="search" placeholder="Search name, contact, email..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="result-count">Showing {filteredClients.length} records</span></section>
      <div className="entity-content-grid">
        <section className="table-panel entity-table-panel">
          {filteredClients.length === 0 ? <p className="table-message">No clients match your search.</p> : <div className="table-scroll"><table><thead><tr><th>Client</th><th>Type</th><th>Contact</th><th>Status</th><th>Projects</th><th>Lifetime value</th></tr></thead><tbody>{filteredClients.map((client) => <tr className={selectedClient?.craft_clientid === client.craft_clientid ? 'selected-row' : ''} key={client.craft_clientid} onClick={() => setSelectedClient(client)}><td className="equipment-name">{clientName(client)}<small>{client.craft_clientid1 || client.craft_clientid}</small></td><td>{client.craft_clienttype || '-'}</td><td><strong>{client.craft_contactperson || 'No contact'}</strong><small>{client.craft_contactemail || 'No email'}</small></td><td><span className={`status status-${clientStatus(client).toLowerCase().replaceAll(' ', '-')}`}>{clientStatus(client)}</span></td><td>{client.craft_activeprojectscount ?? projects.filter((project) => projectClientId(project) === client.craft_clientid).length}</td><td>{money(client.craft_lifetimerevenue)}</td></tr>)}</tbody></table></div>}
        </section>
        <aside className="details-panel entity-details-panel">{selectedClient ? <div className="details-content"><div className="panel-heading"><div><p className="eyebrow">Client details</p><h2>{clientName(selectedClient)}</h2></div><span className={`status status-${clientStatus(selectedClient).toLowerCase().replaceAll(' ', '-')}`}>{clientStatus(selectedClient)}</span></div><dl className="details-list"><div><dt>Client type</dt><dd>{selectedClient.craft_clienttype || '-'}</dd></div><div><dt>Contact person</dt><dd>{selectedClient.craft_contactperson || '-'}</dd></div><div><dt>Email</dt><dd>{selectedClient.craft_contactemail || '-'}</dd></div><div><dt>Phone</dt><dd>{selectedClient.craft_contactphone || '-'}</dd></div><div><dt>Address</dt><dd>{selectedClient.craft_clientaddress || '-'}</dd></div><div><dt>Payment terms</dt><dd>{selectedClient.craft_paymentterms || '-'}</dd></div><div><dt>Credit limit</dt><dd>{money(selectedClient.craft_creditlimitaed)}</dd></div><div><dt>Last activity</dt><dd>{date(selectedClient.craft_lastactivitydate)}</dd></div></dl><div className="related-projects"><div className="related-heading"><h3>Related projects</h3><button className="text-button" type="button" onClick={() => onOpenProjects(selectedClient.craft_clientid)}>Open all</button></div><div className="related-record-list">{projectsForClient.length > 0 ? projectsForClient.map((project) => <button className="related-project" type="button" key={project.craft_projectid} onClick={() => onOpenProjects(selectedClient.craft_clientid)}><span>{project.craft_projectname || project.craft_projectid1 || project.craft_projectid}</span><small>{healthStatus(project)} · {project.craft_location || 'No location'}</small></button>) : <p className="empty-widget">No projects connected to this client.</p>}</div></div></div> : <div className="empty-details"><strong>Select a client</strong><span>Client details and related projects will appear here.</span></div>}</aside>
      </div>
    </div>
  )
}

export function ProjectPhasesPage({ clients, projects, projectPhases, selectedPhaseId, onOpenProject }: { clients: Craft_clients[]; projects: Craft_projects[]; projectPhases: Craft_projectphases[]; selectedPhaseId?: string | null; onOpenProject?: (project: Craft_projects) => void }) {
  const [search, setSearch] = useState('')
  const clientMap = useMemo(() => new Map(clients.map((client) => [client.craft_clientid, client])), [clients])
  const filteredPhases = useMemo(() => {
    const query = search.toLowerCase()
    return projectPhases.filter((phase) => {
      const relatedProject = projects.find((project) =>
        (project.craft_projectid === phase.craft_projectidentifier || project.craft_projectid1 === phase.craft_projectidentifier || project.craft_projectid === phase._craft_project_value || project.craft_projectid1 === phase._craft_project_value)
      )
      const relatedClient = relatedProject ? clientMap.get(projectClientId(relatedProject) ?? '') : undefined
      return [phase.craft_phasename, phase.craft_phaseidentifier, phase.craft_projectphaseid, relatedProject?.craft_projectname, relatedProject?.craft_projectid1, relatedClient ? clientName(relatedClient) : undefined].some((value) => value?.toLowerCase().includes(query))
    })
  }, [clientMap, projectPhases, projects, search])

  const [selectedPhase, setSelectedPhase] = useState<Craft_projectphases | null>(null)

  useEffect(() => {
    if (filteredPhases.length === 0) {
      setSelectedPhase(null)
      return
    }

    if (selectedPhaseId) {
      const matching = filteredPhases.find((phase) => phase.craft_projectphaseid === selectedPhaseId)
      if (matching) {
        setSelectedPhase(matching)
        return
      }
    }

    setSelectedPhase((current) => {
      if (current && filteredPhases.some((phase) => phase.craft_projectphaseid === current.craft_projectphaseid)) {
        return current
      }
      return filteredPhases[0]
    })
  }, [filteredPhases, selectedPhaseId])

  const selectedPhaseProject = selectedPhase ? projects.find((project) => phaseBelongsToProject(selectedPhase, project)) : undefined

  return (
    <div className="entity-view">
      <header className="entity-header">
        <div><p className="eyebrow">Dubai ERP / Delivery</p><h1>Project phases</h1><p className="subtitle">Review phase progress, dates, and project ownership across the portfolio.</p></div>
      </header>

      <section className="entity-toolbar"><label className="search-field"><span>Search phases</span><input type="search" placeholder="Search phase, project, client..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="result-count">Showing {filteredPhases.length} records</span></section>

      <div className="entity-content-grid">
        <section className="table-panel entity-project-table">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>End date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPhases.map((phase) => {
                  const relatedProject = projects.find((project) =>
                    (project.craft_projectid === phase.craft_projectidentifier || project.craft_projectid1 === phase.craft_projectidentifier || project.craft_projectid === phase._craft_project_value || project.craft_projectid1 === phase._craft_project_value)
                  )
                  const relatedClient = relatedProject ? clientMap.get(projectClientId(relatedProject) ?? '') : undefined
                  return (
                    <tr className={selectedPhase?.craft_projectphaseid === phase.craft_projectphaseid ? 'selected-row' : ''} key={phase.craft_projectphaseid} onClick={() => setSelectedPhase(phase)}>
                      <td className="equipment-name">{phase.craft_phasename || phase.craft_phaseidentifier || phase.craft_projectphaseid}<small>{phase.craft_projectphaseid}</small></td>
                      <td>{relatedProject?.craft_projectname || relatedProject?.craft_projectid1 || relatedProject?.craft_projectid || '-'}</td>
                      <td>{relatedClient ? clientName(relatedClient) : 'Unassigned'}</td>
                      <td><span className={`status status-${(phase.craft_phasestatusname || 'in-progress').toLowerCase().replaceAll(' ', '-')}`}>{phase.craft_phasestatusname || 'In progress'}</span></td>
                      <td><div className="completion-cell"><span>{phase.craft_progresspercentage ?? 0}%</span><i><b style={{ width: `${Math.min(phase.craft_progresspercentage ?? 0, 100)}%` }} /></i></div></td>
                      <td>{date(phase.craft_plannedenddate)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="details-panel entity-details-panel">
          {selectedPhase ? (
            <div className="details-content">
              <div className="panel-heading">
                <div><p className="eyebrow">Project phase details</p><h2>{selectedPhase.craft_phasename || selectedPhase.craft_phaseidentifier || selectedPhase.craft_projectphaseid}</h2></div>
                <span className={`status status-${(selectedPhase.craft_phasestatusname || 'in-progress').toLowerCase().replaceAll(' ', '-')}`}>{selectedPhase.craft_phasestatusname || 'In progress'}</span>
              </div>
              <dl className="details-list">
                <div><dt>Phase ID</dt><dd>{selectedPhase.craft_phaseidentifier || selectedPhase.craft_projectphaseid}</dd></div>
                <div><dt>Progress</dt><dd>{selectedPhase.craft_progresspercentage ?? 0}%</dd></div>
                <div><dt>Budget</dt><dd>{money(selectedPhase.craft_budgetaed)}</dd></div>
                <div><dt>Planned start</dt><dd>{date(selectedPhase.craft_plannedstartdate)}</dd></div>
                <div><dt>Planned end</dt><dd>{date(selectedPhase.craft_plannedenddate)}</dd></div>
                <div><dt>Actual start</dt><dd>{date(selectedPhase.craft_actualstartdate)}</dd></div>
                <div><dt>Actual end</dt><dd>{date(selectedPhase.craft_actualenddate)}</dd></div>
                <div><dt>Internal notes</dt><dd>{selectedPhase.craft_internalnotes || '-'}</dd></div>
              </dl>
              <section className="related-record-details">
                <p className="eyebrow">Related project</p>
                {selectedPhaseProject ? (
                  <>
                    <button className="related-project related-project-link" type="button" onClick={() => onOpenProject?.(selectedPhaseProject)}>
                      <span>{selectedPhaseProject.craft_projectname || selectedPhaseProject.craft_projectid1 || selectedPhaseProject.craft_projectid}</span>
                      <small>Open project record</small>
                    </button>
                    <dl className="details-list">
                      <div><dt>Client</dt><dd>{clientName(clients.find((client) => projectClientId(selectedPhaseProject) === client.craft_clientid))}</dd></div>
                      <div><dt>Location</dt><dd>{selectedPhaseProject.craft_location || '-'}</dd></div>
                      <div><dt>Health</dt><dd>{healthStatus(selectedPhaseProject)}</dd></div>
                      <div><dt>Completion</dt><dd>{selectedPhaseProject.craft_completionpercentage ?? 0}%</dd></div>
                    </dl>
                  </>
                ) : <p className="empty-widget">No related project record found.</p>}
              </section>
            </div>
          ) : (
            <div className="empty-details"><strong>Select a project phase</strong><span>Phase details will appear here.</span></div>
          )}
        </aside>
      </div>
    </div>
  )
}

export function PermitApprovalsPage({ clients, projects, permitApprovals, selectedPermitId, onOpenProject }: { clients: Craft_clients[]; projects: Craft_projects[]; permitApprovals: Craft_permitapprovals[]; selectedPermitId?: string | null; onOpenProject?: (project: Craft_projects) => void }) {
  const [search, setSearch] = useState('')
  const filteredPermits = useMemo(() => {
    const query = search.toLowerCase()
    return permitApprovals.filter((permit) => {
      const project = projects.find((candidate) => permitBelongsToProject(permit, candidate))
      return [permit.craft_permitid1, permit.craft_permittypename, permit.craft_statusname, permit.craft_referencenumber, project?.craft_projectname, project?.craft_projectid1]
        .some((value) => value?.toLowerCase().includes(query))
    })
  }, [permitApprovals, projects, search])
  const [selectedPermit, setSelectedPermit] = useState<Craft_permitapprovals | null>(null)

  useEffect(() => {
    if (filteredPermits.length === 0) {
      setSelectedPermit(null)
      return
    }

    const matchingPermit = selectedPermitId
      ? filteredPermits.find((permit) => permit.craft_permitapprovalid === selectedPermitId)
      : undefined
    setSelectedPermit((current) => matchingPermit ?? (current && filteredPermits.some((permit) => permit.craft_permitapprovalid === current.craft_permitapprovalid) ? current : filteredPermits[0]))
  }, [filteredPermits, selectedPermitId])

  const selectedPermitProject = selectedPermit ? projects.find((project) => permitBelongsToProject(selectedPermit, project)) : undefined

  return (
    <div className="entity-view">
      <header className="entity-header">
        <div><p className="eyebrow">Dubai ERP / Compliance</p><h1>Permit Approvals</h1><p className="subtitle">Review permit status, validity, fees, and related project ownership.</p></div>
      </header>
      <section className="entity-toolbar">
        <label className="search-field"><span>Search permits</span><input type="search" placeholder="Search permit, reference, project..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <span className="result-count">Showing {filteredPermits.length} records</span>
      </section>
      <div className="entity-content-grid">
        <section className="table-panel entity-project-table">
          <div className="table-scroll">
            <table>
              <thead><tr><th>Permit</th><th>Type</th><th>Project</th><th>Status</th><th>Expiry date</th></tr></thead>
              <tbody>
                {filteredPermits.map((permit) => {
                  const project = projects.find((candidate) => permitBelongsToProject(permit, candidate))
                  return (
                    <tr className={selectedPermit?.craft_permitapprovalid === permit.craft_permitapprovalid ? 'selected-row' : ''} key={permit.craft_permitapprovalid} onClick={() => setSelectedPermit(permit)}>
                      <td className="equipment-name">{permit.craft_permitid1 || permit.craft_permitapprovalid}<small>{permit.craft_referencenumber || permit.craft_permitapprovalid}</small></td>
                      <td>{permit.craft_permittypename || 'Permit'}</td>
                      <td>{project?.craft_projectname || project?.craft_projectid1 || project?.craft_projectid || '-'}</td>
                      <td><span className={`status status-${(permit.craft_statusname || 'unknown').toLowerCase().replaceAll(' ', '-')}`}>{permit.craft_statusname || 'Unknown'}</span></td>
                      <td>{date(permit.craft_expirydate)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredPermits.length === 0 && <p className="table-message">No permit approvals match your search.</p>}
        </section>
        <aside className="details-panel entity-details-panel">
          {selectedPermit ? (
            <div className="details-content">
              <div className="panel-heading">
                <div><p className="eyebrow">Permit details</p><h2>{selectedPermit.craft_permitid1 || selectedPermit.craft_permittypename || selectedPermit.craft_permitapprovalid}</h2></div>
                <span className={`status status-${(selectedPermit.craft_statusname || 'unknown').toLowerCase().replaceAll(' ', '-')}`}>{selectedPermit.craft_statusname || 'Unknown'}</span>
              </div>
              <dl className="details-list">
                <div><dt>Type</dt><dd>{selectedPermit.craft_permittypename || '-'}</dd></div>
                <div><dt>Reference</dt><dd>{selectedPermit.craft_referencenumber || '-'}</dd></div>
                <div><dt>Application date</dt><dd>{date(selectedPermit.craft_applicationdate)}</dd></div>
                <div><dt>Issue date</dt><dd>{date(selectedPermit.craft_issuedate)}</dd></div>
                <div><dt>Expiry date</dt><dd>{date(selectedPermit.craft_expirydate)}</dd></div>
                <div><dt>Fees</dt><dd>{money(selectedPermit.craft_feesaed)}</dd></div>
                <div><dt>Remarks</dt><dd>{selectedPermit.craft_remarks || '-'}</dd></div>
              </dl>
              <section className="related-record-details">
                <p className="eyebrow">Related project</p>
                {selectedPermitProject ? (
                  <>
                    <button className="related-project related-project-link" type="button" onClick={() => onOpenProject?.(selectedPermitProject)}>
                      <span>{selectedPermitProject.craft_projectname || selectedPermitProject.craft_projectid1 || selectedPermitProject.craft_projectid}</span>
                      <small>Open project record</small>
                    </button>
                    <dl className="details-list">
                      <div><dt>Client</dt><dd>{clientName(clients.find((client) => projectClientId(selectedPermitProject) === client.craft_clientid))}</dd></div>
                      <div><dt>Location</dt><dd>{selectedPermitProject.craft_location || '-'}</dd></div>
                      <div><dt>Health</dt><dd>{healthStatus(selectedPermitProject)}</dd></div>
                      <div><dt>Completion</dt><dd>{selectedPermitProject.craft_completionpercentage ?? 0}%</dd></div>
                    </dl>
                  </>
                ) : <p className="empty-widget">No related project record found.</p>}
              </section>
            </div>
          ) : <div className="empty-details"><strong>Select a permit approval</strong><span>Permit and project details will appear here.</span></div>}
        </aside>
      </div>
    </div>
  )
}

export function SafetyIncidentsPage({ clients, projects, incidents, selectedIncidentId, onOpenProject }: { clients: Craft_clients[]; projects: Craft_projects[]; incidents: Craft_safetyincidents[]; selectedIncidentId?: string | null; onOpenProject?: (project: Craft_projects) => void }) {
  const [search, setSearch] = useState('')
  const filteredIncidents = useMemo(() => {
    const query = search.toLowerCase()
    return incidents.filter((incident) => {
      const project = projects.find((candidate) => incidentBelongsToProject(incident, candidate))
      return [incident.craft_incidentid, incident.craft_incidentdescription, incident.craft_incidenttypename, incident.craft_incidentlocation, incident.craft_incidentstatusname, project?.craft_projectname, project?.craft_projectid1]
        .some((value) => value?.toLowerCase().includes(query))
    })
  }, [incidents, projects, search])
  const [selectedIncident, setSelectedIncident] = useState<Craft_safetyincidents | null>(null)

  useEffect(() => {
    if (filteredIncidents.length === 0) {
      setSelectedIncident(null)
      return
    }

    const matchingIncident = selectedIncidentId
      ? filteredIncidents.find((incident) => incident.craft_safetyincidentid === selectedIncidentId)
      : undefined
    setSelectedIncident((current) => matchingIncident ?? (current && filteredIncidents.some((incident) => incident.craft_safetyincidentid === current.craft_safetyincidentid) ? current : filteredIncidents[0]))
  }, [filteredIncidents, selectedIncidentId])

  const selectedIncidentProject = selectedIncident ? projects.find((project) => incidentBelongsToProject(selectedIncident, project)) : undefined

  return (
    <div className="entity-view">
      <header className="entity-header">
        <div><p className="eyebrow">Dubai ERP / Safety</p><h1>Safety Incidents</h1><p className="subtitle">Review incident severity, response, and project accountability.</p></div>
      </header>
      <section className="entity-toolbar">
        <label className="search-field"><span>Search incidents</span><input type="search" placeholder="Search incident, location, project..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <span className="result-count">Showing {filteredIncidents.length} records</span>
      </section>
      <div className="entity-content-grid">
        <section className="table-panel entity-project-table">
          <div className="table-scroll">
            <table>
              <thead><tr><th>Incident</th><th>Type</th><th>Project</th><th>Severity</th><th>Status</th><th>Incident date</th></tr></thead>
              <tbody>
                {filteredIncidents.map((incident) => {
                  const project = projects.find((candidate) => incidentBelongsToProject(incident, candidate))
                  return (
                    <tr className={selectedIncident?.craft_safetyincidentid === incident.craft_safetyincidentid ? 'selected-row' : ''} key={incident.craft_safetyincidentid} onClick={() => setSelectedIncident(incident)}>
                      <td className="equipment-name">{incident.craft_incidentid || incident.craft_safetyincidentid}<small>{incident.craft_safetyincidentid}</small></td>
                      <td>{incident.craft_incidenttypename || 'Incident'}</td>
                      <td>{project?.craft_projectname || project?.craft_projectid1 || project?.craft_projectid || '-'}</td>
                      <td>{incident.craft_severitylevelname || 'Unknown'}</td>
                      <td>{incident.craft_incidentstatusname || 'Unknown'}</td>
                      <td>{date(incident.craft_incidentdate)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredIncidents.length === 0 && <p className="table-message">No safety incidents match your search.</p>}
        </section>
        <aside className="details-panel entity-details-panel">
          {selectedIncident ? (
            <div className="details-content">
              <div className="panel-heading">
                <div><p className="eyebrow">Safety incident details</p><h2>{selectedIncident.craft_incidentid || selectedIncident.craft_safetyincidentid}</h2></div>
                <span className={`status status-${(selectedIncident.craft_incidentstatusname || 'unknown').toLowerCase().replaceAll(' ', '-')}`}>{selectedIncident.craft_incidentstatusname || 'Unknown'}</span>
              </div>
              <dl className="details-list">
                <div><dt>Type</dt><dd>{selectedIncident.craft_incidenttypename || '-'}</dd></div>
                <div><dt>Severity</dt><dd>{selectedIncident.craft_severitylevelname || '-'}</dd></div>
                <div><dt>Incident date</dt><dd>{date(selectedIncident.craft_incidentdate)}</dd></div>
                <div><dt>Location</dt><dd>{selectedIncident.craft_incidentlocation || '-'}</dd></div>
                <div><dt>Injured persons</dt><dd>{selectedIncident.craft_numberofinjuredpersons ?? 0}</dd></div>
                <div><dt>Lost-time days</dt><dd>{selectedIncident.craft_losttimeinjurydays ?? 0}</dd></div>
                <div><dt>Description</dt><dd>{selectedIncident.craft_incidentdescription || '-'}</dd></div>
                <div><dt>Root cause</dt><dd>{selectedIncident.craft_rootcause || '-'}</dd></div>
                <div><dt>Corrective action</dt><dd>{selectedIncident.craft_correctiveaction || '-'}</dd></div>
                <div><dt>Internal notes</dt><dd>{selectedIncident.craft_internalnotes || '-'}</dd></div>
              </dl>
              <section className="related-record-details">
                <p className="eyebrow">Related project</p>
                {selectedIncidentProject ? (
                  <>
                    <button className="related-project related-project-link" type="button" onClick={() => onOpenProject?.(selectedIncidentProject)}>
                      <span>{selectedIncidentProject.craft_projectname || selectedIncidentProject.craft_projectid1 || selectedIncidentProject.craft_projectid}</span>
                      <small>Open project record</small>
                    </button>
                    <dl className="details-list">
                      <div><dt>Client</dt><dd>{clientName(clients.find((client) => projectClientId(selectedIncidentProject) === client.craft_clientid))}</dd></div>
                      <div><dt>Location</dt><dd>{selectedIncidentProject.craft_location || '-'}</dd></div>
                      <div><dt>Health</dt><dd>{healthStatus(selectedIncidentProject)}</dd></div>
                      <div><dt>Completion</dt><dd>{selectedIncidentProject.craft_completionpercentage ?? 0}%</dd></div>
                    </dl>
                  </>
                ) : <p className="empty-widget">No related project record found.</p>}
              </section>
            </div>
          ) : <div className="empty-details"><strong>Select a safety incident</strong><span>Incident and project details will appear here.</span></div>}
        </aside>
      </div>
    </div>
  )
}

export function VariationOrdersPage({ clients, projects, variationOrders, selectedVariationOrderId, onOpenProject }: { clients: Craft_clients[]; projects: Craft_projects[]; variationOrders: Craft_variationorders[]; selectedVariationOrderId?: string | null; onOpenProject?: (project: Craft_projects) => void }) {
  const [search, setSearch] = useState('')
  const filteredVariationOrders = useMemo(() => {
    const query = search.toLowerCase()
    return variationOrders.filter((variationOrder) => {
      const project = projects.find((candidate) => variationOrderBelongsToProject(variationOrder, candidate))
      return [variationOrder.craft_variationorderid1, variationOrder.craft_variationorderid, variationOrder.craft_variationordernumber?.toString(), variationOrder.craft_reasonname, variationOrder.craft_statusname, variationOrder.craft_description, project?.craft_projectname, project?.craft_projectid1]
        .some((value) => value?.toLowerCase().includes(query))
    })
  }, [projects, search, variationOrders])
  const [selectedVariationOrder, setSelectedVariationOrder] = useState<Craft_variationorders | null>(null)

  useEffect(() => {
    if (filteredVariationOrders.length === 0) {
      setSelectedVariationOrder(null)
      return
    }

    const matchingVariationOrder = selectedVariationOrderId
      ? filteredVariationOrders.find((variationOrder) => variationOrder.craft_variationorderid === selectedVariationOrderId)
      : undefined
    setSelectedVariationOrder((current) => matchingVariationOrder ?? (current && filteredVariationOrders.some((variationOrder) => variationOrder.craft_variationorderid === current.craft_variationorderid) ? current : filteredVariationOrders[0]))
  }, [filteredVariationOrders, selectedVariationOrderId])

  const selectedVariationOrderProject = selectedVariationOrder ? projects.find((project) => variationOrderBelongsToProject(selectedVariationOrder, project)) : undefined

  return (
    <div className="entity-view">
      <header className="entity-header">
        <div><p className="eyebrow">Dubai ERP / Change control</p><h1>Variation Orders</h1><p className="subtitle">Review approved changes, reasons, and cost impact for each project.</p></div>
      </header>
      <section className="entity-toolbar">
        <label className="search-field"><span>Search variation orders</span><input type="search" placeholder="Search VO, reason, project..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <span className="result-count">Showing {filteredVariationOrders.length} records</span>
      </section>
      <div className="entity-content-grid">
        <section className="table-panel entity-project-table">
          <div className="table-scroll">
            <table>
              <thead><tr><th>Variation order</th><th>Reason</th><th>Project</th><th>Status</th><th>Value</th><th>Approved date</th></tr></thead>
              <tbody>
                {filteredVariationOrders.map((variationOrder) => {
                  const project = projects.find((candidate) => variationOrderBelongsToProject(variationOrder, candidate))
                  return (
                    <tr className={selectedVariationOrder?.craft_variationorderid === variationOrder.craft_variationorderid ? 'selected-row' : ''} key={variationOrder.craft_variationorderid} onClick={() => setSelectedVariationOrder(variationOrder)}>
                      <td className="equipment-name">{variationOrder.craft_variationorderid1 || variationOrder.craft_variationordernumber || variationOrder.craft_variationorderid}<small>{variationOrder.craft_variationorderid}</small></td>
                      <td>{variationOrder.craft_reasonname || 'Not recorded'}</td>
                      <td>{project?.craft_projectname || project?.craft_projectid1 || project?.craft_projectid || '-'}</td>
                      <td>{variationOrder.craft_statusname || 'Unknown'}</td>
                      <td>{money(variationOrder.craft_variationordervalueaed)}</td>
                      <td>{date(variationOrder.craft_approveddate)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredVariationOrders.length === 0 && <p className="table-message">No variation orders match your search.</p>}
        </section>
        <aside className="details-panel entity-details-panel">
          {selectedVariationOrder ? (
            <div className="details-content">
              <div className="panel-heading">
                <div><p className="eyebrow">Variation order details</p><h2>{selectedVariationOrder.craft_variationorderid1 || selectedVariationOrder.craft_variationorderid}</h2></div>
                <span className={`status status-${(selectedVariationOrder.craft_statusname || 'unknown').toLowerCase().replaceAll(' ', '-')}`}>{selectedVariationOrder.craft_statusname || 'Unknown'}</span>
              </div>
              <dl className="details-list">
                <div><dt>Reason</dt><dd>{selectedVariationOrder.craft_reasonname || '-'}</dd></div>
                <div><dt>Status</dt><dd>{selectedVariationOrder.craft_statusname || '-'}</dd></div>
                <div><dt>Submitted date</dt><dd>{date(selectedVariationOrder.craft_submitteddate)}</dd></div>
                <div><dt>Approved date</dt><dd>{date(selectedVariationOrder.craft_approveddate)}</dd></div>
                <div><dt>Value</dt><dd>{money(selectedVariationOrder.craft_variationordervalueaed)}</dd></div>
                <div><dt>Time impact</dt><dd>{selectedVariationOrder.craft_timeimpactdays == null ? '-' : `${selectedVariationOrder.craft_timeimpactdays} days`}</dd></div>
                <div><dt>Approved by</dt><dd>{selectedVariationOrder.craft_approvedby || '-'}</dd></div>
                <div><dt>Description</dt><dd>{selectedVariationOrder.craft_description || '-'}</dd></div>
                <div><dt>Internal notes</dt><dd>{selectedVariationOrder.craft_internalnotes || '-'}</dd></div>
              </dl>
              <section className="related-record-details">
                <p className="eyebrow">Related project</p>
                {selectedVariationOrderProject ? (
                  <>
                    <button className="related-project related-project-link" type="button" onClick={() => onOpenProject?.(selectedVariationOrderProject)}>
                      <span>{selectedVariationOrderProject.craft_projectname || selectedVariationOrderProject.craft_projectid1 || selectedVariationOrderProject.craft_projectid}</span>
                      <small>Open project record</small>
                    </button>
                    <dl className="details-list">
                      <div><dt>Client</dt><dd>{clientName(clients.find((client) => projectClientId(selectedVariationOrderProject) === client.craft_clientid))}</dd></div>
                      <div><dt>Location</dt><dd>{selectedVariationOrderProject.craft_location || '-'}</dd></div>
                      <div><dt>Health</dt><dd>{healthStatus(selectedVariationOrderProject)}</dd></div>
                      <div><dt>Completion</dt><dd>{selectedVariationOrderProject.craft_completionpercentage ?? 0}%</dd></div>
                    </dl>
                  </>
                ) : <p className="empty-widget">No related project record found.</p>}
              </section>
            </div>
          ) : <div className="empty-details"><strong>Select a variation order</strong><span>Variation order and project details will appear here.</span></div>}
        </aside>
      </div>
    </div>
  )
}

export function EmployeesPage({ projects, employees, selectedEmployeeId, onOpenProject }: { projects: Craft_projects[]; employees: Craft_employees[]; selectedEmployeeId?: string | null; onOpenProject?: (project: Craft_projects) => void }) {
  const [search, setSearch] = useState('')
  const filteredEmployees = useMemo(() => {
    const query = search.toLowerCase()
    return employees.filter((employee) => {
      const projectCount = projects.filter((project) => employeeBelongsToProject(project, employee)).length
      return [employee.craft_fullname, employee.craft_employeeid1, employee.craft_employeeid, employee.craft_department, employee.craft_designation, employee.craft_emailaddress, employee.craft_employmentstatusname, `${projectCount} project${projectCount === 1 ? '' : 's'}`]
        .some((value) => value?.toLowerCase().includes(query))
    })
  }, [employees, projects, search])
  const [selectedEmployee, setSelectedEmployee] = useState<Craft_employees | null>(null)

  useEffect(() => {
    if (filteredEmployees.length === 0) {
      setSelectedEmployee(null)
      return
    }

    const matchingEmployee = selectedEmployeeId
      ? filteredEmployees.find((employee) => employee.craft_employeeid === selectedEmployeeId)
      : undefined
    setSelectedEmployee((current) => matchingEmployee ?? (current && filteredEmployees.some((employee) => employee.craft_employeeid === current.craft_employeeid) ? current : filteredEmployees[0]))
  }, [filteredEmployees, selectedEmployeeId])

  const relatedProjects = selectedEmployee ? projects.filter((project) => employeeBelongsToProject(project, selectedEmployee)) : []

  return (
    <div className="entity-view">
      <header className="entity-header">
        <div><p className="eyebrow">Dubai ERP / Workforce</p><h1>Employees</h1><p className="subtitle">Review staffing assignments, department details, and linked project ownership.</p></div>
      </header>
      <section className="entity-toolbar">
        <label className="search-field"><span>Search employees</span><input type="search" placeholder="Search name, department, project count..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <span className="result-count">Showing {filteredEmployees.length} records</span>
      </section>
      <div className="entity-content-grid">
        <section className="table-panel entity-project-table">
          <div className="table-scroll">
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Status</th><th>Projects</th><th>Joining date</th></tr></thead>
              <tbody>
                {filteredEmployees.map((employee) => {
                  const projectCount = projects.filter((project) => employeeBelongsToProject(project, employee)).length
                  return (
                    <tr className={selectedEmployee?.craft_employeeid === employee.craft_employeeid ? 'selected-row' : ''} key={employee.craft_employeeid} onClick={() => setSelectedEmployee(employee)}>
                      <td className="equipment-name">{employee.craft_fullname || employee.craft_employeeid1 || employee.craft_employeeid}<small>{employee.craft_employeeid1 || employee.craft_employeeid}</small></td>
                      <td>{employee.craft_department || '-'}</td>
                      <td>{employee.craft_designation || '-'}</td>
                      <td>{employee.craft_employmentstatusname || 'Unknown'}</td>
                      <td>{projectCount}</td>
                      <td>{date(employee.craft_joiningdate)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredEmployees.length === 0 && <p className="table-message">No employees match your search.</p>}
        </section>
        <aside className="details-panel entity-details-panel">
          {selectedEmployee ? (
            <div className="details-content">
              <div className="panel-heading">
                <div><p className="eyebrow">Employee details</p><h2>{selectedEmployee.craft_fullname || selectedEmployee.craft_employeeid1 || selectedEmployee.craft_employeeid}</h2></div>
                <span className={`status status-${(selectedEmployee.craft_employmentstatusname || 'unknown').toLowerCase().replaceAll(' ', '-')}`}>{selectedEmployee.craft_employmentstatusname || 'Unknown'}</span>
              </div>
              <dl className="details-list">
                <div><dt>Employee ID</dt><dd>{selectedEmployee.craft_employeeid1 || selectedEmployee.craft_employeeid}</dd></div>
                <div><dt>Department</dt><dd>{selectedEmployee.craft_department || '-'}</dd></div>
                <div><dt>Designation</dt><dd>{selectedEmployee.craft_designation || '-'}</dd></div>
                <div><dt>Email</dt><dd>{selectedEmployee.craft_emailaddress || '-'}</dd></div>
                <div><dt>Phone</dt><dd>{selectedEmployee.craft_phonenumber || '-'}</dd></div>
                <div><dt>Nationality</dt><dd>{selectedEmployee.craft_nationality || '-'}</dd></div>
                <div><dt>Visa status</dt><dd>{selectedEmployee.craft_visastatus || '-'}</dd></div>
                <div><dt>Joining date</dt><dd>{date(selectedEmployee.craft_joiningdate)}</dd></div>
                <div><dt>Salary</dt><dd>{money(selectedEmployee.craft_salaryaed)}</dd></div>
                <div><dt>Internal notes</dt><dd>{selectedEmployee.craft_internalnotes || '-'}</dd></div>
              </dl>
              <section className="related-record-details">
                <p className="eyebrow">Related projects</p>
                {relatedProjects.length > 0 ? (
                  <>
                    <div className="related-record-list">
                      {relatedProjects.map((project) => (
                        <button className="related-project related-project-link" type="button" key={project.craft_projectid} onClick={() => onOpenProject?.(project)}>
                          <span>{project.craft_projectname || project.craft_projectid1 || project.craft_projectid}</span>
                          <small>{project.craft_location || 'Location unavailable'} · {healthStatus(project)} · {project.craft_completionpercentage ?? 0}% complete</small>
                        </button>
                      ))}
                    </div>
                  </>
                ) : <p className="empty-widget">No related project records found.</p>}
              </section>
            </div>
          ) : <div className="empty-details"><strong>Select an employee</strong><span>Employee and related project details will appear here.</span></div>}
        </aside>
      </div>
    </div>
  )
}

export function ContractorsPage({ projects, contractors, contracts, selectedContractorId, onOpenContract }: { clients: Craft_clients[]; projects: Craft_projects[]; contractors: Craft_contractors[]; contracts: Craft_contract1s[]; selectedContractorId?: string | null; onOpenContract?: (contract: Craft_contract1s) => void; onOpenProject?: (project: Craft_projects) => void }) {
  const [search, setSearch] = useState('')
  const filteredContractors = useMemo(() => {
    const query = search.toLowerCase()
    return contractors.filter((contractor) => {
      const contractCount = contracts.filter((contract) => contractorBelongsToContract(contractor, contract)).length
      return [contractor.craft_companyname, contractor.craft_contractorid1, contractor.craft_contractorid, contractor.craft_specialty, contractor.craft_statusname, contractor.craft_ratingname, `${contractCount} contract${contractCount === 1 ? '' : 's'}`]
        .some((value) => value?.toLowerCase().includes(query))
    })
  }, [contracts, contractors, search])
  const [selectedContractor, setSelectedContractor] = useState<Craft_contractors | null>(null)

  useEffect(() => {
    if (filteredContractors.length === 0) {
      setSelectedContractor(null)
      return
    }

    const matchingContractor = selectedContractorId
      ? filteredContractors.find((contractor) => contractor.craft_contractorid === selectedContractorId)
      : undefined
    setSelectedContractor((current) => matchingContractor ?? (current && filteredContractors.some((contractor) => contractor.craft_contractorid === current.craft_contractorid) ? current : filteredContractors[0]))
  }, [filteredContractors, selectedContractorId])

  const relatedContracts = selectedContractor ? contracts.filter((contract) => contractorBelongsToContract(selectedContractor, contract)) : []

  return (
    <div className="entity-view">
      <header className="entity-header">
        <div><p className="eyebrow">Dubai ERP / Commercial</p><h1>Contractors</h1><p className="subtitle">Review contractor capability, performance, and linked contract coverage.</p></div>
      </header>
      <section className="entity-toolbar">
        <label className="search-field"><span>Search contractors</span><input type="search" placeholder="Search contractor, specialty, contract count..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <span className="result-count">Showing {filteredContractors.length} records</span>
      </section>
      <div className="entity-content-grid">
        <section className="table-panel entity-project-table">
          <div className="table-scroll">
            <table>
              <thead><tr><th>Contractor</th><th>Specialty</th><th>Rating</th><th>Status</th><th>Contracts</th><th>Phone</th></tr></thead>
              <tbody>
                {filteredContractors.map((contractor) => {
                  const contractCount = contracts.filter((contract) => contractorBelongsToContract(contractor, contract)).length
                  return (
                    <tr className={selectedContractor?.craft_contractorid === contractor.craft_contractorid ? 'selected-row' : ''} key={contractor.craft_contractorid} onClick={() => setSelectedContractor(contractor)}>
                      <td className="equipment-name">{contractor.craft_companyname || contractor.craft_contractorid1 || contractor.craft_contractorid}<small>{contractor.craft_contractorid1 || contractor.craft_contractorid}</small></td>
                      <td>{contractor.craft_specialty || '-'}</td>
                      <td>{contractor.craft_ratingname || 'Unknown'}</td>
                      <td>{contractor.craft_statusname || 'Unknown'}</td>
                      <td>{contractCount}</td>
                      <td>{contractor.craft_phonenumber || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredContractors.length === 0 && <p className="table-message">No contractors match your search.</p>}
        </section>
        <aside className="details-panel entity-details-panel">
          {selectedContractor ? (
            <div className="details-content">
              <div className="panel-heading">
                <div><p className="eyebrow">Contractor details</p><h2>{selectedContractor.craft_companyname || selectedContractor.craft_contractorid1 || selectedContractor.craft_contractorid}</h2></div>
                <span className={`status status-${(selectedContractor.craft_statusname || 'unknown').toLowerCase().replaceAll(' ', '-')}`}>{selectedContractor.craft_statusname || 'Unknown'}</span>
              </div>
              <dl className="details-list">
                <div><dt>Contractor ID</dt><dd>{selectedContractor.craft_contractorid1 || selectedContractor.craft_contractorid}</dd></div>
                <div><dt>Specialty</dt><dd>{selectedContractor.craft_specialty || '-'}</dd></div>
                <div><dt>Rating</dt><dd>{selectedContractor.craft_ratingname || '-'}</dd></div>
                <div><dt>Contact person</dt><dd>{selectedContractor.craft_contactperson || '-'}</dd></div>
                <div><dt>Email</dt><dd>{selectedContractor.craft_emailaddress || '-'}</dd></div>
                <div><dt>Phone</dt><dd>{selectedContractor.craft_phonenumber || '-'}</dd></div>
                <div><dt>Address</dt><dd>{selectedContractor.craft_address || '-'}</dd></div>
                <div><dt>Tax registration</dt><dd>{selectedContractor.craft_taxregistrationnumber || '-'}</dd></div>
                <div><dt>Trade license</dt><dd>{selectedContractor.craft_tradelicensenumber || '-'}</dd></div>
                <div><dt>Internal notes</dt><dd>{selectedContractor.craft_internalnotes || '-'}</dd></div>
              </dl>
              <section className="related-record-details">
                <p className="eyebrow">Related contracts</p>
                {relatedContracts.length > 0 ? (
                  <div className="related-record-list">
                    {relatedContracts.map((contract) => {
                      const contractProject = projects.find((project) => contractBelongsToProject(contract, project))
                      return (
                        <button className="related-project related-project-link" type="button" key={contract.craft_contract1id} onClick={() => onOpenContract?.(contract)}>
                          <span>{contract.craft_contractid1 || contract.craft_contract1id}</span>
                          <small>{contractProject?.craft_projectname || contractProject?.craft_projectid1 || 'Unassigned project'} · {contract.craft_contracttypename || 'Contract'} · {money(contract.craft_contractvalueaed)}</small>
                        </button>
                      )
                    })}
                  </div>
                ) : <p className="empty-widget">No related contract records found.</p>}
              </section>
            </div>
          ) : <div className="empty-details"><strong>Select a contractor</strong><span>Contractor and related contract details will appear here.</span></div>}
        </aside>
      </div>
    </div>
  )
}

export function ContractsPage({ clients, projects, contractors, contracts, selectedContractId, onOpenProject, onOpenContractor }: { clients: Craft_clients[]; projects: Craft_projects[]; contractors: Craft_contractors[]; contracts: Craft_contract1s[]; selectedContractId?: string | null; onOpenProject?: (project: Craft_projects) => void; onOpenContractor?: (contractor: Craft_contractors) => void }) {
  const [search, setSearch] = useState('')
  const filteredContracts = useMemo(() => {
    const query = search.toLowerCase()
    return contracts.filter((contract) => {
      const project = projects.find((candidate) => contractBelongsToProject(contract, candidate))
      return [contract.craft_contractid1, contract.craft_contract1id, contract.craft_contracttypename, contract.craft_contractstatusname, contract.craft_contractorid, project?.craft_projectname, project?.craft_projectid1]
        .some((value) => value?.toLowerCase().includes(query))
    })
  }, [contracts, projects, search])
  const [selectedContract, setSelectedContract] = useState<Craft_contract1s | null>(null)

  useEffect(() => {
    if (filteredContracts.length === 0) {
      setSelectedContract(null)
      return
    }

    const matchingContract = selectedContractId
      ? filteredContracts.find((contract) => contract.craft_contract1id === selectedContractId)
      : undefined
    setSelectedContract((current) => matchingContract ?? (current && filteredContracts.some((contract) => contract.craft_contract1id === current.craft_contract1id) ? current : filteredContracts[0]))
  }, [filteredContracts, selectedContractId])

  const selectedContractProject = selectedContract ? projects.find((project) => contractBelongsToProject(selectedContract, project)) : undefined
  const selectedContractors = selectedContract ? contractors.filter((contractor) => contractorBelongsToContract(contractor, selectedContract)) : []

  return (
    <div className="entity-view">
      <header className="entity-header">
        <div><p className="eyebrow">Dubai ERP / Commercial</p><h1>Contracts</h1><p className="subtitle">Review contract status, value, dates, and linked project ownership.</p></div>
      </header>
      <section className="entity-toolbar">
        <label className="search-field"><span>Search contracts</span><input type="search" placeholder="Search contract, project, status..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <span className="result-count">Showing {filteredContracts.length} records</span>
      </section>
      <div className="entity-content-grid">
        <section className="table-panel entity-project-table">
          <div className="table-scroll">
            <table>
              <thead><tr><th>Contract</th><th>Type</th><th>Project</th><th>Status</th><th>Value</th><th>Commencement</th></tr></thead>
              <tbody>
                {filteredContracts.map((contract) => {
                  const project = projects.find((candidate) => contractBelongsToProject(contract, candidate))
                  return (
                    <tr className={selectedContract?.craft_contract1id === contract.craft_contract1id ? 'selected-row' : ''} key={contract.craft_contract1id} onClick={() => setSelectedContract(contract)}>
                      <td className="equipment-name">{contract.craft_contractid1 || contract.craft_contract1id}<small>{contract.craft_contract1id}</small></td>
                      <td>{contract.craft_contracttypename || 'Contract'}</td>
                      <td>{project?.craft_projectname || project?.craft_projectid1 || project?.craft_projectid || '-'}</td>
                      <td>{contract.craft_contractstatusname || 'Unknown'}</td>
                      <td>{money(contract.craft_contractvalueaed)}</td>
                      <td>{date(contract.craft_commencementdate)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredContracts.length === 0 && <p className="table-message">No contracts match your search.</p>}
        </section>
        <aside className="details-panel entity-details-panel">
          {selectedContract ? (
            <div className="details-content">
              <div className="panel-heading">
                <div><p className="eyebrow">Contract details</p><h2>{selectedContract.craft_contractid1 || selectedContract.craft_contract1id}</h2></div>
                <span className={`status status-${(selectedContract.craft_contractstatusname || 'unknown').toLowerCase().replaceAll(' ', '-')}`}>{selectedContract.craft_contractstatusname || 'Unknown'}</span>
              </div>
              <dl className="details-list">
                <div><dt>Contract type</dt><dd>{selectedContract.craft_contracttypename || '-'}</dd></div>
                <div><dt>Contract status</dt><dd>{selectedContract.craft_contractstatusname || '-'}</dd></div>
                <div><dt>Project</dt><dd>{selectedContractProject ? selectedContractProject.craft_projectname || selectedContractProject.craft_projectid1 || selectedContractProject.craft_projectid : '-'}</dd></div>
                <div><dt>Contract value</dt><dd>{money(selectedContract.craft_contractvalueaed)}</dd></div>
                <div><dt>Remaining value</dt><dd>{money(selectedContract.craft_remainingcontractvalue)}</dd></div>
                <div><dt>Commencement date</dt><dd>{date(selectedContract.craft_commencementdate)}</dd></div>
                <div><dt>Completion date</dt><dd>{date(selectedContract.craft_completiondate)}</dd></div>
                <div><dt>Signed date</dt><dd>{date(selectedContract.craft_signeddate)}</dd></div>
                <div><dt>Retention %</dt><dd>{selectedContract.craft_retentionpercentage == null ? '-' : `${selectedContract.craft_retentionpercentage}%`}</dd></div>
                <div><dt>Performance bond %</dt><dd>{selectedContract.craft_performancebondpercentage == null ? '-' : `${selectedContract.craft_performancebondpercentage}%`}</dd></div>
                <div><dt>Liquidated damages / day</dt><dd>{money(selectedContract.craft_liquidateddamagesperdayaed)}</dd></div>
                <div><dt>Internal notes</dt><dd>{selectedContract.craft_internalnotes || '-'}</dd></div>
              </dl>
              <section className="related-record-details">
                <p className="eyebrow">Related project</p>
                {selectedContractProject ? (
                  <>
                    <button className="related-project related-project-link" type="button" onClick={() => onOpenProject?.(selectedContractProject)}>
                      <span>{selectedContractProject.craft_projectname || selectedContractProject.craft_projectid1 || selectedContractProject.craft_projectid}</span>
                      <small>Open project record</small>
                    </button>
                    <dl className="details-list">
                      <div><dt>Client</dt><dd>{clientName(clients.find((client) => projectClientId(selectedContractProject) === client.craft_clientid))}</dd></div>
                      <div><dt>Location</dt><dd>{selectedContractProject.craft_location || '-'}</dd></div>
                      <div><dt>Health</dt><dd>{healthStatus(selectedContractProject)}</dd></div>
                      <div><dt>Completion</dt><dd>{selectedContractProject.craft_completionpercentage ?? 0}%</dd></div>
                    </dl>
                  </>
                ) : <p className="empty-widget">No related project record found.</p>}
              </section>
              <section className="related-record-details">
                <p className="eyebrow">Related contractors</p>
                {selectedContractors.length > 0 ? (
                  <div className="related-record-list">
                    {selectedContractors.map((contractor) => (
                      <button className="related-project related-project-link" type="button" key={contractor.craft_contractorid} onClick={() => onOpenContractor?.(contractor)}>
                        <span>{contractor.craft_companyname || contractor.craft_contractorid1 || contractor.craft_contractorid}</span>
                        <small>{contractor.craft_specialty || 'Specialty unavailable'} · {contractor.craft_contactperson || 'Contact unavailable'} · {contractor.craft_phonenumber || 'Phone unavailable'}</small>
                      </button>
                    ))}
                  </div>
                ) : <p className="empty-widget">No related contractor record found.</p>}
              </section>
            </div>
          ) : <div className="empty-details"><strong>Select a contract</strong><span>Contract and project details will appear here.</span></div>}
        </aside>
      </div>
    </div>
  )
}

export function ProjectDocumentsPage({ clients, projects, projectDocuments, selectedProjectDocumentId, onOpenProject }: { clients: Craft_clients[]; projects: Craft_projects[]; projectDocuments: Craft_projectdocuments[]; selectedProjectDocumentId?: string | null; onOpenProject?: (project: Craft_projects) => void }) {
  const [search, setSearch] = useState('')
  const filteredProjectDocuments = useMemo(() => {
    const query = search.toLowerCase()
    return projectDocuments.filter((projectDocument) => {
      const project = projects.find((candidate) => projectDocumentBelongsToProject(projectDocument, candidate))
      return [projectDocument.craft_projectdocumentid, projectDocument.craft_documentnumber, projectDocument.craft_title, projectDocument.craft_documenttypename, projectDocument.craft_statusname, projectDocument.craft_disciplinename, project?.craft_projectname, project?.craft_projectid1]
        .some((value) => value?.toLowerCase().includes(query))
    })
  }, [projectDocuments, projects, search])
  const [selectedProjectDocument, setSelectedProjectDocument] = useState<Craft_projectdocuments | null>(null)

  useEffect(() => {
    if (filteredProjectDocuments.length === 0) {
      setSelectedProjectDocument(null)
      return
    }

    const matchingProjectDocument = selectedProjectDocumentId
      ? filteredProjectDocuments.find((projectDocument) => projectDocument.craft_projectdocumentid === selectedProjectDocumentId)
      : undefined
    setSelectedProjectDocument((current) => matchingProjectDocument ?? (current && filteredProjectDocuments.some((projectDocument) => projectDocument.craft_projectdocumentid === current.craft_projectdocumentid) ? current : filteredProjectDocuments[0]))
  }, [filteredProjectDocuments, selectedProjectDocumentId])

  const selectedProjectDocumentProject = selectedProjectDocument ? projects.find((project) => projectDocumentBelongsToProject(selectedProjectDocument, project)) : undefined

  return (
    <div className="entity-view">
      <header className="entity-header">
        <div><p className="eyebrow">Dubai ERP / Documentation</p><h1>Project Documents</h1><p className="subtitle">Review document metadata, revision status, and project association.</p></div>
      </header>
      <section className="entity-toolbar">
        <label className="search-field"><span>Search documents</span><input type="search" placeholder="Search title, number, project..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <span className="result-count">Showing {filteredProjectDocuments.length} records</span>
      </section>
      <div className="entity-content-grid">
        <section className="table-panel entity-project-table">
          <div className="table-scroll">
            <table>
              <thead><tr><th>Document</th><th>Type</th><th>Project</th><th>Status</th><th>Revision</th><th>Created</th></tr></thead>
              <tbody>
                {filteredProjectDocuments.map((projectDocument) => {
                  const project = projects.find((candidate) => projectDocumentBelongsToProject(projectDocument, candidate))
                  return (
                    <tr className={selectedProjectDocument?.craft_projectdocumentid === projectDocument.craft_projectdocumentid ? 'selected-row' : ''} key={projectDocument.craft_projectdocumentid} onClick={() => setSelectedProjectDocument(projectDocument)}>
                      <td className="equipment-name">{projectDocument.craft_title || projectDocument.craft_documentnumber || projectDocument.craft_projectdocumentid}<small>{projectDocument.craft_documentnumber || projectDocument.craft_projectdocumentid}</small></td>
                      <td>{projectDocument.craft_documenttypename || 'Document'}</td>
                      <td>{project?.craft_projectname || project?.craft_projectid1 || project?.craft_projectid || '-'}</td>
                      <td>{projectDocument.craft_statusname || 'Unknown'}</td>
                      <td>{projectDocument.craft_revision || '-'}</td>
                      <td>{date(projectDocument.craft_createddate || projectDocument.createdon)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredProjectDocuments.length === 0 && <p className="table-message">No project documents match your search.</p>}
        </section>
        <aside className="details-panel entity-details-panel">
          {selectedProjectDocument ? (
            <div className="details-content">
              <div className="panel-heading">
                <div><p className="eyebrow">Document details</p><h2>{selectedProjectDocument.craft_title || selectedProjectDocument.craft_documentnumber || selectedProjectDocument.craft_projectdocumentid}</h2></div>
                <span className={`status status-${(selectedProjectDocument.craft_statusname || 'unknown').toLowerCase().replaceAll(' ', '-')}`}>{selectedProjectDocument.craft_statusname || 'Unknown'}</span>
              </div>
              <dl className="details-list">
                <div><dt>Type</dt><dd>{selectedProjectDocument.craft_documenttypename || '-'}</dd></div>
                <div><dt>Document number</dt><dd>{selectedProjectDocument.craft_documentnumber || '-'}</dd></div>
                <div><dt>Discipline</dt><dd>{selectedProjectDocument.craft_disciplinename || '-'}</dd></div>
                <div><dt>Revision</dt><dd>{selectedProjectDocument.craft_revision || '-'}</dd></div>
                <div><dt>Created date</dt><dd>{date(selectedProjectDocument.craft_createddate || selectedProjectDocument.createdon)}</dd></div>
                <div><dt>File path</dt><dd>{selectedProjectDocument.craft_filepath || '-'}</dd></div>
                <div><dt>Internal notes</dt><dd>{selectedProjectDocument.craft_internalnotes || '-'}</dd></div>
              </dl>
              <section className="related-record-details">
                <p className="eyebrow">Related project</p>
                {selectedProjectDocumentProject ? (
                  <>
                    <button className="related-project related-project-link" type="button" onClick={() => onOpenProject?.(selectedProjectDocumentProject)}>
                      <span>{selectedProjectDocumentProject.craft_projectname || selectedProjectDocumentProject.craft_projectid1 || selectedProjectDocumentProject.craft_projectid}</span>
                      <small>Open project record</small>
                    </button>
                    <dl className="details-list">
                      <div><dt>Client</dt><dd>{clientName(clients.find((client) => projectClientId(selectedProjectDocumentProject) === client.craft_clientid))}</dd></div>
                      <div><dt>Location</dt><dd>{selectedProjectDocumentProject.craft_location || '-'}</dd></div>
                      <div><dt>Health</dt><dd>{healthStatus(selectedProjectDocumentProject)}</dd></div>
                      <div><dt>Completion</dt><dd>{selectedProjectDocumentProject.craft_completionpercentage ?? 0}%</dd></div>
                    </dl>
                  </>
                ) : <p className="empty-widget">No related project record found.</p>}
              </section>
            </div>
          ) : <div className="empty-details"><strong>Select a project document</strong><span>Document and project details will appear here.</span></div>}
        </aside>
      </div>
    </div>
  )
}

export function ProjectsPage({ clients, projects, projectPhases = [], permitApprovals = [], safetyIncidents = [], variationOrders = [], projectDocuments = [], employees = [], contracts = [], onOpenProjects, onOpenProjectPhase, onOpenPermitApproval, onOpenSafetyIncident, onOpenVariationOrder, onOpenProjectDocument, onOpenEmployee, onOpenContract, selectedClientId = 'All clients', selectedProjectId }: ClientProjectViewProps & { permitApprovals?: Craft_permitapprovals[]; safetyIncidents?: Craft_safetyincidents[]; variationOrders?: Craft_variationorders[]; projectDocuments?: Craft_projectdocuments[]; employees?: Craft_employees[]; contracts?: Craft_contract1s[]; selectedClientId?: string; selectedProjectId?: string | null; onOpenProjectPhase?: (phase: Craft_projectphases) => void; onOpenPermitApproval?: (permit: Craft_permitapprovals) => void; onOpenSafetyIncident?: (incident: Craft_safetyincidents) => void; onOpenVariationOrder?: (variationOrder: Craft_variationorders) => void; onOpenProjectDocument?: (projectDocument: Craft_projectdocuments) => void; onOpenEmployee?: (employee: Craft_employees) => void; onOpenContract?: (contract: Craft_contract1s) => void }) {
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState(selectedClientId)
  const [selectedProject, setSelectedProject] = useState<Craft_projects | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<Craft_projectphases | null>(null)
  useEffect(() => {
    setClientFilter(selectedClientId)
  }, [selectedClientId])

  const clientMap = useMemo(() => new Map(clients.map((client) => [client.craft_clientid, client])), [clients])
  const filteredProjects = useMemo(() => {
    const query = search.toLowerCase()
    return projects.filter((project) => {
      const relatedClient = clientMap.get(projectClientId(project) ?? '')
      return (clientFilter === 'All clients' || projectClientId(project) === clientFilter) && [project.craft_projectname, project.craft_projectid1, project.craft_location, project.craft_projecttype, clientName(relatedClient)].some((value) => value?.toLowerCase().includes(query))
    })
  }, [clientFilter, clientMap, projects, search])

  useEffect(() => {
    if (filteredProjects.length === 0) {
      setSelectedProject(null)
      setSelectedPhase(null)
      return
    }

    setSelectedProject((current) => {
      const requestedProject = selectedProjectId ? filteredProjects.find((project) => project.craft_projectid === selectedProjectId) : undefined
      if (requestedProject) {
        return requestedProject
      }
      if (current && filteredProjects.some((project) => project.craft_projectid === current.craft_projectid)) {
        return current
      }
      return filteredProjects[0]
    })
  }, [filteredProjects, selectedProjectId])

  useEffect(() => {
    if (!selectedProject) {
      setSelectedPhase(null)
      return
    }

    const projectPhaseIds = projectPhases
      .filter((phase) => phaseBelongsToProject(phase, selectedProject))
      .map((phase) => phase.craft_projectphaseid)

    setSelectedPhase((current) => {
      if (current && projectPhaseIds.includes(current.craft_projectphaseid)) {
        return current
      }
      return projectPhaseIds.length > 0 ? projectPhases.find((phase) => phase.craft_projectphaseid === projectPhaseIds[0]) ?? null : null
    })
  }, [projectPhases, selectedProject])

  const green = filteredProjects.filter((project) => healthStatus(project) === 'Green').length
  const contractValue = filteredProjects.reduce((total, project) => total + (project.craft_contractvalueaed ?? 0), 0)
  const averageCompletion = filteredProjects.length ? Math.round(filteredProjects.reduce((total, project) => total + (project.craft_completionpercentage ?? 0), 0) / filteredProjects.length) : 0
  const clientProjects = projects.filter((project) => projectClientId(project))
  const relatedPhases = selectedProject ? projectPhases.filter((phase) => phaseBelongsToProject(phase, selectedProject)) : []
  const relatedPermitApprovals = selectedProject ? permitApprovals.filter((permit) => permitBelongsToProject(permit, selectedProject)) : []
  const relatedSafetyIncidents = selectedProject ? safetyIncidents.filter((incident) => incidentBelongsToProject(incident, selectedProject)) : []
  const relatedVariationOrders = selectedProject ? variationOrders.filter((variationOrder) => variationOrderBelongsToProject(variationOrder, selectedProject)) : []
  const relatedProjectDocuments = selectedProject ? projectDocuments.filter((projectDocument) => projectDocumentBelongsToProject(projectDocument, selectedProject)) : []
  const relatedContracts = selectedProject ? contracts.filter((contract) => contractBelongsToProject(contract, selectedProject)) : []
  const relatedEmployees = selectedProject ? employees.filter((employee) => employeeBelongsToProject(selectedProject, employee)) : []

  return (
    <div className="entity-view">
      <header className="entity-header"><div><p className="eyebrow">Dubai ERP / Delivery</p><h1>Project portfolio</h1><p className="subtitle">Track project health, completion, contract value, and client ownership.</p></div><button className="primary-button" type="button" onClick={() => onOpenProjects()}>Refresh portfolio</button></header>
      <section className="metric-grid entity-metrics"><article className="metric-card metric-card-primary"><span>Total projects</span><strong>{filteredProjects.length}</strong><small>In current view</small></article><article className="metric-card"><span>Green health</span><strong>{green}</strong><small className="metric-positive">On track</small></article><article className="metric-card"><span>Average completion</span><strong>{averageCompletion}%</strong><small>Across selected projects</small></article><article className="metric-card"><span>Contract value</span><strong>{money(contractValue)}</strong><small>{clientProjects.length} client-linked projects</small></article></section>
      <section className="entity-toolbar"><label className="search-field"><span>Search projects</span><input type="search" placeholder="Search project, client, location..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="entity-filter">Client<select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}><option>All clients</option>{clients.map((client) => <option value={client.craft_clientid} key={client.craft_clientid}>{clientName(client)}</option>)}</select></label><span className="result-count">Showing {filteredProjects.length} records</span></section>
      <div className="entity-content-grid">
        <section className="table-panel entity-project-table"><div className="table-scroll"><table><thead><tr><th>Project</th><th>Client</th><th>Location</th><th>Health</th><th>Completion</th><th>Contract value</th><th>End date</th></tr></thead><tbody>{filteredProjects.map((project) => <tr className={selectedProject?.craft_projectid === project.craft_projectid ? 'selected-row' : ''} key={project.craft_projectid} onClick={() => setSelectedProject(project)}><td className="equipment-name">{project.craft_projectname || project.craft_projectid1 || project.craft_projectid}<small>{project.craft_projecttype || 'Project'}</small></td><td>{clientName(clientMap.get(projectClientId(project) ?? ''))}</td><td>{project.craft_location || '-'}</td><td><span className={`status status-${healthStatus(project).toLowerCase()}`}>{healthStatus(project)}</span></td><td><div className="completion-cell"><span>{project.craft_completionpercentage ?? 0}%</span><i><b style={{ width: `${Math.min(project.craft_completionpercentage ?? 0, 100)}%` }} /></i></div></td><td>{money(project.craft_contractvalueaed)}</td><td>{date(project.craft_enddate)}</td></tr>)}</tbody></table></div>{filteredProjects.length === 0 && <p className="table-message">No projects match the selected filters.</p>}</section>
        <aside className="details-panel entity-details-panel">
          {selectedProject ? (
            <div className="details-content">
              <div className="panel-heading">
                <div><p className="eyebrow">Project details</p><h2>{selectedProject.craft_projectname || selectedProject.craft_projectid1 || selectedProject.craft_projectid}</h2></div>
                <span className={`status status-${healthStatus(selectedProject).toLowerCase()}`}>{healthStatus(selectedProject)}</span>
              </div>

              <dl className="details-list">
                <div><dt>Client</dt><dd>{clientName(clientMap.get(projectClientId(selectedProject) ?? ''))}</dd></div>
                <div><dt>Type</dt><dd>{selectedProject.craft_projecttype || '-'}</dd></div>
                <div><dt>Location</dt><dd>{selectedProject.craft_location || '-'}</dd></div>
                <div><dt>Start date</dt><dd>{date(selectedProject.craft_startdate)}</dd></div>
                <div><dt>End date</dt><dd>{date(selectedProject.craft_enddate)}</dd></div>
                <div><dt>Completion</dt><dd>{selectedProject.craft_completionpercentage ?? 0}%</dd></div>
                <div><dt>Contract value</dt><dd>{money(selectedProject.craft_contractvalueaed)}</dd></div>
                <div><dt>Total revenue</dt><dd>{money(selectedProject.craft_totalrevenue)}</dd></div>
                <div><dt>Total cost</dt><dd>{money(selectedProject.craft_totalcost)}</dd></div>
              </dl>

              <div className="related-projects">
                <div className="related-heading">
                  <h3>Employees</h3>
                </div>
                <div className="related-record-list">
                {relatedEmployees.length > 0 ? (
                  relatedEmployees.map((employee) => (
                    <button className="related-project" type="button" key={employee.craft_employeeid} onClick={() => onOpenEmployee?.(employee)}>
                      <span>{employee.craft_fullname || employee.craft_employeeid1 || employee.craft_employeeid}</span>
                      <small>{employee.craft_designation || 'Role unavailable'} · {employee.craft_department || 'Department unavailable'} · {employee.craft_employmentstatusname || 'Status unavailable'}</small>
                    </button>
                  ))
                ) : (
                  <p className="empty-widget">No employees connected to this project.</p>
                )}
                </div>
              </div>

              <div className="related-projects">
                <div className="related-heading">
                  <h3>Contracts</h3>
                </div>
                <div className="related-record-list">
                {relatedContracts.length > 0 ? (
                  relatedContracts.map((contract) => (
                    <button className="related-project" type="button" key={contract.craft_contract1id} onClick={() => onOpenContract?.(contract)}>
                      <span>{contract.craft_contractid1 || contract.craft_contract1id}</span>
                      <small>{contract.craft_contracttypename || 'Contract'} · {contract.craft_contractstatusname || 'Status unavailable'} · {money(contract.craft_contractvalueaed)}</small>
                    </button>
                  ))
                ) : (
                  <p className="empty-widget">No contracts connected to this project.</p>
                )}
                </div>
              </div>

              <div className="related-projects">
                <div className="related-heading">
                  <h3>Project phases</h3>
                </div>
                <div className="related-record-list">
                {relatedPhases.length > 0 ? (
                  relatedPhases.map((phase) => (
                    <button className={`related-project ${selectedPhase?.craft_projectphaseid === phase.craft_projectphaseid ? 'selected-row' : ''}`} type="button" key={phase.craft_projectphaseid} onClick={() => {
                      setSelectedPhase(phase)
                      setSelectedProject(selectedProject)
                      onOpenProjectPhase?.(phase)
                    }}>
                      <span>{phase.craft_phasename || phase.craft_phaseidentifier || phase.craft_projectphaseid}</span>
                      <small>{phase.craft_phasestatusname || 'Phase status'} · {phase.craft_progresspercentage ?? 0}% complete</small>
                    </button>
                  ))
                ) : (
                  <p className="empty-widget">No project phases connected to this project.</p>
                )}
                </div>
              </div>

              <div className="related-projects">
                <div className="related-heading">
                  <h3>Permit Approvals</h3>
                </div>
                <div className="related-record-list">
                {relatedPermitApprovals.length > 0 ? (
                  relatedPermitApprovals.map((permit) => (
                    <button className="related-project" type="button" key={permit.craft_permitapprovalid} onClick={() => onOpenPermitApproval?.(permit)}>
                      <span>{permit.craft_permitid1 || permit.craft_permittypename || permit.craft_permitapprovalid}</span>
                      <small>{permit.craft_permittypename || 'Permit'} · {permit.craft_statusname || 'Status unavailable'} · Expires {date(permit.craft_expirydate)}</small>
                    </button>
                  ))
                ) : (
                  <p className="empty-widget">No permit approvals connected to this project.</p>
                )}
                </div>
              </div>

              <div className="related-projects">
                <div className="related-heading">
                  <h3>Safety Incidents</h3>
                </div>
                <div className="related-record-list">
                {relatedSafetyIncidents.length > 0 ? (
                  relatedSafetyIncidents.map((incident) => (
                    <button className="related-project" type="button" key={incident.craft_safetyincidentid} onClick={() => onOpenSafetyIncident?.(incident)}>
                      <span>{incident.craft_incidentid || incident.craft_safetyincidentid}</span>
                      <small>{incident.craft_incidenttypename || 'Incident'} · {incident.craft_severitylevelname || 'Severity unavailable'} · {incident.craft_incidentstatusname || 'Status unavailable'}</small>
                    </button>
                  ))
                ) : (
                  <p className="empty-widget">No safety incidents connected to this project.</p>
                )}
                </div>
              </div>

              <div className="related-projects">
                <div className="related-heading">
                  <h3>Variation Orders</h3>
                </div>
                <div className="related-record-list">
                {relatedVariationOrders.length > 0 ? (
                  relatedVariationOrders.map((variationOrder) => (
                    <button className="related-project" type="button" key={variationOrder.craft_variationorderid} onClick={() => onOpenVariationOrder?.(variationOrder)}>
                      <span>{variationOrder.craft_variationorderid1 || variationOrder.craft_variationordernumber || variationOrder.craft_variationorderid}</span>
                      <small>{variationOrder.craft_reasonname || 'Reason unavailable'} · {variationOrder.craft_statusname || 'Status unavailable'} · {money(variationOrder.craft_variationordervalueaed)}</small>
                    </button>
                  ))
                ) : (
                  <p className="empty-widget">No variation orders connected to this project.</p>
                )}
                </div>
              </div>

              <div className="related-projects">
                <div className="related-heading">
                  <h3>Project Documents</h3>
                </div>
                <div className="related-record-list">
                {relatedProjectDocuments.length > 0 ? (
                  relatedProjectDocuments.map((projectDocument) => (
                    <button className="related-project" type="button" key={projectDocument.craft_projectdocumentid} onClick={() => onOpenProjectDocument?.(projectDocument)}>
                      <span>{projectDocument.craft_title || projectDocument.craft_documentnumber || projectDocument.craft_projectdocumentid}</span>
                      <small>{projectDocument.craft_documenttypename || 'Document'} · {projectDocument.craft_statusname || 'Status unavailable'} · {projectDocument.craft_revision || 'Revision unavailable'}</small>
                    </button>
                  ))
                ) : (
                  <p className="empty-widget">No project documents connected to this project.</p>
                )}
                </div>
              </div>

            </div>
          ) : (
            <div className="empty-details"><strong>Select a project</strong><span>Project details and related phases will appear here.</span></div>
          )}
        </aside>
      </div>
    </div>
  )
}
