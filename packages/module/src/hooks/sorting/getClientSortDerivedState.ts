import { SortState } from './useSortState';

/**
 * Args for getClientSortDerivedState
 * - Partially satisfied by the object returned by useTableState (TableState)
 * - Makes up part of the arguments object taken by getClientTableDerivedState (GetClientTableDerivedStateArgs)
 * @see TableState
 * @see GetClientTableDerivedStateArgs
 */
export interface GetClientSortDerivedStateArgs<TItem, TSortableColumnKey extends string> {
  /**
   * The API data items before sorting
   */
  items: TItem[];
  /**
   * A callback function to return, for a given API data item, a record of sortable primitives for that item's sortable columns
   * - The record maps:
   *   - from `columnKey` values (the keys of the `columnNames` object passed to useTableState)
   *   - to easily sorted primitive values (string | number | boolean) for this item's value in that column
   */
  getSortValues?: (
    // TODO can we require this as non-optional in types that extend this when we know we're configuring a client-computed table?
    item: TItem
  ) => Record<TSortableColumnKey, string | number | boolean>;
  /**
   * The "source of truth" state for the sort feature (returned by useSortState)
   */
  sortState: SortState<TSortableColumnKey>;
}

/**
 * Given the "source of truth" state for the sort feature and additional arguments, returns "derived state" values and convenience functions.
 * - For local/client-computed tables only. Performs the actual sorting logic, which is done on the server for server-computed tables.
 * - "source of truth" (persisted) state and "derived state" are kept separate to prevent out-of-sync duplicated state.
 */
export const getClientSortDerivedState = <TItem, TSortableColumnKey extends string>({
  items,
  getSortValues,
  sortState: { activeSort }
}: GetClientSortDerivedStateArgs<TItem, TSortableColumnKey>) => {
  if (!getSortValues || !activeSort) {
    return { sortedItems: items };
  }

  let sortedItems = items;
  sortedItems = [...items].sort((a: TItem, b: TItem) => {
    let aValue = getSortValues(a)[activeSort.columnKey];
    let bValue = getSortValues(b)[activeSort.columnKey];
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.replace(/ +/g, '');
      bValue = bValue.replace(/ +/g, '');
      const aSortResult = aValue.localeCompare(bValue);
      const bSortResult = bValue.localeCompare(aValue);
      return activeSort.direction === 'asc' ? aSortResult : bSortResult;
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      return activeSort.direction === 'asc' ? aValue - bValue : bValue - aValue;
    } else {
      if (aValue > bValue) {
        return activeSort.direction === 'asc' ? -1 : 1;
      }
      if (aValue < bValue) {
        return activeSort.direction === 'asc' ? -1 : 1;
      }
    }

    return 0;
  });

  return { sortedItems };
};
