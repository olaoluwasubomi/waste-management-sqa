"use client";

import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  accentColor?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  accentColor = "border-green-500",
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-2xl py-10 px-10 flex items-center gap-4 border-l-4 ${accentColor}
      hover:shadow-lg transition`}
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
        {icon}
      </div>

      {/* Text */}
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
      </div>
    </div>
  );
}
