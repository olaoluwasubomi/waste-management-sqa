"use client";

import { useEffect, useState } from "react";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface RequestStatusResponse {
  statuses: {
    PENDING: number;
    APPROVED: number;
    ASSIGNED: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELED: number;
    REJECTED: number;
  };
}

export default function RequestStatusChart() {
  const [statusData, setStatusData] =
    useState<RequestStatusResponse["statuses"] | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/admin/dashboard/request-status",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch request status statistics"
          );
        }

        const data: RequestStatusResponse =
          await response.json();

        setStatusData(data.statuses);
      } catch (error) {
        console.error(
          "REQUEST STATUS FETCH ERROR:",
          error
        );

        setError(
          "Unable to load request status statistics."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStatusData();
  }, []);

  const data = {
    labels: [
      "Pending",
      "Approved",
      "Assigned",
      "In Progress",
      "Completed",
      "Canceled",
      "Rejected",
    ],

    datasets: [
      {
        data: [
          statusData?.PENDING ?? 0,
          statusData?.APPROVED ?? 0,
          statusData?.ASSIGNED ?? 0,
          statusData?.IN_PROGRESS ?? 0,
          statusData?.COMPLETED ?? 0,
          statusData?.CANCELED ?? 0,
          statusData?.REJECTED ?? 0,
        ],

        backgroundColor: [
          "#FACC15",
          "#C084FC",
          "#60A5FA",
          "#818CF8",
          "#4ADE80",
          "#F87171",
          "#FB7185",
        ],

        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: "70%",

    plugins: {
      legend: {
        position: "bottom" as const,

        labels: {
          boxWidth: 12,
          padding: 16,

          font: {
            size: 12,
          },
        },
      },

      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed;

            return `${context.label}: ${value} request${
              value === 1 ? "" : "s"
            }`;
          },
        },
      },
    },

    maintainAspectRatio: false,
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl p-5 h-[350px]">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Request Status Overview
      </h3>

      {loading ? (
        <div className="h-[230px] flex items-center justify-center">
          <p className="text-gray-500">
            Loading status data...
          </p>
        </div>
      ) : error ? (
        <div className="h-[230px] flex items-center justify-center">
          <p className="text-red-500">
            {error}
          </p>
        </div>
      ) : (
        <div className="h-[230px]">
          <Doughnut data={data} options={options} />
        </div>
      )}
    </div>
  );
}