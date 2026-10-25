"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Settings,
  X,
} from "lucide-react";

import LogoutButton from "../onboarding/components/LogoutButton";
// import UserHeader from "./components/UserHeader";

const navLinks = [
  {
    href: "/user",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/user/myrequests",
    label: "My Requests",
    icon: ClipboardList,
  },
  {
    href: "/user/addresses",
    label: "Addresses",
    icon: MapPin,
  },
  {
    href: "/user/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.replace("/onboarding/login");
      return;
    }

    if (session.user.role !== "USER") {
      router.replace("/unauthorized");
      return;
    }

    if (session.user.mustChangePassword) {
      router.replace("/onboarding/change-password");
    }
  }, [session, status, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const fetchUserprofile = async () => {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      setUserProfile(data.user);
    };

    fetchUserprofile();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-green-100 border-t-green-700" />

          <p className="text-sm font-medium text-gray-500">
            Loading your account...
          </p>
        </div>
      </div>
    );
  }

  if (
    !session?.user ||
    session.user.role !== "USER" ||
    session.user.mustChangePassword
  ) {
    return null;
  }

  const user = userProfile?.firstName + " " + userProfile?.lastName;

  const initials =
    user
      ?.trim()
      .split(/\s+/)
      .map((name) => name.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-screen w-72 flex-col
          border-r border-gray-200 bg-white
          px-5 py-6 shadow-sm
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/user"
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            Eco<span className="text-green-700">Waste</span>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 lg:hidden"
          >
            <X size={21} />
          </button>
        </div>

        <div className="mt-8 rounded-2xl bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-700 text-base font-bold text-white">
              {initials}
            </div>

            <div className="min-w-0">
              <h2 className="truncate font-semibold text-gray-900">
                {user ?? "User"}
              </h2>

              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-green-700">
                Resident
              </p>
            </div>
          </div>
        </div>

        <nav
          aria-label="User navigation"
          className="mt-8 flex-1 space-y-2"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;

            const isActive =
              link.href === "/user"
                ? pathname === "/user"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`
                  flex items-center gap-3 rounded-xl px-4 py-3
                  text-sm font-medium transition
                  ${
                    isActive
                      ? "bg-green-700 text-white shadow-sm"
                      : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                  }
                `}
              >
                <Icon size={20} />

                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 pt-5">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        {/* <UserHeader onMenuClick={() => setSidebarOpen(true)} /> */}

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}