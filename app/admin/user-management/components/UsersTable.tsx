"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { columns, UserRow } from "./columns";

interface Props {
  data: UserRow[];
  onEdit: (user: UserRow) => void;
}

export default function UsersDataTable({ data, onEdit }: Props) {
  const table = useReactTable({
    data,
    columns : columns({onEdit}),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl p-4 shadow-xl border border-white mt-10">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
