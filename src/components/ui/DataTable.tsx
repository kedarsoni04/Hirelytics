import React from "react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({ data, columns, keyExtractor }: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/60 bg-white shadow-sm">
      <table className="w-full text-left text-sm text-foreground border-collapse min-w-[600px]">
        <thead className="bg-muted/50 text-xs tracking-tight uppercase text-muted-foreground">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={`px-5 py-3 font-semibold ${col.className || ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-8 text-center text-muted-foreground text-sm">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-muted/30 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className={`px-5 py-4 ${col.className || ""}`}>
                    {col.cell ? col.cell(row) : (row[col.accessorKey as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
