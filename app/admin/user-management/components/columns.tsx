"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";

export type UserRow = {
  id: string;
  name: string;
  lastName: string;
  phone:string;
  address:string;
  email: string;
  role: "ADMIN" | "USER" | "COLLECTOR";
  status: "ACTIVE" | "PENDING";
  image?: string;
};

export const columns = ({
  onEdit,
}: {
  onEdit: (user: UserRow) => void;
}): ColumnDef<UserRow>[] => [
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="font-medium">{user.name}</p>
            {/* <p className="text-sm text-gray-500">{user.email}</p> */}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({row}) => {
        const email = row.original;
        return (
            <div>
                <p className="font-medium">{email.email}</p>
            </div>
        )
    }
  },

  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role;

      const color =
        role === "ADMIN"
          ? "bg-red-500"
          : role === "COLLECTOR"
          ? "bg-blue-500"
          : "bg-green-500";

      return (
       <p>{role}</p>
      );
    },
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className={
                status === "ACTIVE"
                  ? "bg-green-600 text-white"
                  : status === "PENDING"?"bg-yellow-500 text-white"
                  :"bg-red-500 text-white"
              }
            >
              {status}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem>Active</DropdownMenuItem>
            <DropdownMenuItem>Pending</DropdownMenuItem>
            <DropdownMenuItem>Suspended</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(user)}>Edit User</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
