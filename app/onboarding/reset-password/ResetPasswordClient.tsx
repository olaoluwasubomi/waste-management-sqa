"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import api from "@/lib/api";
import { motion } from "framer-motion";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!token) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        Invalid or missing token.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await api.post("/reset_password", {
        token,
        password,
        confirmPassword, 
      });

      if (response.status === 200) {
        toast.success("Password updated successfully!");
        setTimeout(() => router.push("/onboarding/login"), 2000);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="rounded-2xl shadow-2xl w-full max-w-md mx-auto mt-16 bg-white"
    >
      <div className="px-4 py-6">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Reset Your Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-md"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-medium"
          >
            Reset Password
          </button>
        </form>
      </div>
    </motion.div>
  );
}
