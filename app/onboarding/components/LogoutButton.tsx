"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    await signOut({
      callbackUrl: "/onboarding/login", // where to go after logout
      redirect: true,
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-red-600 hover:text-red-700 font-medium"
    >
      {loading ? "Logging out..." : "Log Out"}
    </button>
  );
}
