"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Unauthorized() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 4000); // auto-redirect after 4 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-6">
      <h1 className="text-3xl font-bold text-red-600 mb-4">
        You are not authorized to access this page.
      </h1>

      <p className="text-gray-700 mb-6">
        You’ll be redirected shortly. If not, click the button below.
      </p>

      <button
        onClick={() => router.push("/")}
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition"
      >
        Return to Homepage
      </button>
    </div>
  );
}
