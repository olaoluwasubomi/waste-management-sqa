"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/onboarding/login");
    }
  }, [status]);

  if (status === "loading") return null;

  return <>{children}</>;
}
