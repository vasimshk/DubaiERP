# Pagination

Pagination is client-side. It divides rows already present in React memory; it does not fetch another Dataverse page. Upstream reads in `src/App.tsx` currently cap most sources at 200 records and Equipment at 100. See [`DATA-SOURCES.md`](DATA-SOURCES.md).

There are three current implementations. The first two are used by the active Operations Command Center; the generic wrapper is used by entity tables and the alternate dashboard component also contains an additional dashboard table implementation.

## Shared table wrapper: `SortableTable`

File: `src/SortableTable.tsx`.

- Page index is zero-based React state, initially `0`; page size is initially `10`.
- It converts the provided `<tbody>` children to a row list, sorts the full in-memory list if a header has been selected, then slices that ordered list for the current page.
- Clicking a column header toggles ascending/descending for that column. A newly selected column starts ascending.
- Sorting does **not** explicitly reset the page to zero.
- If filtering/replacement of the supplied rows shrinks page count, `currentPage` is clamped to the last available page; it is then synchronized back into state. Empty result sets clamp to page `0`.
- Changing page size resets the page to `0`.
- Current presets are 10, 25, 50, and 100 rows. “Custom…” exposes a numeric text input and Apply button; accepted custom sizes are positive integers through 1000. Enter commits; Escape reverts the draft input. Invalid custom values cannot be applied.
- Controls expose first/previous/next/last navigation and display the visible record range and page count.
- A row click opens a detail dialog using the current row's displayed cell text and table headings; clicks originating inside buttons, links, inputs, selects, or textareas are ignored by the wrapper.

Filtering for entity tables is usually performed by the page before it passes row children to `SortableTable`. The wrapper sees only those rows. When a filtered result becomes shorter, clamping prevents the current page remaining out of range.

## Active dashboard tables: `OperationalTable`

File: `src/OperationsCommandCenter.tsx`; rendered from the Tables dashboard tab.

- Each table panel holds its own search text, deferred search value (`useDeferredValue`), sort key/direction, zero-based page, and page size (initially page `0`, size `10`).
- Search matches the display text of any cell, case-insensitively, after trimming. Entering search text requests page `0`; row filtering uses the deferred value.
- Sorting uses each cell's explicit `sortValue` where provided, compares two numeric values numerically and otherwise uses numeric-aware, case-insensitive string ordering. Selecting a different column starts ascending; selecting the active column toggles direction. A sort click requests page `0`.
- Page count is calculated from matching rows. The current page is clamped and synchronized when the result count changes.
- Page-size presets/custom validation and first/previous/next/last controls come from shared `TablePagination`; changing size resets to page `0`.
- A row click opens details. If the row has project IDs it also applies the corresponding selected-record project drill-down; rows without project IDs only open details.
- Collapsing/expanding the panel does not reset its paging state while that component instance remains mounted.

## Alternate dashboard table: `DashboardDataTable`

File: `src/OperationalDashboard.tsx`. This component is present but is not the Dashboard currently rendered by `App`.

- It owns search, sort key/direction, page, and page size; initial page is `0`, page size is `10`.
- Search filters table cell display strings case-insensitively. Filtering and sorting happen before slicing.
- Selecting a sort key/direction resets page to `0`; search and page-size changes also reset page to `0`.
- Page is clamped to the last page after a row-count change, or to `0` if no rows remain.
- It uses the same page-size presets/custom input and shared `TablePagination`.

## Reset and edge behavior

- There is no standalone “reset pagination” action. Search and sort interactions in dashboard tables explicitly request the first page; changing size does the same.
- In the generic `SortableTable`, changing sort leaves page state unchanged, while the clamp only adjusts it if page count becomes smaller.
- Empty result sets display zero records and page `0 / 0`; navigation buttons are disabled.
- Pagination cannot reveal records not returned in the initial/refresh `getAll` calls. Increase coverage only through a deliberate data-loading change; do not describe browser pagination as Dataverse paging.
- Table data updates can preserve search/sort/page state while the component remains mounted, subject to the clamp. A table switch keyed by table ID creates a different `OperationalTable` instance.

## Regression checks

When changing paging or filtering, verify first/last page boundaries, zero rows, exactly one page, a short final page, custom sizes at valid/invalid boundaries, filtering from a late page to fewer pages, search + sort ordering, page-size changes, and detail/drill-down behavior in each active implementation.
