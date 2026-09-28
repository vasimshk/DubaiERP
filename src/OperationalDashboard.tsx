import { useMemo, useState } from 'react'
import {
  emptyDashboardFilters,
  getOperationalDashboardModel,
  type DashboardChart,
  type DashboardFilters,
  type DashboardTable,
  type OperationalDashboardSource,
} from './services/operationalDashboardService'
import './OperationalDashboard.css'

type DashboardTab = 'overview' | 'analytics' | 'tables'

type OperationalDashboardProps = {
  source: OperationalDashboardSource
  loading?: boolean
  refreshing?: boolean
  error?: string | null
  lastRefreshed?: Date | null
  onRefresh: () => void
}

const chartColors = ['#007f86', '#e29c24', '#28735f', '#bd5949', '#416d91', '#8a6b9f', '#839447', '#d16b8c']
const overviewCharts = new Set(['status', 'schedule', 'progress', 'attention', 'project-value', 'cash-flow'])

const formatValue = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)
const percentWidth = (value: number, maximum: number) => `${maximum > 0 ? Math.max(0, Math.min((Math.abs(value) / maximum) * 100, 100)) : 0}%`

function ChartVisual({ chart }: { chart: DashboardChart }) {
  if (chart.unavailableMessage || chart.points.length === 0) {
    return (
      <div className="ops-chart-empty" role="status">
        <span className="ops-empty-mark" aria-hidden="true">—</span>
        <p>{chart.unavailableMessage || 'No data is available for this selection.'}</p>
      </div>
    )
  }

  if (chart.kind === 'donut') {
    const total = chart.points.reduce((sum, point) => sum + point.value, 0)
    const gradient = chart.points.reduce<{ position: number; stops: string[] }>((result, point, index) => {
      const nextPosition = result.position + (total > 0 ? (point.value / total) * 100 : 0)
      return {
        position: nextPosition,
        stops: [...result.stops, `${chartColors[index % chartColors.length]} ${result.position}% ${nextPosition}%`],
      }
    }, { position: 0, stops: [] }).stops.join(', ')

    return (
      <div className="ops-donut-layout">
        <div className="ops-donut" style={{ background: `conic-gradient(${gradient})` }} aria-label={`${formatValue(total)} total`}>
          <div><strong>{formatValue(total)}</strong><span>records</span></div>
        </div>
        <ul className="ops-chart-legend">
          {chart.points.map((point, index) => <li key={point.label}><i style={{ backgroundColor: chartColors[index % chartColors.length] }} /><span>{point.label}</span><strong>{formatValue(point.value)}</strong></li>)}
        </ul>
      </div>
    )
  }

  const maximum = Math.max(...chart.points.flatMap((point) => [Math.abs(point.value), Math.abs(point.secondaryValue ?? 0)]), 1)

  return (
    <div className="ops-chart-bars">
      {chart.kind === 'comparison' && <div className="ops-series-labels"><span>{chart.seriesLabels?.primary || 'Recorded value'}</span><span>{chart.seriesLabels?.secondary || 'Comparison value'}</span></div>}
      {chart.points.map((point, index) => (
        <div className="ops-chart-row" key={`${point.label}-${index}`}>
          <div className="ops-chart-label" title={point.label}>{point.label}</div>
          <div className="ops-chart-values">
            <div className="ops-bar-line"><i className="ops-bar-track"><b style={{ width: percentWidth(point.value, maximum), backgroundColor: chartColors[index % chartColors.length] }} /></i><strong>{formatValue(point.value)}{chart.kind === 'progress' ? '%' : ''}</strong></div>
            {chart.kind === 'comparison' && <div className="ops-bar-line"><i className="ops-bar-track"><b className="ops-bar-secondary" style={{ width: percentWidth(point.secondaryValue ?? 0, maximum) }} /></i><strong>{formatValue(point.secondaryValue ?? 0)}</strong></div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function ChartCard({ chart }: { chart: DashboardChart }) {
  return (
    <article className="ops-chart-card">
      <header><div><h3>{chart.title}</h3><p>{chart.description}</p></div></header>
      <ChartVisual chart={chart} />
    </article>
  )
}

function KpiCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: string }) {
  return (
    <article className={`ops-kpi-card${tone ? ` ops-kpi-${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function DashboardDataTable({ table }: { table: DashboardTable }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(table.columns[0]?.key ?? '')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    const rows = table.rows.filter((row) => !query || Object.values(row.cells).some((value) => value.display.toLowerCase().includes(query)))
    return rows.sort((left, right) => {
      const leftValue = left.cells[sortKey]?.sortValue ?? ''
      const rightValue = right.cells[sortKey]?.sortValue ?? ''
      const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true, sensitivity: 'base' })
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [search, sortDirection, sortKey, table.rows])
  const pageCount = Math.ceil(filteredRows.length / pageSize)
  const visibleRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setSortDirection('asc')
    }
    setPage(0)
  }

  return (
    <section className="ops-table-panel">
      <header className="ops-table-heading"><div><h2>{table.label}</h2><p>{table.description}</p></div><label className="ops-table-search"><span>Search rows</span><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} placeholder="Search this table..." /></label></header>
      {visibleRows.length > 0 ? (
        <div className="ops-table-scroll"><table className="ops-data-table">
          <thead><tr>{table.columns.map((column) => <th key={column.key} className={column.align === 'right' ? 'is-numeric' : ''}><button type="button" onClick={() => handleSort(column.key)} aria-label={`Sort by ${column.label}`}>{column.label}<span aria-hidden="true">{sortKey === column.key ? sortDirection === 'asc' ? ' ↑' : ' ↓' : ''}</span></button></th>)}</tr></thead>
          <tbody>{visibleRows.map((row) => <tr key={row.id}>{table.columns.map((column) => <td key={column.key} className={column.align === 'right' ? 'is-numeric' : ''}>{row.cells[column.key]?.display ?? '—'}</td>)}</tr>)}</tbody>
        </table></div>
      ) : (
        <div className="ops-table-empty"><strong>{search ? 'No matching rows' : 'No records to display'}</strong><p>{search ? 'Try a different search term.' : table.emptyMessage}</p></div>
      )}
      <footer className="ops-table-footer">
        <span>{filteredRows.length === 0 ? '0 records' : `${page * pageSize + 1}-${Math.min((page + 1) * pageSize, filteredRows.length)} of ${filteredRows.length}`}</span>
        <div className="ops-table-pagination">
          <label>Rows<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></label>
          <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>Previous</button>
          <span>{pageCount === 0 ? 0 : page + 1} / {pageCount}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page >= pageCount - 1}>Next</button>
        </div>
      </footer>
    </section>
  )
}

export function OperationalDashboard({ source, loading = false, refreshing = false, error, lastRefreshed, onRefresh }: OperationalDashboardProps) {
  const [filters, setFilters] = useState<DashboardFilters>(emptyDashboardFilters)
  const [tab, setTab] = useState<DashboardTab>('overview')
  const [tableId, setTableId] = useState('portfolio')
  const model = useMemo(() => getOperationalDashboardModel(source, filters), [filters, source])
  const selectedTable = model.tables.find((table) => table.id === tableId) ?? model.tables[0]
  const visibleCharts = tab === 'overview' ? model.charts.filter((chart) => overviewCharts.has(chart.id)) : model.charts

  const updateFilter = (key: keyof DashboardFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }))

  return (
    <div className="operational-dashboard">
      <header className="ops-header">
        <div><p className="ops-eyebrow">Dubai ERP / Delivery intelligence</p><h1>Operational Dashboard</h1><p className="ops-subtitle">A live view of project delivery, financial exposure, schedule, and operational risk.</p></div>
        <div className="ops-header-actions"><div className="ops-refresh-meta"><span>Last refreshed</span><strong>{lastRefreshed ? lastRefreshed.toLocaleString() : 'Not refreshed yet'}</strong></div><button className="ops-refresh-button" type="button" onClick={onRefresh} disabled={loading || refreshing}>{refreshing ? 'Refreshing...' : 'Refresh data'}</button></div>
      </header>

      <section className="ops-filter-bar" aria-label="Dashboard filters">
        <label><span>Project</span><select value={filters.projectId} onChange={(event) => updateFilter('projectId', event.target.value)}><option value="all">All projects</option>{model.filters.projects.map((project) => <option key={project.id} value={project.id}>{project.label}</option>)}</select></label>
        <label><span>Project type</span><select value={filters.projectType} onChange={(event) => updateFilter('projectType', event.target.value)}><option value="all">All types</option>{model.filters.projectTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
        <label><span>Status</span><select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="all">All statuses</option>{model.filters.statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        <button className="ops-reset-button" type="button" onClick={() => setFilters(emptyDashboardFilters)} disabled={filters.projectId === 'all' && filters.projectType === 'all' && filters.status === 'all'}>Reset filters</button>
        <span className="ops-filter-count">{model.filteredProjectCount} of {model.sourceProjectCount} projects</span>
      </section>

      {error && <div className="ops-alert" role="alert"><strong>Dashboard refresh failed.</strong><span>{error}</span><button type="button" onClick={onRefresh} disabled={refreshing}>Retry</button></div>}
      {loading ? (
        <div className="ops-loading" role="status"><span className="ops-loading-mark" /><div><strong>Loading operational data</strong><p>Retrieving project and delivery records from Dataverse...</p></div></div>
      ) : (
        <>
          <section className="ops-kpi-grid" aria-label="Project key performance indicators">
            {model.kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
          </section>

          {model.sourceProjectCount === 0 && <div className="ops-no-projects"><strong>No project records are available.</strong><p>Connect project data in Dataverse or refresh the dashboard to try again. No sample records are being substituted.</p></div>}

          <nav className="ops-dashboard-tabs" aria-label="Dashboard sections">
            <button type="button" className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
            <button type="button" className={tab === 'analytics' ? 'active' : ''} onClick={() => setTab('analytics')}>Analytics <span>23</span></button>
            <button type="button" className={tab === 'tables' ? 'active' : ''} onClick={() => setTab('tables')}>Data tables <span>15</span></button>
          </nav>

          {tab === 'tables' ? (
            <section className="ops-table-section">
              <label className="ops-table-picker"><span>Table</span><select value={selectedTable.id} onChange={(event) => setTableId(event.target.value)}>{model.tables.map((table) => <option key={table.id} value={table.id}>{table.label} ({table.rows.length})</option>)}</select></label>
              <DashboardDataTable key={selectedTable.id} table={selectedTable} />
            </section>
          ) : (
            <section className="ops-analytics-section">
              <header className="ops-section-heading"><div><p className="ops-eyebrow">{tab === 'overview' ? 'Portfolio snapshot' : 'Full analytical library'}</p><h2>{tab === 'overview' ? 'Delivery signals' : 'Project analytics'}</h2></div><span>{tab === 'overview' ? `${visibleCharts.length} featured views` : `${model.charts.length} chart views`}</span></header>
              <div className="ops-chart-grid">{visibleCharts.map((chart) => <ChartCard key={chart.id} chart={chart} />)}</div>
              {tab === 'overview' && (
                <section className="ops-overview-table">
                  <header className="ops-section-heading"><div><p className="ops-eyebrow">Action queue</p><h2>Projects requiring attention</h2></div><button type="button" onClick={() => { setTableId('attention'); setTab('tables') }}>View detailed table</button></header>
                  <DashboardDataTable table={model.tables.find((table) => table.id === 'attention') ?? selectedTable} />
                </section>
              )}
            </section>
          )}
          <footer className="ops-definition-note">Schedule delay uses an end date before today and progress below 100%. Attention means delayed, amber/red health, or an explicit flagged status. Values are calculated only from the filtered Dataverse records.</footer>
        </>
      )}
    </div>
  )
}