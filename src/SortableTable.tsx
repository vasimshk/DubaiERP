import { Children, cloneElement, isValidElement, useEffect, useId, useMemo, useState, type MouseEvent, type ReactElement, type ReactNode } from 'react'

type HtmlElementProps = {
  children?: ReactNode
  [key: string]: unknown
}

type SortState = {
  column: number
  direction: 'asc' | 'desc'
}

export type RecordDetailField = {
  label: string
  value: string
}

const textContent = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textContent).join(' ')
  if (isValidElement<HtmlElementProps>(node)) return textContent(node.props.children)
  return ''
}

const compareCellValues = (left: string, right: string) => {
  const normalizedLeft = left.trim().replace(/\s+/g, ' ')
  const normalizedRight = right.trim().replace(/\s+/g, ' ')
  const dateValue = (value: string) => {
    if (!/^\d{1,4}[./-]\d{1,2}[./-]\d{1,4}$/.test(value)) return null
    const timestamp = Date.parse(value)
    return Number.isNaN(timestamp) ? null : timestamp
  }
  const leftDate = dateValue(normalizedLeft)
  const rightDate = dateValue(normalizedRight)
  if (leftDate != null && rightDate != null) return leftDate - rightDate

  const numericValue = (value: string) => {
    const normalized = value.replace(/^(AED|USD|EUR|GBP)\s*/i, '').replace(/,/g, '').replace(/%$/, '').trim()
    return /^[-+]?\d*\.?\d+$/.test(normalized) ? Number(normalized) : null
  }
  const leftNumber = numericValue(normalizedLeft)
  const rightNumber = numericValue(normalizedRight)

  if (leftNumber != null && rightNumber != null) return leftNumber - rightNumber
  return new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare(normalizedLeft, normalizedRight)
}

const isElement = (node: ReactNode, type: string): node is ReactElement<HtmlElementProps> =>
  isValidElement<HtmlElementProps>(node) && node.type === type

export function SortableTable({ children, ...props }: { children: ReactNode; className?: string }) {
  const [sort, setSort] = useState<SortState | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [recordDetails, setRecordDetails] = useState<RecordDetailField[] | null>(null)
  const tableChildren = Children.toArray(children)
  const body = tableChildren.find((child) => isElement(child, 'tbody'))
  const header = tableChildren.find((child) => isElement(child, 'thead'))
  const allRows = useMemo(() => {
    const bodyRows = body ? Children.toArray(body.props.children) : []
    if (!sort) return bodyRows
    return [...bodyRows].sort((left, right) => {
      const leftCells = isElement(left, 'tr') ? Children.toArray(left.props.children) : []
      const rightCells = isElement(right, 'tr') ? Children.toArray(right.props.children) : []
      const result = compareCellValues(textContent(leftCells[sort.column]), textContent(rightCells[sort.column]))
      return sort.direction === 'asc' ? result : -result
    })
  }, [body, sort])
  const pageCount = Math.ceil(allRows.length / pageSize)
  const currentPage = Math.min(page, Math.max(0, pageCount - 1))
  const visibleRows = allRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  const columnLabels = header && isElement(header.props.children, 'tr')
    ? Children.toArray(header.props.children.props.children).map(textContent)
    : []

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [currentPage, page])

  const renderBody = (element: ReactNode): ReactNode => {
    if (!isElement(element, 'tbody')) return element
    const rows = visibleRows.map((row) => {
      if (!isElement(row, 'tr')) return row
      const originalOnClick = row.props.onClick as ((event: MouseEvent<HTMLTableRowElement>) => void) | undefined
      const cells = Children.toArray(row.props.children)
      return cloneElement(row, {
        onClick: (event: MouseEvent<HTMLTableRowElement>) => {
          if ((event.target as HTMLElement).closest('button, a, input, select, textarea')) return
          originalOnClick?.(event)
          setRecordDetails(cells.map((cell, index) => ({ label: columnLabels[index] || `Column ${index + 1}`, value: textContent(cell) || '—' })))
        },
        className: `${row.props.className || ''} record-clickable`.trim(),
        children: row.props.children,
      })
    })
    return cloneElement(element, { children: rows })
  }

  const renderHeader = (element: ReactNode): ReactNode => {
    if (!isElement(element, 'thead')) return element
    const headerRows = Children.toArray(element.props.children).map((row) => {
      if (!isElement(row, 'tr')) return row
      const cells = Children.toArray(row.props.children).map((cell, column) => {
        if (!isElement(cell, 'th')) return cell
        const label = cell.props.children
        const active = sort?.column === column
        const direction = active ? sort.direction : null
        return cloneElement(cell, {
          'aria-sort': direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none',
          children: <button
            className="sortable-table-header"
            type="button"
            aria-label={`Sort by ${textContent(label)}`}
            onClick={() => setSort((current) => ({
              column,
              direction: current?.column === column && current.direction === 'asc' ? 'desc' : 'asc',
            }))}
          >
            {label}
            <span className="sort-indicator" aria-hidden="true">{direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}</span>
          </button>,
        })
      })
      return cloneElement(row, { children: cells })
    })
    return cloneElement(element, { children: headerRows })
  }

  return (
    <div className="sortable-table-container">
      <div className="sortable-table-scroll">
        <table {...props}>
          {tableChildren.map((child) => {
            if (isElement(child, 'thead')) return renderHeader(child)
            if (isElement(child, 'tbody')) return renderBody(child)
            return child
          })}
        </table>
      </div>
      <TablePagination
        itemCount={allRows.length}
        page={currentPage}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(0) }}
      />
      {recordDetails && <RecordDetailsDialog fields={recordDetails} onClose={() => setRecordDetails(null)} />}
    </div>
  )
}

export function TablePageSizeInput({ value, onChange, idPrefix = 'table-page-size' }: { value: number; onChange: (value: number) => void; idPrefix?: string }) {
  const id = useId()
  const listId = `${idPrefix}-${id}`
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commitValue = () => {
    const nextValue = Number(draft)
    if (Number.isInteger(nextValue) && nextValue > 0 && nextValue <= 1000) onChange(nextValue)
    else setDraft(String(value))
  }

  return (
    <>
      <input
        className="table-page-size-input"
        type="text"
        inputMode="numeric"
        aria-label="Rows per page"
        list={listId}
        value={draft}
        onChange={(event) => {
          if (/^\d*$/.test(event.target.value)) setDraft(event.target.value)
        }}
        onBlur={commitValue}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            commitValue()
            event.currentTarget.blur()
          }
          if (event.key === 'Escape') {
            setDraft(String(value))
            event.currentTarget.blur()
          }
        }}
      />
      <datalist id={listId}>
        {[10, 25, 50, 100].map((size) => <option key={size} value={size} />)}
      </datalist>
    </>
  )
}

export function TablePagination({ itemCount, page, pageCount, pageSize, onPageChange, onPageSizeChange }: {
  itemCount: number
  page: number
  pageCount: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const firstItem = itemCount === 0 ? 0 : page * pageSize + 1
  const lastItem = Math.min((page + 1) * pageSize, itemCount)
  return (
    <div className="sortable-table-pagination">
      <span>{itemCount === 0 ? '0 records' : `${firstItem}–${lastItem} of ${itemCount}`}</span>
      <label>Rows per page <TablePageSizeInput value={pageSize} onChange={onPageSizeChange} /></label>
      <div className="sortable-table-page-controls">
        <button type="button" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}>Previous</button>
        <span>{pageCount === 0 ? 0 : page + 1} / {pageCount}</span>
        <button type="button" onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))} disabled={page >= pageCount - 1}>Next</button>
      </div>
    </div>
  )
}

export function RecordDetailsDialog({ fields, onClose }: { fields: RecordDetailField[]; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="record-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="record-dialog" role="dialog" aria-modal="true" aria-labelledby="record-dialog-title">
        <header className="record-dialog-header">
          <div><p className="eyebrow">Record details</p><h2 id="record-dialog-title">{fields[0]?.value || 'Selected record'}</h2></div>
          <button className="record-dialog-close" type="button" onClick={onClose} aria-label="Close record details" autoFocus>×</button>
        </header>
        <dl className="record-dialog-fields">
          {fields.map((field, index) => <div key={`${field.label}-${index}`}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}
        </dl>
      </section>
    </div>
  )
}
