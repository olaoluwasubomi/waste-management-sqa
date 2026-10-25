"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";


export type WasteType = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  status: "ACTIVE" | "INACTIVE";
};

export const columns: ColumnDef<WasteType>[] = [
  {
    accessorKey: "name",
    header: "Waste Name",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="text-gray-500 text-sm max-w-xs truncate">
        {row.getValue("description") || "—"}
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: "Price (₦)",
    cell: ({ row }) => (
      <div className="font-semibold">
        {row.getValue("price")
          ? `₦${Number(row.getValue("price")).toLocaleString()}`
          : "—"}
      </div>
    ),
  },
  {
    accessorKey: "imageUrl",
    header: "Image",
    cell: ({ row }) => {
      const image = row.getValue("imageUrl") as string;

      return image ? (
        <img
          src={image}
          alt="waste"
          className="w-10 h-10 rounded-md object-cover border"
        />
      ) : (
        <span className="text-gray-400 text-sm">No Image</span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;

      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const data = row.original;

      const handleEdit = () => {
        console.log("Edit:", data);
      };

      const handleDelete = () => {
        console.log("Delete:", data);
      };

      return (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleEdit}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      );
    },
  },
];