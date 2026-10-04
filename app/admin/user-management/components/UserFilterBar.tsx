"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

interface Props {
  setUsers: (users: any[]) => void;
}

export default function UserFilterBar({ setUsers }: Props) {

  const [filters, setFilters] = useState({
    name: "",
    email: "",
    // role: "",
    status: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetchUsers = async () => {
      try {
        const response = await api.get("/admin/get-users", {
          params: appliedFilters,
        });

        setUsers(response.data);
      } catch (error) {
        console.log("Failed to fetch users");
      }
    };
    setLoading(false);

    fetchUsers();
  }, [appliedFilters, setUsers]);

  return (
    <div className="py-10 px-4 shadow-xl border border-white rounded-xl">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-9">

        {/* Name */}
        <input
          type="text"
          placeholder="Search by name"
          value={filters.name}
          onChange={(e) =>
            setFilters({ ...filters, name: e.target.value })
          }
          className="border-b px-3 py-2 w-full outline-none"
        />

        {/* Email */}
        <input
          type="text"
          placeholder="Search by email"
          value={filters.email}
          onChange={(e) =>
            setFilters({ ...filters, email: e.target.value })
          }
          className="border-b px-3 py-2 w-full outline-none"
        />

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
          className="border-b px-3 py-2 w-full outline-none"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
        </select>

        {/* Apply Filters */}
        <button
          // onClick={() => setAppliedFilters(filters)}
          onClick={() =>
            setAppliedFilters({
              name: filters.name.trim(),
              email: filters.email.trim(),
              // role: filters.role,
              status: filters.status,
            })
          }
          className="
            bg-green-600 hover:bg-green-700
            text-white font-medium
            rounded-lg px-4 py-2
            transition shadow-md
          "
        >
          Apply Filters
        </button>

        {/* Reset  Filters */}
        <button
        className="bg-red-600 text-white font-medium rounded-lg px-4 py-2 transition shadow-md"
          onClick={() => {
            const resetFilters = {
              name: "",
              email: "",
              role: "",
              status: "",
            };

            setFilters(resetFilters);
            setAppliedFilters(resetFilters);
          }}
          disabled={!filters.name && !filters.email && !filters.status}
        >
          Reset Filters
        </button>

      </div>

    </div>
  );
}