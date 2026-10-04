"use client";

import { useState } from "react";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/forgot_password", { email });

      toast.success(response.data.message || "If the email exists, a reset link has been sent");

      // Optional: redirect after delay
      setTimeout(() => {
        router.push("/onboarding/login");
      }, 3000);

    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow-lg rounded-xl p-6 space-y-6"
      >
        <h2 className="text-2xl font-bold text-center">Forgot Password</h2>

        <p className="text-sm text-gray-600 text-center">
          Enter your email and we’ll send you a link to reset your password.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 border rounded-xl outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p
          onClick={() => router.push("/onboarding/login")}
          className="text-center text-green-700 hover:underline cursor-pointer"
        >
          Back to login
        </p>
      </form>
    </div>
  );
}
