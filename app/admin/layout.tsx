// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import { useSession } from "next-auth/react";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import AdminNavigation from "./components/Navigation";
// import CreateUserModal from "./components/CreateUserModal";
// import CreateCollectorModal from "./components/CreateCollectorModal";
// import CreateWasteTypeModal from "./components/CreateWasteTypeModal";
// import userImage from "../../public/images/2149009406.jpg";
// import LogoutButton from "../onboarding/components/LogoutButton";

// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const { data: session, status } = useSession();
//   const router = useRouter();

//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [openCreateUser, setOpenCreateUser] = useState(false);
//   const [openCreateCollector, setOpenCreateCollector] = useState(false);
//   const [openCreateWaste, setOpenCreateWaste] = useState(false);

//   // 🔐 Redirect logic (runs AFTER render)
//   useEffect(() => {
//     if (status === "loading") return;

//     if (!session?.user) {
//       router.push("/onboarding/login");
//       return;
//     }

//     if (session.user.role !== "ADMIN") {
//       router.push("/unauthorized");
//       return;
//     }

//     if (session.user.mustChangePassword) {
//       router.push("/change-password");
//     }
//   }, [session, status, router]);

//   // 🧠 Render guards (runs BEFORE render)
//   if (status === "loading") {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-lg font-medium">
//         Loading admin panel...
//       </div>
//     );
//   }

//   if (!session?.user || session.user.role !== "ADMIN") {
//     return null; // prevents flicker before redirect
//   }

//   // Now TypeScript KNOWS session exists
//   const user = session.user;

//   return (
//     // <div className="flex h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-100 to-green-50">
//      <div className="flex h-screen overflow-hidden bg-black/10">
//       {/* MOBILE OVERLAY */}
//       {sidebarOpen && (
//         <div
//           onClick={() => setSidebarOpen(false)}
//           className="fixed inset-0 bg-black/40 z-30 lg:hidden"
//         />
//       )}

//       {/* SIDEBAR */}
//       <aside
//         className={`
//           fixed z-40 top-0 left-0 h-screen w-64
//           backdrop-blur-lg bg-white/30
//           border-r border-white/50 shadow-xl
//           px-6 py-6
//           transform transition-transform duration-300
//           ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
//           lg:translate-x-0
//         `}
//       >
//         <h3 className="text-2xl font-bold italic">EcoWaste</h3>

//         {/* USER INFO */}
//         <div className="mt-6">
//           <div className="relative w-24 h-24 rounded-full overflow-hidden">
//             <Image src={userImage} alt="User" fill className="object-cover" />
//           </div>

//           <h3 className="text-lg font-bold mt-3">{user.name}</h3>
//           <p className="text-sm uppercase tracking-wide text-gray-600">
//             {user.role}
//           </p>
//         </div>

//         {/* NAV LINKS */}
//         <nav className="mt-10 space-y-6 text-gray-700">
//           <Link href="/admin" className="block hover:text-green-700">
//             Dashboard
//           </Link>
//           <Link href="/admin/user-management" className="block hover:text-green-700">
//             User Management
//           </Link>
//           <Link href="/admin/collector-management" className="block hover:text-green-700">
//             Collector Management
//           </Link>
//           <Link href="/admin/waste-management" className="block hover:text-green-700">
//             Waste Management
//           </Link>
//           <Link href="/admin/settings" className="block hover:text-green-700">
//             Settings
//           </Link>
//         </nav>

//         <div className="absolute bottom-6">
//           {/* <Link href="/onboarding/login" className="text-red-600">
//             Log Out
//           </Link> */}
//           <LogoutButton />
//         </div>
//       </aside>

//       {/* MAIN CONTENT */}
//       <div className="flex-1 flex flex-col lg:ml-64">
//         <AdminNavigation
//           onMenuClick={() => setSidebarOpen(!sidebarOpen)}
//           onCreateUser={() => setOpenCreateUser(true)}
//           onCreateCollector={() => setOpenCreateCollector(true)}
//           onCreateWaste = {() => setOpenCreateWaste(true)}
//         />

//         <CreateUserModal open={openCreateUser} setOpen={setOpenCreateUser} />
//         <CreateCollectorModal open={openCreateCollector} setOpen={setOpenCreateCollector} />
//         <CreateWasteTypeModal open={openCreateWaste} setOpen={setOpenCreateWaste} />
//         <main className="flex-1 overflow-y-auto px-4 md:px-6 xl:px-10 py-6">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }



"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminNavigation from "./components/Navigation";
import CreateUserModal from "./components/CreateUserModal";
import CreateCollectorModal from "./components/CreateCollectorModal";
import CreateWasteTypeModal from "./components/CreateWasteTypeModal";
import LogoutButton from "../onboarding/components/LogoutButton";

import {
  AdminProfileProvider,
  useAdminProfile,
} from "./context/AdminProfileContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.replace("/onboarding/login");
      return;
    }

    if (session.user.role !== "ADMIN") {
      router.replace("/unauthorized");
      return;
    }

    if (session.user.mustChangePassword) {
      router.replace("/change-password");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-lg font-medium">
        Loading admin panel...
      </div>
    );
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <AdminProfileProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProfileProvider>
  );
}

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isLoadingProfile, profileError } =
    useAdminProfile();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [openCreateCollector, setOpenCreateCollector] =
    useState(false);
  const [openCreateWaste, setOpenCreateWaste] = useState(false);

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "Admin User";

  const profileImage =
    profile?.image || "/images/2149009406.jpg";

  return (
    <div className="flex h-screen overflow-hidden bg-black/10">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-screen w-64
          border-r border-white/50 bg-white/30
          px-6 py-6 shadow-xl backdrop-blur-lg
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <h3 className="text-2xl font-bold italic">
          EcoWaste
        </h3>

        {/* USER PROFILE */}
        <div className="mt-6">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-200">
            {isLoadingProfile ? (
              <div className="h-full w-full animate-pulse bg-gray-300" />
            ) : (
              <Image
                src={profileImage}
                alt={fullName}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized={profileImage.startsWith("data:")}
              />
            )}
          </div>

          <h3 className="mt-3 text-lg font-bold">
            {isLoadingProfile ? "Loading..." : fullName}
          </h3>

          <p className="text-sm uppercase tracking-wide text-gray-600">
            {profile?.role || "ADMIN"}
          </p>

          {profileError && (
            <p className="mt-2 text-xs text-red-600">
              Unable to load profile details.
            </p>
          )}
        </div>

        {/* NAV LINKS */}
        <nav className="mt-10 space-y-6 text-gray-700">
          <Link
            href="/admin"
            className="block hover:text-green-700"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/user-management"
            className="block hover:text-green-700"
          >
            User Management
          </Link>

          <Link
            href="/admin/collector-management"
            className="block hover:text-green-700"
          >
            Collector Management
          </Link>

          <Link
            href="/admin/request-management"
            className="block hover:text-green-700"
          >
            Request Management
          </Link>

          <Link
            href="/admin/waste-management"
            className="block hover:text-green-700"
          >
            Waste Management
          </Link>

      
          <Link
            href="/admin/settings"
            className="block hover:text-green-700"
          >
            Settings
          </Link>
        </nav>

        <div className="absolute bottom-6">
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <AdminNavigation
          onMenuClick={() =>
            setSidebarOpen((previous) => !previous)
          }
          onCreateUser={() => setOpenCreateUser(true)}
          onCreateCollector={() =>
            setOpenCreateCollector(true)
          }
          onCreateWaste={() => setOpenCreateWaste(true)}
        />

        <CreateUserModal
          open={openCreateUser}
          setOpen={setOpenCreateUser}
        />

        <CreateCollectorModal
          open={openCreateCollector}
          setOpen={setOpenCreateCollector}
        />

        <CreateWasteTypeModal
          open={openCreateWaste}
          setOpen={setOpenCreateWaste}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 xl:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}