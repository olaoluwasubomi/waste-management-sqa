"use client";

import { useEffect, useState } from "react";
import UsersDataTable from "./components/UsersTable";
import UserFilterBar from "./components/UserFilterBar";
import { UserRow } from "./components/columns";
import api from "@/lib/api";
import { useRefreshSignal } from "@/lib/useRefresh";
import EditUserModal from "./components/EditUserModal";

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecteduser, setSelectedUser] = useState<UserRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const refresh = useRefreshSignal();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin/get-users");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [refresh]);

  return (
    <div className="px-4">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">User Management</h2>
        <p className="text-gray-500">
          Manage all registered users in the system
        </p>
      </div>

      {/* Filter */}
      <div className="mt-6">
        <UserFilterBar setUsers={setUsers} />
      </div>

      {/* Table */}
      <div className="mt-6">
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <UsersDataTable 
            data={users} 
            onEdit={(user) => {
              setSelectedUser(user);
              setIsEditOpen(true);
            }}
          />
        )}
      </div>
      <EditUserModal
        user={selecteduser}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />


    </div>
  );
}
