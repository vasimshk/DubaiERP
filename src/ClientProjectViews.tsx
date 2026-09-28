import { useEffect, useMemo, useState } from 'react'
import {
  Craft_clientscraft_clientstatus,
} from './generated/models/Craft_clientsModel'
import { Craft_projectscraft_healthstatus } from './generated/models/Craft_projectsModel'
import type { Craft_clients } from './generated/models/Craft_clientsModel'
import type { Craft_projects } from './generated/models/Craft_projectsModel'

type ClientProjectViewProps = {
  clients: Craft_clients[]
  projects: Craft_projects[]
  onOpenProjects: (clientId?: string) => void
}

const optionLabel = (options: Record<string, string>, value?: number) => value == null ? undefined : options[value]
const clientStatus = (client: Craft_clients) => client.craft_clientstatusname || optionLabel(Craft_clientscraft_clientstatus, client.craft_clientstatus) || 'Unknown'
const healthStatus = (project: Craft_projects) => project.craft_healthstatusname || optionLabel(Craft_projectscraft_healthstatus, project.craft_healthstatus) || 'Unknown'
const money = (value?: number) => value == null ? '-' : `AED ${value.toLocaleString()}`
const date = (value?: string) => value ? new Date(value).toLocaleDateString() : '-'
const clientName = (client?: Craft_clients) => client?.craft_clientname || client?.craft_clientid1 || client?.craft_clientid || 'Unassigned'
const projectClientId = (project: Craft_projects) => project._craft_client_value || project.craft_clientid

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
        <aside className="details-panel entity-details-panel">{selectedClient ? <div className="details-content"><div className="panel-heading"><div><p className="eyebrow">Client details</p><h2>{clientName(selectedClient)}</h2></div><span className={`status status-${clientStatus(selectedClient).toLowerCase().replaceAll(' ', '-')}`}>{clientStatus(selectedClient)}</span></div><dl className="details-list"><div><dt>Client type</dt><dd>{selectedClient.craft_clienttype || '-'}</dd></div><div><dt>Contact person</dt><dd>{selectedClient.craft_contactperson || '-'}</dd></div><div><dt>Email</dt><dd>{selectedClient.craft_contactemail || '-'}</dd></div><div><dt>Phone</dt><dd>{selectedClient.craft_contactphone || '-'}</dd></div><div><dt>Address</dt><dd>{selectedClient.craft_clientaddress || '-'}</dd></div><div><dt>Payment terms</dt><dd>{selectedClient.craft_paymentterms || '-'}</dd></div><div><dt>Credit limit</dt><dd>{money(selectedClient.craft_creditlimitaed)}</dd></div><div><dt>Last activity</dt><dd>{date(selectedClient.craft_lastactivitydate)}</dd></div></dl><div className="related-projects"><div className="related-heading"><h3>Related projects</h3><button className="text-button" type="button" onClick={() => onOpenProjects(selectedClient.craft_clientid)}>Open all</button></div>{projectsForClient.length > 0 ? projectsForClient.slice(0, 4).map((project) => <button className="related-project" type="button" key={project.craft_projectid} onClick={() => onOpenProjects(selectedClient.craft_clientid)}><span>{project.craft_projectname || project.craft_projectid1 || project.craft_projectid}</span><small>{healthStatus(project)} · {project.craft_location || 'No location'}</small></button>) : <p className="empty-widget">No projects connected to this client.</p>}</div></div> : <div className="empty-details"><strong>Select a client</strong><span>Client details and related projects will appear here.</span></div>}</aside>
      </div>
    </div>
  )
}

export function ProjectsPage({ clients, projects, onOpenProjects, selectedClientId = 'All clients' }: ClientProjectViewProps & { selectedClientId?: string }) {
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState(selectedClientId)
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
  const green = filteredProjects.filter((project) => healthStatus(project) === 'Green').length
  const contractValue = filteredProjects.reduce((total, project) => total + (project.craft_contractvalueaed ?? 0), 0)
  const averageCompletion = filteredProjects.length ? Math.round(filteredProjects.reduce((total, project) => total + (project.craft_completionpercentage ?? 0), 0) / filteredProjects.length) : 0
  const clientProjects = projects.filter((project) => projectClientId(project))

  return (
    <div className="entity-view">
      <header className="entity-header"><div><p className="eyebrow">Dubai ERP / Delivery</p><h1>Project portfolio</h1><p className="subtitle">Track project health, completion, contract value, and client ownership.</p></div><button className="primary-button" type="button" onClick={() => onOpenProjects()}>Refresh portfolio</button></header>
      <section className="metric-grid entity-metrics"><article className="metric-card metric-card-primary"><span>Total projects</span><strong>{filteredProjects.length}</strong><small>In current view</small></article><article className="metric-card"><span>Green health</span><strong>{green}</strong><small className="metric-positive">On track</small></article><article className="metric-card"><span>Average completion</span><strong>{averageCompletion}%</strong><small>Across selected projects</small></article><article className="metric-card"><span>Contract value</span><strong>{money(contractValue)}</strong><small>{clientProjects.length} client-linked projects</small></article></section>
      <section className="entity-toolbar"><label className="search-field"><span>Search projects</span><input type="search" placeholder="Search project, client, location..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="entity-filter">Client<select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}><option>All clients</option>{clients.map((client) => <option value={client.craft_clientid} key={client.craft_clientid}>{clientName(client)}</option>)}</select></label><span className="result-count">Showing {filteredProjects.length} records</span></section>
      <section className="table-panel entity-project-table"><div className="table-scroll"><table><thead><tr><th>Project</th><th>Client</th><th>Location</th><th>Health</th><th>Completion</th><th>Contract value</th><th>End date</th></tr></thead><tbody>{filteredProjects.map((project) => <tr key={project.craft_projectid}><td className="equipment-name">{project.craft_projectname || project.craft_projectid1 || project.craft_projectid}<small>{project.craft_projecttype || 'Project'}</small></td><td>{clientName(clientMap.get(projectClientId(project) ?? ''))}</td><td>{project.craft_location || '-'}</td><td><span className={`status status-${healthStatus(project).toLowerCase()}`}>{healthStatus(project)}</span></td><td><div className="completion-cell"><span>{project.craft_completionpercentage ?? 0}%</span><i><b style={{ width: `${Math.min(project.craft_completionpercentage ?? 0, 100)}%` }} /></i></div></td><td>{money(project.craft_contractvalueaed)}</td><td>{date(project.craft_enddate)}</td></tr>)}</tbody></table></div>{filteredProjects.length === 0 && <p className="table-message">No projects match the selected filters.</p>}</section>
    </div>
  )
}

