"use client";

import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import { Truck, ClipboardList, FileText } from "lucide-react";
import api from "@/lib/api";

type Stats = {
  totalWastesCategory: number;
  activeWastesCategory: number;
  inactiveWastesCategory: number;
};

export default function WasteStats({refreshKey} : {refreshKey:number}) {
  const [stats, setStats] = useState<Stats>({
    totalWastesCategory: 0,
    activeWastesCategory: 0,
    inactiveWastesCategory: 0,
  });

  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/wastes-stats");
      setStats(res.data);
    } catch (error) {
      console.log("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  return (
    <div className="grid grid-cols-3 gap-4 mt-4">

      <StatCard
        title="Total Waste Types"
        value={loading ? "..." : stats.totalWastesCategory}
        icon={<Truck className="text-green-600 w-6 h-6" />}
        accentColor="border-green-500"
      />

      <StatCard
        title="Active Wastes"
        value={loading ? "..." : stats.activeWastesCategory}
        icon={<FileText className="text-blue-600 w-6 h-6" />}
        accentColor="border-blue-500"
      />

      <StatCard
        title="Inactive Wastes"
        value={loading ? "..." : stats.inactiveWastesCategory}
        icon={<ClipboardList className="text-red-600 w-6 h-6" />}
        accentColor="border-red-500"
      />

    </div>
  );
}