/* eslint-disable no-console */
import React from 'react';
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Pagination,
  EmptyState,
  EmptyStateIcon,
  Title
} from '@patternfly/react-core';
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  ConditionalTableBody,
  FilterToolbar,
  FilterType,
  FilterValue,
  ActiveSort,
  TableHeaderContentWithBatteries,
  TableRowContentWithBatteries,
  useTablePropHelpers,
  useTableState
} from '@patternfly-labs/react-table-batteries';

// This example table's rows represent Thing objects in our fake API.
interface Thing {
  id: number;
  name: string;
  description: string;
}

// This is a barebones mock API server to demonstrate removing filter/sort/pagination logic from the client.
// We use a timeout of 1000ms here to simulate the loading state when data is fetched.
interface MockAPIResponse {
  data: Thing[];
  totalItemCount: number;
}
const fetchMockData = (apiParams: {
  filterValues: Partial<Record<'name' | 'description', FilterValue>>;
  activeSort: ActiveSort<'name' | 'description'> | null;
  pageNumber: number;
  itemsPerPage: number;
}) =>
  new Promise<MockAPIResponse>((resolve) => {
    setTimeout(() => {
      const { filterValues, activeSort, pageNumber, itemsPerPage } = apiParams;
      const rawMockData: Thing[] = [
        { id: 1, name: 'Thing 01', description: 'Something from the API' },
        { id: 2, name: 'Thing 02', description: 'Something else from the API' },
        { id: 3, name: 'Thing 03', description: 'Another API object' },
        { id: 4, name: 'Thing 04', description: 'These desriptions are unique' },
        { id: 5, name: 'Thing 05', description: 'So you can try filtering and sorting' },
        { id: 6, name: 'Thing 06', description: 'Go ahead and try it above' },
        { id: 7, name: 'Thing 07', description: 'Every time you change filters, sort or pagination' },
        { id: 8, name: 'Thing 08', description: 'The data will refetch' },
        { id: 9, name: 'Thing 09', description: 'To perform that logic' },
        { id: 10, name: 'Thing 10', description: 'On the server' },
        { id: 11, name: 'Thing 11', description: 'We have more than 10 things here' },
        { id: 12, name: 'Thing 12', description: 'So you can try pagination' }
      ];
      // None of this mock filter/sort/pagination logic is ever necessary when rendering a real table.
      // It'll either be handled for you in useClientTableBatteries or on a server.
      const filteredData = rawMockData.filter((thing) =>
        ['name', 'description'].every(
          (field) => !filterValues[field] || thing[field].toLowerCase().includes(filterValues[field][0].toLowerCase())
        )
      );
      const sortedData = activeSort
        ? filteredData.sort((thingA, thingB) => {
            const sortValueA = thingA[activeSort.columnKey];
            const sortValueB = thingB[activeSort.columnKey];
            if (activeSort.direction === 'asc') {
              return sortValueA < sortValueB ? -1 : 1;
            }
            return sortValueA > sortValueB ? -1 : 1;
          })
        : filteredData;
      const pageStartIndex = (pageNumber - 1) * itemsPerPage;
      const paginatedData = sortedData.slice(pageStartIndex, pageStartIndex + itemsPerPage);
      resolve({ data: paginatedData, totalItemCount: filteredData.length });
    }, 1000);
  });

export const ExampleBasicServerPaginated: React.FunctionComponent = () => {
  const tableState = useTableState({
    persistTo: 'urlParams',
    persistenceKeyPrefix: 't2', // The second Things table on this page.
    columnNames: {
      name: 'Name',
      description: 'Description'
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    filterCategories: [
      {
        key: 'name',
        title: 'Name',
        type: FilterType.search,
        placeholderText: 'Filter by name...'
      },
      {
        key: 'description',
        title: 'Description',
        type: FilterType.search,
        placeholderText: 'Filter by description...'
      }
    ],
    sortableColumns: ['name', 'description'],
    initialSort: { columnKey: 'name', direction: 'asc' }
  });

  const {
    filterState: { filterValues },
    sortState: { activeSort },
    paginationState: { pageNumber, itemsPerPage }
  } = tableState;

  // In a real table we'd use a real API fetch here, perhaps using a library like react-query.
  const [mockApiResponse, setMockApiResponse] = React.useState<MockAPIResponse>({ data: [], totalItemCount: 0 });
  const [isLoadingMockData, setIsLoadingMockData] = React.useState(false);
  React.useEffect(() => {
    setIsLoadingMockData(true);
    fetchMockData({ filterValues, activeSort, pageNumber, itemsPerPage }).then((response) => {
      setMockApiResponse(response);
      setIsLoadingMockData(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableState.cacheKey]);
  // The cacheKey string above changes when filtering, sorting or pagination state change and the API data should be refetched.

  const tableBatteries = useTablePropHelpers({
    ...tableState,
    idProperty: 'id',
    isLoading: isLoadingMockData,
    currentPageItems: mockApiResponse.data,
    totalItemCount: mockApiResponse.totalItemCount,
    // TODO this shouldn't be necessary once we refactor useSelectionState to fit the rest of the table-batteries pattern.
    // Due to an unresolved issue, the `selectionState` is required here even though we're not using selection.
    // As a temporary workaround we pass stub values for these properties.
    selectionState: {
      selectedItems: [],
      isItemSelected: () => false,
      isItemSelectable: () => false,
      toggleItemSelected: () => {},
      selectMultiple: () => {},
      areAllSelected: false,
      selectAll: () => {},
      setSelectedItems: () => {}
    }
  });

  // Everything below is the same as in the basic client-side example!

  const {
    currentPageItems, // These items have already been paginated.
    // `numRenderedColumns` is based on the number of columnNames and additional columns needed for
    // rendering controls related to features like selection, expansion, etc.
    // It is used as the colSpan when rendering a full-table-wide cell.
    numRenderedColumns,
    // The objects and functions in `propHelpers` correspond to the props needed for specific PatternFly or Tackle
    // components and are provided to reduce prop-drilling and make the rendering code as short as possible.
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps
    }
  } = tableBatteries;

  return (
    <>
      <Toolbar {...toolbarProps}>
        <ToolbarContent>
          <FilterToolbar {...filterToolbarProps} id="server-paginated-example-filters" />
          {/* You can render whatever other custom toolbar items you may need here! */}
          <ToolbarItem {...paginationToolbarItemProps}>
            <Pagination variant="top" isCompact {...paginationProps} widgetId="server-paginated-example-pagination" />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table {...tableProps} aria-label="Example things table">
        <Thead>
          <Tr>
            <TableHeaderContentWithBatteries {...tableBatteries}>
              <Th {...getThProps({ columnKey: 'name' })} />
              <Th {...getThProps({ columnKey: 'description' })} />
            </TableHeaderContentWithBatteries>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isLoading={isLoadingMockData}
          isNoData={currentPageItems.length === 0}
          noDataEmptyState={
            <EmptyState variant="sm">
              <EmptyStateIcon icon={CubesIcon} />
              <Title headingLevel="h2" size="lg">
                No things available
              </Title>
            </EmptyState>
          }
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageItems?.map((thing, rowIndex) => (
              <Tr key={thing.id} {...getTrProps({ item: thing })}>
                <TableRowContentWithBatteries {...tableBatteries} item={thing} rowIndex={rowIndex}>
                  <Td width={30} {...getTdProps({ columnKey: 'name' })}>
                    {thing.name}
                  </Td>
                  <Td width={70} {...getTdProps({ columnKey: 'description' })}>
                    {thing.description}
                  </Td>
                </TableRowContentWithBatteries>
              </Tr>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </Table>
      <Pagination variant="bottom" isCompact {...paginationProps} widgetId="server-paginated-example-pagination" />
    </>
  );
};
