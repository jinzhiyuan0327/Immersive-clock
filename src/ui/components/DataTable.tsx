import type { ReactNode } from "react";

import styles from "./primitives.module.css";

export interface DataTableColumn<TRow> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (row: TRow) => ReactNode;
}

export interface DataTableProps<TRow> {
  columns: Array<DataTableColumn<TRow>>;
  rows: TRow[];
  getRowKey: (row: TRow) => string;
  emptyText?: string;
}

export function DataTable<TRow>({
  columns,
  rows,
  getRowKey,
  emptyText = "暂无数据",
}: DataTableProps<TRow>) {
  return (
    <div className={styles.dataTableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th data-align={column.align} key={column.key}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length}>{emptyText}</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td data-align={column.align} key={column.key}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
