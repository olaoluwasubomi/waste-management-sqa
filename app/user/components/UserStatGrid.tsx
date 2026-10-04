"use client";

import { motion } from "framer-motion";
import { ClipboardList, CheckCircle, MapPin } from "lucide-react";
import StatCard from "@/app/admin/components/StatCard";

interface UserStatGridProps {
  activeRequests: number;
  completedRequests: number;
  addressCount: number;
}

export default function UserStatGrid({
  activeRequests,
  completedRequests,
  addressCount,
}: UserStatGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >
        <StatCard
          title="Active Requests"
          value={activeRequests}
          icon={<ClipboardList className="text-purple-600 w-6 h-6" />}
          accentColor="border-purple-500"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      >
        <StatCard
          title="Completed Pickups"
          value={completedRequests}
          icon={<CheckCircle className="text-green-600 w-6 h-6" />}
          accentColor="border-green-500"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
      >
        <StatCard
          title="Saved Addresses"
          value={addressCount}
          icon={<MapPin className="text-blue-600 w-6 h-6" />}
          accentColor="border-blue-500"
        />
      </motion.div>
    </div>
  );
}
