"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import Image from "next/image";

/**
 * This matches the API response from:
 * /api/admin/collectors
 */
export interface Collector {
  id: string;
  name: string;
  email: string;
  zone: string;
  completed: number;
  rating: number;
  status: "ACTIVE" | "PENDING";
  avatar: string;
}

interface Props {
  data: Collector[];
}

export default function CollectorsTable({ data }: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="backdrop-blur-lg bg-white/40 border border-white/50 rounded-xl shadow-md overflow-x-auto mt-10">
      <table className="w-full text-left">
        {/* HEADER */}
        <thead className="bg-white/60 text-gray-700 text-sm uppercase">
          <tr>
            <th className="px-6 py-4">Collector</th>
            <th className="px-6 py-4">Zone</th>
            <th className="px-6 py-4">Completed</th>
            <th className="px-6 py-4">Rating</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-10 text-gray-500">
                No collectors found
              </td>
            </tr>
          ) : (
            data.map((collector) => (
              <tr
                key={collector.id}
                className="border-t hover:bg-green-50/40 transition"
              >
                {/* NAME + AVATAR */}
                <td className="px-6 py-4 flex items-center gap-4">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={collector.avatar}
                      alt="avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{collector.name}</p>
                    <p className="text-sm text-gray-500">{collector.email}</p>
                  </div>
                </td>

                {/* ZONE */}
                <td className="px-6 py-4">{collector.zone}</td>

                {/* COMPLETED JOBS */}
                <td className="px-6 py-4">{collector.completed}</td>

                {/* RATING */}
                <td className="px-6 py-4">
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                    ⭐ {collector.rating}
                  </span>
                </td>

                {/* STATUS */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      collector.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {collector.status}
                  </span>
                </td>

                {/* ACTION MENU */}
                <td className="px-6 py-4 text-right relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === collector.id ? null : collector.id
                      )
                    }
                    className="p-2 hover:bg-gray-200 rounded-full transition"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openMenuId === collector.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-6 mt-2 w-44 bg-white border rounded-lg shadow-lg z-50"
                    >
                      <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                        View Collector
                      </button>

                      <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                        Reset Password
                      </button>

                      <button className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">
                        Suspend Collector
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
