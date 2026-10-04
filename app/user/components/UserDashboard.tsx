"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import AdminPageHeader from "@/app/admin/components/AdminHeader";
import ProfileBanner from "./ProfileBanner";
import UserStatGrid from "./UserStatGrid";
import RecentRequests, { RecentRequest } from "./RecentRequests";
import { useRouter } from "next/navigation";

interface DashboardData {
  stats: {
    activeRequests: number;
    completedRequests: number;
    addressCount: number;
    hasAddress: boolean;
  };
  recentRequests: RecentRequest[];
}


export default function UserDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/user/dashboard");
        setData(response.data);
      } catch (error) {
        console.error("Failed to load dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/admin/settings");
        setFirstName(response.data.user.firstName);
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };

    fetchProfile();
  }, []);

  // const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  const stats = data?.stats ?? {
    activeRequests: 0,
    completedRequests: 0,
    addressCount: 0,
    hasAddress: false,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Manage your waste pickups and track request status from here."
        buttonLabel="Request Pickup"
        onButtonClick={() => router.push("/user/myrequests/newrequests")}
      />

      <ProfileBanner hasAddress={stats.hasAddress} />

      <UserStatGrid
        activeRequests={stats.activeRequests}
        completedRequests={stats.completedRequests}
        addressCount={stats.addressCount}
      />

      <RecentRequests requests={data?.recentRequests ?? []} />
    </div>
  );
}
