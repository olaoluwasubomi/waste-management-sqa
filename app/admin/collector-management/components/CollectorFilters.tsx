"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

interface Props {
  setCollectors: (collectors: any[]) => void;
}
export default function CollectorFilters({ setCollectors }: Props) {
  const [filters, setFilters] = useState({
    name: "",
    email:"",
    // zone: "",
    status: "",
  });
  
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetchUsers = async () => {
      try {
        const response = await api.get("/admin/get-collectors", {
          params: appliedFilters,
        });

        setCollectors(response.data);
      } catch (error) {
        console.log("Failed to fetch users");
      }
    };
    setLoading(false);

    fetchUsers();
  }, [appliedFilters, setCollectors]);

  return (
    <div className="
      backdrop-blur-lg bg-white/40
      border border-white/50
      rounded-xl shadow-md
      p-4 md:p-6
      grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6
    ">
      
      <input
        type="text"
        placeholder="Search by name"
        className="px-4 py-2 rounded-md border focus:ring-2 focus:ring-green-500 outline-none"
        value={filters.name}
        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
      />

      <input
        type="email"
        placeholder="Search by email"
        className="px-4 py-2 rounded-md border focus:ring-2 focus:ring-green-500 outline-none"
        value={filters.email}
        onChange={(e) => setFilters({ ...filters, email: e.target.value })}
      />

      {/* <select
        className="px-4 py-2 rounded-md border focus:ring-2 focus:ring-green-500 outline-none"
        value={filters.zone}
        onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
      >
        <option value="">All Zones</option>
        <option value="North">North Zone</option>
        <option value="South">South Zone</option>
        <option value="East">East Zone</option>
        <option value="West">West Zone</option>
      </select> */}

      <select
        className="px-4 py-2 rounded-md border focus:ring-2 focus:ring-green-500 outline-none"
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <option value="">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="PENDING">Pending</option>
      </select>

        {/* Apply Filters */}
        <button
          onClick={() =>
            setAppliedFilters({
              name: filters.name.trim(),
              email: filters.email.trim(),
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
              email:"",
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
  );
}
