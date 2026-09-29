import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { CommandChart, CommandChartPoint, CommandCenterSource, CommandFilters, CommandMetric, CommandTable } from './services/operationsCommandCenterService'
import { buildOperationsCommandCenter, emptyCommandFilters } from './services/operationsCommandCenterService'
import { RecordDetailsDialog, TablePageSizeInput, type RecordDetailField } from './SortableTable'
import './OperationalDashboard.css'

type DashboardTab = 'overview' | 'charts' | 'tables'
type Tone = 'green' | 'amber' | 'red' | 'neutral'

type OperationsCommandCenterProps = {
  source: CommandCenterSource
  theme: 'light' | 'gray'
  loading?: boolean
  refreshing?: boolean
  error?: string | null
  lastRefreshed?: Date | null
  onRefresh: () => void
  onToggleTheme: () => void
}

const chartColors = ['#087f80', '#c58a25', '#31806c', '#ad4b42', '#527b98', '#8b688b', '#8b9c4c', '#9ba9ad']
const sections = ['Portfolio Health', 'Financial Control', 'Project Performance', 'Contractor & Workforce', 'Procurement & Equipment', 'Risk & Compliance', 'Executive Decision Matrix'] as const
const collapseStorageKey = 'dubai-erp-command-center-collapsed-panels'
const keyMetricIds = ['delayed-projects', 'budget-overrun', 'pending-payments', 'open-incidents', 'permits-expiring']
const formatNumber = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)

const readCollapsedPanels = () => {
  try {
    const saved = window.sessionStorage.getItem(collapseStorageKey)
    const ids: unknown = saved ? JSON.parse(saved) : []
    return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function ChartPanel({ chart, collapsed, onCollapse, onDrilldown, onOpenTable, hiddenSeries, onToggleSeries }: {
  chart: CommandChart
  collapsed: boolean
  onCollapse: () => void
  onDrilldown: (point: CommandChartPoint, chart: CommandChart) => void
  onOpenTable: (tableId: string) => void
  hiddenSeries: string[]
  onToggleSeries: (key: string) => void
}) {
  const usableSeries = chart.series.filter((item) => !hiddenSeries.includes(item.key))
  const available = !chart.unavailableMessage && chart.data.length > 0
  const drawdown = (entry: unknown) => {
    if (!entry || typeof entry !== 'object') return
    const value = entry as Record<string, unknown>
    const payload = value.payload && typeof value.payload === 'object' ? value.payload as CommandChartPoint : value as unknown as CommandChartPoint
    if (payload.projectIds?.length) onDrilldown(payload, chart)
  }
  const legendClick = (entry: unknown) => {
    if (!entry || typeof entry !== 'object') return
    const legend = entry as Record<string, unknown>
    const key = chart.kind === 'donut' || chart.kind === 'pie'
      ? legend.value
      : chart.kind === 'timeline'
        ? chart.series.find((item) => item.label === legend.value)?.key
        : legend.dataKey
    if (typeof key === 'string') onToggleSeries(key)
  }
  const tooltipProps = {
    contentStyle: { border: '1px solid #dce5e7', borderRadius: 3, fontSize: 12, maxWidth: 320 },
    labelStyle: { color: '#183345', fontWeight: 700 },
    formatter: (value: unknown, name: unknown) => [typeof value === 'number' ? formatNumber(value) : String(value ?? 'Not recorded'), chart.series.find((item) => item.key === String(name))?.label || String(name)],
  }
  const labels = chart.data.map((point) => String(point[chart.categoryKey || 'name'] || ''))
  const points = chart.data.map((point) => ({ ...point, name: String(point.name ?? 'Record') }))
  const visiblePoints = chart.kind === 'donut' || chart.kind === 'pie' ? points.filter((point) => !hiddenSeries.includes(point.name)) : points
  const firstSeries = usableSeries[0]
  const orderedRiskScores = chart.kind === 'heatmap' ? chart.data.map((point) => Number(point.value)).filter(Number.isFinite).sort((left, right) => left - right) : []
  const lowerRiskBand = orderedRiskScores[Math.floor((orderedRiskScores.length - 1) / 3)] ?? 0
  const upperRiskBand = orderedRiskScores[Math.ceil((orderedRiskScores.length - 1) * 2 / 3)] ?? lowerRiskBand
  const allVisibleCategoriesHidden = (chart.kind === 'donut' || chart.kind === 'pie') && visiblePoints.length === 0
  const allVisibleSeriesHidden = ['bar', 'stacked', 'line', 'area', 'timeline'].includes(chart.kind) && chart.series.length > 0 && usableSeries.length === 0

  return (
    <article className={`ops-panel ops-chart-panel${collapsed ? ' is-collapsed' : ''}${chart.data.length > 7 ? ' is-wide' : ''}`}>
      <header className="ops-panel-header">
        <div className="ops-panel-heading-copy"><span className="ops-panel-section">{chart.category}</span><h3>{chart.title}</h3><p>{chart.description}</p></div>
        <div className="ops-panel-actions">
          {chart.tableId && <button className="ops-icon-button" type="button" onClick={() => onOpenTable(chart.tableId!)} title="Open related table" aria-label="Open related table">↗</button>}
          <button className="ops-icon-button" type="button" onClick={onCollapse} title={collapsed ? 'Expand' : 'Collapse'} aria-label={collapsed ? 'Expand chart' : 'Collapse chart'} aria-expanded={!collapsed}>{collapsed ? '⌄' : '⌃'}</button>
        </div>
      </header>
      {!collapsed && (
        <div className="ops-panel-content">
          {!available || allVisibleCategoriesHidden || allVisibleSeriesHidden ? (
            <div className="ops-empty-state" role="status"><span className="ops-empty-symbol">—</span><p>{allVisibleCategoriesHidden || allVisibleSeriesHidden ? 'All categories are hidden. Select a legend item to restore the visualization.' : chart.unavailableMessage || 'No records match the current filters.'}</p></div>
          ) : chart.kind === 'gauge' ? (
            <GaugeVisual chart={chart} onDrilldown={onDrilldown} />
          ) : chart.kind === 'heatmap' ? (
            <div className="ops-heatmap-grid">{chart.data.map((point, index) => <button className="ops-heatmap-cell" type="button" key={`${point.name}-${index}`} onClick={() => drawdown(point)} title={`${point.name} · Risk score ${point.value} · Budget variance ${point.variance ?? 'not recorded'}`} style={{ backgroundColor: heatColor(Number(point.value), lowerRiskBand, upperRiskBand) }}><span>{point.name}</span><strong>{formatNumber(Number(point.value))}</strong><small>risk score</small></button>)}</div>
          ) : chart.kind === 'donut' || chart.kind === 'pie' ? (
            <div className="ops-chart-body ops-pie-body"><ResponsiveContainer width="100%" height="100%"><PieChart>
              <Tooltip {...tooltipProps} />
              <Pie data={visiblePoints} dataKey={firstSeries?.key || 'value'} nameKey={chart.categoryKey || 'name'} innerRadius={chart.kind === 'donut' ? '53%' : 0} outerRadius="78%" paddingAngle={chart.kind === 'donut' ? 2 : 0} onClick={(entry) => drawdown(entry)}>
                {visiblePoints.map((point, index) => <Cell key={`${point.name}-${index}`} fill={chartColors[index % chartColors.length]} cursor={point.projectIds.length ? 'pointer' : 'default'} />)}
              </Pie>
              <Legend onClick={legendClick} />
            </PieChart></ResponsiveContainer></div>
          ) : chart.kind === 'treemap' ? (
            <div className="ops-chart-body"><ResponsiveContainer width="100%" height="100%"><Treemap data={points} dataKey={firstSeries?.key || 'value'} aspectRatio={4 / 3} stroke="#fff" fill={firstSeries?.color || chartColors[0]} content={<TreemapContent onClick={drawdown} />}><Tooltip {...tooltipProps} /></Treemap></ResponsiveContainer></div>
          ) : chart.kind === 'scatter' ? (
            <div className="ops-chart-body"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 12, right: 18, bottom: 12, left: 4 }}>
              <CartesianGrid stroke="#e8eeee" strokeDasharray="3 3" /><XAxis type="number" dataKey={chart.xKey || 'x'} name={chart.xKey || 'x'} tick={{ fontSize: 10 }} /><YAxis type="number" dataKey={chart.yKey || 'y'} name={chart.yKey || 'y'} tick={{ fontSize: 10 }} /><ZAxis type="number" dataKey="value" range={[50, 380]} />
              <Tooltip {...tooltipProps} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name={firstSeries?.label || chart.title} data={points} fill={firstSeries?.color || chartColors[0]} onClick={(entry) => drawdown(entry)} />
            </ScatterChart></ResponsiveContainer></div>
          ) : chart.kind === 'radar' ? (
            <div className="ops-chart-body"><ResponsiveContainer width="100%" height="100%"><RadarChart data={points} outerRadius="72%"><PolarGrid /><PolarAngleAxis dataKey={chart.categoryKey || 'name'} tick={{ fontSize: 9 }} /><PolarRadiusAxis tick={{ fontSize: 9 }} /><Tooltip {...tooltipProps} /><Radar dataKey={firstSeries?.key || 'value'} name={firstSeries?.label || chart.title} fill={firstSeries?.color || chartColors[0]} fillOpacity={0.3} stroke={firstSeries?.color || chartColors[0]} onClick={(entry) => drawdown(entry)} /></RadarChart></ResponsiveContainer></div>
          ) : chart.kind === 'funnel' ? (
            <div className="ops-chart-body"><ResponsiveContainer width="100%" height="100%"><FunnelChart><Tooltip {...tooltipProps} /><Funnel dataKey={firstSeries?.key || 'value'} data={points} isAnimationActive={false} onClick={(entry) => drawdown(entry)}>{points.map((point, index) => <Cell key={`${point.name}-${index}`} fill={chartColors[index % chartColors.length]} cursor={point.projectIds.length ? 'pointer' : 'default'} />)}</Funnel></FunnelChart></ResponsiveContainer></div>
          ) : chart.kind === 'timeline' ? (
            <div className="ops-chart-body"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 14, right: 18, bottom: 20, left: 8 }}><CartesianGrid stroke="#e8eeee" strokeDasharray="3 3" /><XAxis type="number" dataKey="x" domain={['dataMin', 'dataMax']} tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })} tick={{ fontSize: 10 }} /><YAxis type="number" dataKey="y" hide /><Tooltip {...tooltipProps} /><Legend onClick={legendClick} />{chart.series[0] && !hiddenSeries.includes(chart.series[0].key) && <Scatter name={chart.series[0].label} dataKey="y" data={chart.data.map((point, index) => ({ ...point, x: Number(point.date), y: index + 1 }))} fill={chart.series[0].color} onClick={(entry) => drawdown(entry)} />}{chart.series[1] && !hiddenSeries.includes(chart.series[1].key) && <Scatter name={chart.series[1].label} dataKey="y" data={chart.data.map((point, index) => ({ ...point, x: Number(point.actualDate), y: index + 1 }))} fill={chart.series[1].color} onClick={(entry) => drawdown(entry)} />}</ScatterChart></ResponsiveContainer></div>
          ) : chart.kind === 'line' ? (
            <div className="ops-chart-body"><ResponsiveContainer width="100%" height="100%"><LineChart data={points}><CartesianGrid stroke="#e8eeee" strokeDasharray="3 3" /><XAxis dataKey={chart.categoryKey || 'name'} tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip {...tooltipProps} /><Legend onClick={legendClick} />{usableSeries.map((item) => <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} dot activeDot={{ r: 5 }} onClick={(entry) => drawdown(entry)} />)}</LineChart></ResponsiveContainer></div>
          ) : chart.kind === 'area' ? (
            <div className="ops-chart-body"><ResponsiveContainer width="100%" height="100%"><AreaChart data={points}><CartesianGrid stroke="#e8eeee" strokeDasharray="3 3" /><XAxis dataKey={chart.categoryKey || 'name'} tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip {...tooltipProps} /><Legend onClick={legendClick} />{usableSeries.map((item) => <Area key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} fill={item.color} fillOpacity={0.16} stackId={item.stackId} activeDot={{ r: 5 }} onClick={(entry) => drawdown(entry)} />)}</AreaChart></ResponsiveContainer></div>
          ) : (
            <div className="ops-chart-body"><ResponsiveContainer width="100%" height="100%"><BarChart data={points} layout={chart.kind === 'bar' && labels.length > 5 ? 'vertical' : 'horizontal'} margin={{ top: 10, right: 16, bottom: 8, left: 6 }}>
              <CartesianGrid stroke="#e8eeee" strokeDasharray="3 3" vertical={false} />
              {chart.kind === 'bar' && labels.length > 5 ? <><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey={chart.categoryKey || 'name'} width={100} tick={{ fontSize: 10 }} /></> : <><XAxis dataKey={chart.categoryKey || 'name'} tick={{ fontSize: 9 }} angle={labels.length > 6 ? -18 : 0} textAnchor={labels.length > 6 ? 'end' : 'middle'} height={labels.length > 6 ? 46 : 30} /><YAxis tick={{ fontSize: 10 }} /></>}
              <Tooltip {...tooltipProps} /><Legend onClick={legendClick} />
              {usableSeries.map((item) => <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color} stackId={chart.kind === 'stacked' ? item.stackId || 'stack' : undefined} radius={[2, 2, 0, 0]} onClick={(entry) => drawdown(entry)} cursor="pointer" />)}
            </BarChart></ResponsiveContainer></div>
          )}
          {chart.data.some((point) => point.projectIds.length > 0) && <p className="ops-chart-hint">Select a data point to filter the dashboard to its projects.</p>}
        </div>
      )}
    </article>
  )
}

function TreemapContent({ x = 0, y = 0, width = 0, height = 0, name, value, index = 0, payload, onClick }: { x?: number; y?: number; width?: number; height?: number; name?: string; value?: number; index?: number; payload?: CommandChartPoint; onClick: (entry: unknown) => void }) {
  if (width < 2 || height < 2) return null
  const color = chartColors[index % chartColors.length]
  return <g onClick={() => payload && onClick(payload)} style={{ cursor: payload?.projectIds.length ? 'pointer' : 'default' }}><rect x={x} y={y} width={width} height={height} fill={color} stroke="#fff" strokeWidth={2} /><text x={x + 8} y={y + 19} fill="#fff" fontSize={11}>{name?.slice(0, 22)}</text><text x={x + 8} y={y + 36} fill="#fff" fontSize={10}>{formatNumber(value ?? 0)}</text><title>{name}: {formatNumber(value ?? 0)}</title></g>
}

function heatColor(score: number, lowerBand: number, upperBand: number) {
  if (score > upperBand && upperBand > lowerBand) return '#f0d6d2'
  if (score > lowerBand && upperBand > lowerBand) return '#f7e9c9'
  return '#dcebe5'
}

function GaugeVisual({ chart, onDrilldown }: { chart: CommandChart; onDrilldown: (point: CommandChartPoint, chart: CommandChart) => void }) {
  const point = chart.data[0]
  const value = Math.max(0, Math.min(Number(point?.value) || 0, 100))
  const color = value >= 75 ? '#31806c' : value >= 45 ? '#c58a25' : '#ad4b42'
  return <button className="ops-gauge-visual" type="button" onClick={() => point && onDrilldown(point, chart)} title="Filter to projects contributing to this gauge">
    <svg viewBox="0 0 200 120" role="img" aria-label={`${formatNumber(value)}${chart.valueSuffix || ''}`}><path d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke="#e6edeb" strokeWidth="15" strokeLinecap="round" /><path d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke={color} strokeWidth="15" strokeLinecap="round" pathLength="100" strokeDasharray={`${value} 100`} /></svg>
    <strong>{formatNumber(Number(point?.value) || 0)}{chart.valueSuffix || ''}</strong><span>{point?.name || 'Recorded rate'}</span>
  </button>
}

function MetricIndicator({ metric, onClick, secondary = false }: { metric: CommandMetric; onClick: () => void; secondary?: boolean }) {
  const gauge = metric.gauge != null
  return <button className={`ops-metric-strip tone-${metric.tone}${gauge ? ' has-gauge' : ''}${secondary ? ' is-secondary-kpi' : ''}`} type="button" onClick={onClick} title={`Filter dashboard to: ${metric.label}`}>
    {gauge && <span className="ops-metric-ring" style={{ '--ring-value': `${Math.max(0, Math.min(metric.gauge ?? 0, 100)) * 3.6}deg`, '--ring-color': toneColor(metric.tone) } as React.CSSProperties}><i /></span>}
    {!gauge && <i className="ops-metric-status" />}
    <span className="ops-metric-copy"><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></span>
  </button>
}

function toneColor(tone: Tone) {
  return tone === 'green' ? '#31806c' : tone === 'amber' ? '#c58a25' : tone === 'red' ? '#ad4b42' : '#087f80'
}

function OperationalTable({ table, onRowClick, collapsed, onCollapse }: { table: CommandTable; onRowClick: (row: CommandTable['rows'][number]) => void; collapsed: boolean; onCollapse: () => void }) {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: table.columns[0]?.key || '', direction: 'asc' })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [recordDetails, setRecordDetails] = useState<RecordDetailField[] | null>(null)
  const filteredCount = table.rows.filter((item) => !deferredSearch.trim() || Object.values(item.cells).some((value) => value.display.toLowerCase().includes(deferredSearch.trim().toLowerCase()))).length
  const pageCount = Math.ceil(filteredCount / pageSize)
  const currentPage = Math.min(page, Math.max(0, pageCount - 1))
  const visibleRows = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    const filtered = table.rows.filter((item) => !query || Object.values(item.cells).some((value) => value.display.toLowerCase().includes(query)))
    return filtered.sort((left, right) => {
      const first = left.cells[sort.key]?.sortValue ?? ''
      const second = right.cells[sort.key]?.sortValue ?? ''
      const order = typeof first === 'number' && typeof second === 'number' ? first - second : String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: 'base' })
      return sort.direction === 'asc' ? order : -order
    }).slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  }, [deferredSearch, currentPage, pageSize, sort.direction, sort.key, table.rows])

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [currentPage, page])

  return <section className={`ops-panel ops-table-panel${collapsed ? ' is-collapsed' : ''}`}>
    <header className="ops-panel-header"><div className="ops-panel-heading-copy"><span className="ops-panel-section">{table.section}</span><h3>{table.title}</h3><p>{table.description}</p></div><div className="ops-panel-actions"><button className="ops-icon-button" type="button" title={collapsed ? 'Expand' : 'Collapse'} aria-label={collapsed ? 'Expand table' : 'Collapse table'} aria-expanded={!collapsed} onClick={onCollapse}>{collapsed ? '⌄' : '⌃'}</button></div></header>
    {!collapsed && <>
      <div className="ops-table-tools"><label><span>Search records</span><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} placeholder={`Search ${table.title.toLowerCase()}...`} /></label><span>{filteredCount} records</span></div>
      {visibleRows.length ? <div className="ops-table-scroll"><table className="ops-data-table"><thead><tr>{table.columns.map((column) => <th key={column.key} className={column.align === 'right' ? 'is-numeric' : ''}><button type="button" onClick={() => { setSort((current) => current.key === column.key ? { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key: column.key, direction: 'asc' }); setPage(0) }}>{column.label}{sort.key === column.key ? sort.direction === 'asc' ? ' ↑' : ' ↓' : ''}</button></th>)}</tr></thead><tbody>{visibleRows.map((item) => <tr key={item.id} className={item.projectIds.length ? 'is-drillable record-clickable' : 'record-clickable'} onClick={() => { if (item.projectIds.length) onRowClick(item); setRecordDetails(table.columns.map((column) => ({ label: column.label, value: item.cells[column.key]?.display ?? '—' }))) }} title={item.projectIds.length ? 'Click to view record details and filter dashboard to its projects' : 'Click to view record details'}>{table.columns.map((column) => { const value = item.cells[column.key]; return <td key={column.key} className={`${column.align === 'right' ? 'is-numeric' : ''} ${value?.tone ? `tone-text-${value.tone}` : ''}`}>{column.key === 'status' || column.key === 'health' || column.key === 'result' || column.key === 'severity' || column.key === 'ownership' || column.key === 'prequalified' ? <span className={`ops-status-badge tone-${value?.tone || 'neutral'}`}>{value?.display ?? 'Not recorded'}</span> : value?.display ?? '—'}</td> })}</tr>)}</tbody></table></div> : <div className="ops-empty-state"><strong>{search ? 'No matching records' : 'No records available'}</strong><p>{search ? 'Change the search to see other records.' : table.emptyMessage}</p></div>}
      <footer className="ops-table-footer"><span>{filteredCount ? `${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, filteredCount)} of ${filteredCount}` : '0 records'}</span><label>Rows<TablePageSizeInput value={pageSize} onChange={(size) => { setPageSize(size); setPage(0) }} idPrefix={`ops-${table.id}-page-size`} /></label><button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={!currentPage}>Previous</button><span>{pageCount ? currentPage + 1 : 0} / {pageCount}</span><button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={currentPage >= pageCount - 1}>Next</button></footer>
    </>}
    {recordDetails && <RecordDetailsDialog fields={recordDetails} onClose={() => setRecordDetails(null)} />}
  </section>
}

export function OperationsCommandCenter({ source, theme, loading = false, refreshing = false, error, lastRefreshed, onRefresh, onToggleTheme }: OperationsCommandCenterProps) {
  const [filters, setFilters] = useState<CommandFilters>(emptyCommandFilters)
  const [tab, setTab] = useState<DashboardTab>('overview')
  const [activeSection, setActiveSection] = useState<string>('Portfolio Health')
  const [selectedTableId, setSelectedTableId] = useState('new-projects')
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(readCollapsedPanels)
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, string[]>>({})
  const model = useMemo(() => buildOperationsCommandCenter(source, filters), [filters, source])
  const drilldownActive = filters.drilldownProjectIds.length > 0
  const selectedTable = model.tables.find((item) => item.id === selectedTableId) ?? model.tables[0]
  const expandedCharts = model.charts.filter((item) => item.category === activeSection)
  const keyMetrics = keyMetricIds
    .map((id) => model.metrics.find((metric) => metric.id === id))
    .filter((metric): metric is CommandMetric => metric != null)
  const keyMetricIdSet = new Set(keyMetrics.map((metric) => metric.id))

  useEffect(() => {
    try {
      window.sessionStorage.setItem(collapseStorageKey, JSON.stringify([...collapsedPanels]))
    } catch {
      // Session storage can be disabled by the host; in-memory collapse state still works.
    }
  }, [collapsedPanels])

  const resetFilters = () => setFilters(emptyCommandFilters)
  const updateFilter = (key: 'projectId' | 'projectType' | 'status', value: string) => setFilters((current) => ({ ...current, [key]: value, drilldownProjectIds: [], drilldownLabel: '' }))
  const drillToPoint = (point: CommandChartPoint, chart: CommandChart) => {
    if (chart.id === 'project-status') setFilters((current) => ({ ...current, projectId: 'all', status: point.name, drilldownProjectIds: [], drilldownLabel: `Status: ${point.name}` }))
    else if (chart.id === 'project-type') setFilters((current) => ({ ...current, projectId: 'all', projectType: point.name, drilldownProjectIds: [], drilldownLabel: `Type: ${point.name}` }))
    else setFilters((current) => ({ ...current, drilldownProjectIds: [...new Set(point.projectIds)], drilldownLabel: `${chart.title}: ${point.name}` }))
  }
  const drillToRows = (row: CommandTable['rows'][number]) => setFilters((current) => ({ ...current, drilldownProjectIds: row.projectIds, drilldownLabel: 'Selected table records' }))
  const toggleCollapse = (id: string) => setCollapsedPanels((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const toggleSeries = (chartId: string, key: string) => setHiddenSeries((current) => {
    const set = new Set(current[chartId] || [])
    if (set.has(key)) set.delete(key)
    else set.add(key)
    return { ...current, [chartId]: [...set] }
  })
  const openTable = (tableId?: string) => {
    if (!tableId) return
    setSelectedTableId(tableId)
    setTab('tables')
  }
  const clickMetric = (metric: CommandMetric) => {
    const relatedTable: Record<string, string> = {
      'active-projects': 'new-projects', 'delayed-projects': 'lad-risk', 'contract-value': 'budget-health', completion: 'phase-progress', 'budget-overrun': 'budget-health',
      'pending-payments': 'cash-flow', 'approved-variations': 'vo-impact', 'cpi': 'budget-health', 'open-incidents': 'safety-incidents', 'inspection-rate': 'inspection-defects', 'permits-expiring': 'permit-expiry', 'rental-cost': 'equipment-alerts',
    }
    openTable(relatedTable[metric.id])
  }
  const renderChartPanels = (chartList: CommandChart[]) => chartList.map((item) => <ChartPanel key={item.id} chart={item} collapsed={collapsedPanels.has(item.id)} onCollapse={() => toggleCollapse(item.id)} onDrilldown={drillToPoint} onOpenTable={openTable} hiddenSeries={hiddenSeries[item.id] || []} onToggleSeries={(key) => toggleSeries(item.id, key)} />)

  return <div className="operational-dashboard">
    <header className="ops-header"><div><p className="ops-eyebrow">Dubai ERP / Operations</p><h1>Dubai ERP — Operations Command Center</h1><p className="ops-subtitle">Portfolio delivery, financial control, procurement and compliance in one live view.</p></div><div className="ops-header-actions"><div className="ops-refresh-meta"><span>Last refreshed</span><strong>{lastRefreshed ? lastRefreshed.toLocaleString() : 'Not refreshed yet'}</strong></div><button className="ops-refresh-button" type="button" onClick={onRefresh} disabled={loading || refreshing}>{refreshing ? 'Refreshing…' : 'Refresh data'}</button><button className="theme-toggle" type="button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} aria-pressed={theme === 'gray'} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={onToggleTheme}>{theme === 'light' ? <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>}</button></div></header>

    {keyMetrics.length > 0 && <section className="ops-keypoint-marquee" aria-label="Top five portfolio indicators">
      <div className="ops-keypoint-track">
        {[0, 1].map((copy) => <div className="ops-keypoint-group" key={copy} aria-hidden={copy === 1}>
          {keyMetrics.map((metric) => <button className={`ops-keypoint${copy === 1 ? ' is-duplicate' : ''} tone-${metric.tone}`} key={`${copy}-${metric.id}`} type="button" tabIndex={copy === 1 ? -1 : undefined} onClick={() => clickMetric(metric)} title={`Open details for ${metric.label}`}>
            <span>{metric.label}</span><strong>{metric.value}</strong>
          </button>)}
        </div>)}
      </div>
    </section>}

    <section className="ops-filter-bar" aria-label="Dashboard filters">
      <label><span>Project</span><select value={filters.projectId} onChange={(event) => updateFilter('projectId', event.target.value)}><option value="all">All projects</option>{model.filters.projects.map((project) => <option value={project.id} key={project.id}>{project.label}</option>)}</select></label>
      <label><span>Project type</span><select value={filters.projectType} onChange={(event) => updateFilter('projectType', event.target.value)}><option value="all">All types</option>{model.filters.projectTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label><span>Status</span><select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="all">All statuses</option>{model.filters.statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
      <button className="ops-reset-button" type="button" onClick={resetFilters} disabled={filters.projectId === 'all' && filters.projectType === 'all' && filters.status === 'all' && !drilldownActive}>Reset filters</button>
      <span className="ops-filter-count">{model.filteredProjectCount} / {model.sourceProjectCount} projects</span>
    </section>

    {drilldownActive && <div className="ops-drilldown-banner"><span>Filtered by: <strong>{filters.drilldownLabel}</strong></span><button type="button" onClick={() => setFilters((current) => ({ ...current, drilldownProjectIds: [], drilldownLabel: '' }))}>Clear drill-down</button></div>}
    {error && <div className="ops-alert" role="alert"><strong>Data refresh issue</strong><span>{error}</span><button type="button" onClick={onRefresh} disabled={refreshing}>Retry</button></div>}
    {loading ? <div className="ops-loading" role="status"><i /><div><strong>Loading operational data</strong><p>Connecting to Dataverse modules…</p></div></div> : <>
      <section className={`ops-portfolio-overview${collapsedPanels.has('portfolio-overview') ? ' is-collapsed' : ''}`} aria-label="Portfolio overview">
        <header className="ops-section-heading"><div><p className="ops-eyebrow">Portfolio overview</p><h2>Operating position</h2></div><div className="ops-overview-actions"><span>{model.filteredProjectCount} projects in scope</span><button className="ops-icon-button" type="button" onClick={() => toggleCollapse('portfolio-overview')} title={collapsedPanels.has('portfolio-overview') ? 'Expand' : 'Collapse'} aria-label={collapsedPanels.has('portfolio-overview') ? 'Expand portfolio overview' : 'Collapse portfolio overview'} aria-expanded={!collapsedPanels.has('portfolio-overview')}>{collapsedPanels.has('portfolio-overview') ? '⌄' : '⌃'}</button></div></header>
        {!collapsedPanels.has('portfolio-overview') && <div className="ops-metric-strip-grid">{model.metrics.map((metric) => <MetricIndicator key={metric.id} metric={metric} onClick={() => clickMetric(metric)} secondary={!keyMetricIdSet.has(metric.id)} />)}</div>}
      </section>

      {model.sourceProjectCount === 0 && <div className="ops-no-projects"><strong>No project data returned from Dataverse.</strong><p>The command center uses the real project and operational tables. No sample records or simulated trend data are substituted.</p></div>}

      <nav className="ops-dashboard-tabs" aria-label="Dashboard views"><button className={tab === 'overview' ? 'active' : ''} type="button" onClick={() => setTab('overview')}>Command center</button><button className={tab === 'charts' ? 'active' : ''} type="button" onClick={() => setTab('charts')}>All visualizations <span>23</span></button><button className={tab === 'tables' ? 'active' : ''} type="button" onClick={() => setTab('tables')}>Operational tables <span>15</span></button></nav>

      {tab === 'tables' ? <section className="ops-table-view"><header className="ops-section-heading"><div><p className="ops-eyebrow">Operational data</p><h2>Project controls and action registers</h2></div></header><div className="ops-table-selector"><label><span>Select operational table</span><select value={selectedTable.id} onChange={(event) => setSelectedTableId(event.target.value)}>{sections.flatMap((section) => model.tables.filter((item) => item.section === section)).map((item) => <option key={item.id} value={item.id}>{item.title} · {item.rows.length}</option>)}</select></label><span>Table list: {model.tables.length} views</span></div>{selectedTable && <OperationalTable key={selectedTable.id} table={selectedTable} collapsed={collapsedPanels.has(selectedTable.id)} onCollapse={() => toggleCollapse(selectedTable.id)} onRowClick={drillToRows} />}</section> : <section className="ops-chart-library">
        {tab === 'overview' ? sections.map((section) => {
          const items = model.charts.filter((item) => item.category === section)
          if (!items.length) return null
          return <section className="ops-chart-section" key={section}><header className="ops-section-heading"><div><p className="ops-eyebrow">Operations Command Center</p><h2>{section}</h2></div><span>{items.length} analytics</span></header><div className="ops-chart-grid">{renderChartPanels(items)}</div></section>
        }) : <><header className="ops-section-heading"><div><p className="ops-eyebrow">Interactive visualizations</p><h2>{activeSection}</h2></div><label className="ops-section-picker"><span>Section</span><select value={activeSection} onChange={(event) => setActiveSection(event.target.value)}>{sections.map((item) => <option key={item}>{item}</option>)}</select></label></header><div className="ops-chart-grid">{renderChartPanels(expandedCharts)}</div></>}
      </section>}
      <footer className="ops-definition-note">Metrics and panels use the records currently returned by Dataverse. Positive budget variance indicates overrun. Delays use recorded planned dates; historical trends, CPI, return forecasts and resource recommendations require source fields not present in this app’s current data model.</footer>
    </>}
  </div>
}
