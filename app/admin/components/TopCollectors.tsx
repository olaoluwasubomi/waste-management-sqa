"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TopCollector {
  id: string;
  name: string;
  assigned: number;
  completed: number;
  inProgress: number;
}

export default function TopCollectorsTable() {
  const [collectors, setCollectors] = useState<TopCollector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTopCollectors = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/admin/dashboard/top-collectors",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch top collectors");
        }

        const data = await response.json();

        setCollectors(data.collectors);
      } catch (error) {
        console.error("TOP COLLECTORS FETCH ERROR:", error);

        setError("Unable to load top collectors.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopCollectors();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{
        duration: 1.2,
        ease: "easeOut",
        delay: 0.3,
      }}
      className="bg-white rounded-xl shadow-2xl p-5 h-[350px] flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          Top Collectors
        </h3>

        <span className="text-xs text-gray-500">
          By assigned requests
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">
              Loading top collectors...
            </p>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-red-500">
              {error}
            </p>
          </div>
        ) : collectors.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">
              No collector assignments found.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-white z-10 border-b">
              <tr className="text-gray-500">
                <th className="py-2">Collector</th>
                <th className="py-2 text-center">Assigned</th>
                <th className="py-2 text-center">Completed</th>
                <th className="py-2 text-center">In Progress</th>
              </tr>
            </thead>

            <tbody>
              {collectors.map((collector, index) => (
                <tr
                  key={collector.id}
                  className="border-b last:border-none hover:bg-gray-50"
                >
                  <td className="py-5 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      {/* <span className="text-xs font-semibold text-gray-400">
                        #{index + 1}
                      </span> */}

                      {collector.name}
                    </div>
                  </td>

                  <td className="py-5 text-center font-semibold">
                    {collector.assigned}
                  </td>

                  <td className="py-5 text-center">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {collector.completed}
                    </span>
                  </td>

                  <td className="py-5 text-center">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {collector.inProgress}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}