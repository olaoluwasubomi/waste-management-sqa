"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import StatCard from "./StatCard";
import { motion } from "framer-motion";
import { Users,Truck,ClipboardList,FileText,} from "lucide-react";
import { useRefreshSignal } from "@/lib/useRefresh";

export default function StatsGrid() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCollectors: 0,
    totalRequests:0,
    pendingUsers: 0,
  });
  const refresh = useRefreshSignal();

  useEffect(() => {
    const getStats = async () => {
      try {
        const response = await api.get("/admin/stats");
        setStats(response.data);
      } catch (error) {
        console.log("Failed to load stats")
      }
    };
    getStats();
  }, [refresh])
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 px-4">

      <motion.div
        initial={{opacity: 0, y: -50}}
        whileInView={{ opacity:1, y: 0 }}
        viewport={{ once:false, amount:0.3 }}
        transition={{ duration: 1.2, ease:"easeOut", delay:1 }}
      >
        <StatCard
          title="Total Residents"
          value={stats.totalUsers}
          icon={<Users className="text-green-600 w-6 h-6" />}
          accentColor="border-green-500"
        />
      </motion.div>


      <motion.div
        initial={{opacity: 0, y: -50}}
        whileInView={{ opacity:1, y: 0 }}
        viewport={{ once:false, amount:0.3 }}
        transition={{ duration: 1.2, ease:"easeOut", delay:1.6 }}
      >
        <StatCard
          title="Total Collectors"
          value={stats.totalCollectors}
          icon={<Truck className="text-blue-600 w-6 h-6" />}
          accentColor="border-blue-500"
        />
      </motion.div>

      <motion.div
        initial={{opacity: 0, y: -50}}
        whileInView={{ opacity:1, y: 0 }}
        viewport={{ once:false, amount:0.3 }}
        transition={{ duration: 1.2, ease:"easeOut", delay:2.2 }}
      >
        <StatCard
          title="Total Requests"
          value={stats.totalRequests}
          icon={<ClipboardList className="text-purple-600 w-6 h-6" />}
          accentColor="border-purple-500"
        />
      </motion.div>

      <motion.div
        initial={{opacity: 0, y: -50}}
        whileInView={{ opacity:1, y: 0 }}
        viewport={{ once:false, amount:0.3 }}
        transition={{ duration: 1.2, ease:"easeOut", delay:2.8 }}
      >
        <StatCard
          title="Pending Users"
          value={stats.pendingUsers}
          icon={<FileText className="text-orange-500 w-6 h-6" />}
          accentColor="border-orange-500"
      />
      </motion.div>
   
    </div>
  );
}
