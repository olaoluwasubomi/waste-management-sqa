"use client";

import { useState, useEffect } from "react";
import CollectorFilters from "../collector-management/components/CollectorFilters";
import CollectorsTable, { Collector } from "../collector-management/components/CollectorTable";
import api from "@/lib/api";
import { useRefreshSignal } from "@/lib/useRefresh";

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useRefreshSignal();

  useEffect(() => {
    const getCollectors = async () => {
      try {
        const response = await api.get("/admin/get-collectors");
        setCollectors(response.data);
      } catch (error) {
        console.log("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    getCollectors();
  }, [refresh]);

  return (
    <div className="px-4">
      <div>
        <h2 className="text-3xl font-bold">Collector Management</h2>
        <p className="text-gray-500">
          Manage all registered collectors in the system
        </p>
      </div>

      <CollectorFilters setCollectors={setCollectors} />

      {loading ? (
        <p className="mt-10">Loading collectors...</p>
      ) : (
        <CollectorsTable data={collectors} />
      )}
    </div>
  );
}
