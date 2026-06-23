// src/common/tables/Table.tsx
import React from 'react';
import { Table as MantineTable, TableProps as MantineTableProps } from '@mantine/core';

export type Column<T> = {
  /** Header title */
  header: React.ReactNode;
  /** Accessor function to retrieve cell value */
  render: (row: T) => React.ReactNode;
  /** Optional className for the column */
  className?: string;
};

export type TableProps<T> = {
  /** Data rows */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Optional caption */
  caption?: string;
} & Omit<MantineTableProps, 'children'>;

export function Table<T>({ data, columns, caption, ...rest }: TableProps<T>) {
  return (
    <MantineTable {...rest}>
      {caption && <MantineTable.Caption>{caption}</MantineTable.Caption>}
      <MantineTable.Thead>
        <MantineTable.Tr>
          {columns.map((col, idx) => (
            <MantineTable.Th key={idx} className={col.className}>
              {col.header}
            </MantineTable.Th>
          ))}
        </MantineTable.Tr>
      </MantineTable.Thead>
      <MantineTable.Tbody>
        {data.map((row, rowIdx) => (
          <MantineTable.Tr key={rowIdx}>
            {columns.map((col, colIdx) => (
              <MantineTable.Td key={colIdx} className={col.className}>
                {col.render(row)}
              </MantineTable.Td>
            ))}
          </MantineTable.Tr>
        ))}
      </MantineTable.Tbody>
    </MantineTable>
  );
}

export default Table;
