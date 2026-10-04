"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface RecentRequest {
  id: string;
  user: string;
  wasteType: string;
  status: string;
  date: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-purple-100 text-purple-700",
    ASSIGNED: "bg-indigo-100 text-indigo-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELED: "bg-gray-100 text-gray-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        styles[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function RecentRequestsTable() {
  const [requests, setRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecentRequests = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/admin/dashboard/recent-requests",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch recent requests");
        }

        const data = await response.json();

        setRequests(data.requests);
      } catch (error) {
        console.error("RECENT REQUESTS FETCH ERROR:", error);

        setError("Unable to load recent requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentRequests();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{
        duration: 1.2,
        ease: "easeOut",
        delay: 0.3,
      }}
      className="bg-white rounded-xl shadow-md p-5 h-[350px] flex flex-col"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Recent Requests
      </h3>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">
              Loading recent requests...
            </p>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">
              No requests found.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-white z-10 border-b">
              <tr className="text-gray-500">
                <th className="py-2">User</th>
                <th className="py-2">Waste Type</th>
                <th className="py-2">Status</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className="border-b last:border-none hover:bg-gray-50"
                >
                  <td className="py-5 font-medium text-gray-800">
                    {request.user}
                  </td>

                  <td className="py-5">
                    {request.wasteType}
                  </td>

                  <td className="py-5">
                    <StatusBadge status={request.status} />
                  </td>

                  <td className="py-5 text-gray-500">
                    {formatDate(request.date)}
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