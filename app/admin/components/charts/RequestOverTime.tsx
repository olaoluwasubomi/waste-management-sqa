"use client";

import { useEffect, useState } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

interface RequestOverTimeResponse {
  year: number;
  data: number[];
}

export default function RequestOverTime() {
  const [requestData, setRequestData] =
    useState<RequestOverTimeResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/admin/dashboard/requests-over-time",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch request statistics");
        }

        const result: RequestOverTimeResponse =
          await response.json();

        setRequestData(result);
      } catch (error) {
        console.error("REQUEST OVER TIME FETCH ERROR:", error);

        setError("Unable to load request statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestData();
  }, []);

  const chartData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],

    datasets: [
      {
        label: "Pickup Requests",
        data: requestData?.data ?? Array(12).fill(0),
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.15)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#16a34a",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        callbacks: {
          label: (context: any) =>
            `${context.parsed.y} request${
              context.parsed.y === 1 ? "" : "s"
            }`,
        },
      },
    },

    scales: {
      y: {
        beginAtZero: true,

        ticks: {
          precision: 0,
          stepSize: 1,
        },

        grid: {
          color: "#e5e7eb",
        },
      },

      x: {
        grid: {
          display: false,
        },
      },
    },
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
      className="bg-white rounded-xl shadow-2xl p-5 h-[350px]"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          Requests Over Time
        </h3>

        {requestData && (
          <span className="text-sm text-gray-500">
            {requestData.year}
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-[270px] flex items-center justify-center">
          <p className="text-gray-500">
            Loading request data...
          </p>
        </div>
      ) : error ? (
        <div className="h-[270px] flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="h-[270px]">
          <Line data={chartData} options={options} />
        </div>
      )}
    </motion.div>
  );
}