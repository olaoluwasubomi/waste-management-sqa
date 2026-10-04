"use client"

import {
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { columns, WasteType } from "../components/columns";

import { flexRender } from "@tanstack/react-table"
// import { columns, WasteType } from "./columns"

// const data: WasteType[] = [
//   {
//     id: 1,
//     name: "Plastic",
//     description: "Plastic bottles and containers",
//     price: 500,
//     image: "/plastic.jpg",
//     status: "ACTIVE"
//   },
//   {
//     id: 2,
//     name: "Metal",
//     description: "Scrap metals and cans",
//     price: 800,
//     image: "/metal.jpg",
//     status: "INACTIVE"
//   }
// ]

interface Props {
  data: WasteType[];
}


export default function WasteTable( {data} : Props) {

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <div className="rounded-xl p-4 shadow-xl border border-white mt-10">

      <Table>

        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>

              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>

                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}

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

                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}

                </TableCell>
              ))}

            </TableRow>
          ))}

        </TableBody>

      </Table>

    </div>
  )
}`  `