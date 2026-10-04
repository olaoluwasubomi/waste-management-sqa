"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export interface RecentRequest {
  id: string;
  wasteType: string;
  status: string;
  address: string;
  date: string;
}

interface RecentRequestsProps {
  requests: RecentRequest[];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    ASSIGNED: "bg-indigo-100 text-indigo-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        styles[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RecentRequests({ requests }: RecentRequestsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
      className="bg-white rounded-xl shadow-md p-5 h-[350px] flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Recent Requests
        </h3>
        {requests.length > 0 && (
          <Link
            href="/user/myrequests"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View all
          </Link>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <p className="text-gray-500 text-sm">No pickup requests yet.</p>
          <Link
            href="/user/myrequests/newrequests"
            className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Schedule your first pickup
          </Link>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-white z-10 border-b">
              <tr className="text-gray-500">
                <th className="py-2">Waste Type</th>
                <th className="py-2">Address</th>
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
                  <td className="py-4 font-medium text-gray-800">
                    {request.wasteType}
                  </td>
                  <td className="py-4 text-gray-600">{request.address}</td>
                  <td className="py-4">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="py-4 text-gray-500">
                    {formatDate(request.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
