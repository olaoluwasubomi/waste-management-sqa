"use client";
import { usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export default function OnboardingLayout({children} : {children: React.ReactNode}) {
    const pathname = usePathname();
    const py = pathname.includes("login") ? "py-6 md:py-20 lg:py-10 xl:py-16" : pathname.includes("signup") ? "xl:py-6 lg:py-10 md:py-10 py-6" : "py-6";
    return (
        <div className={`w-full min-h-screen ${py} bg-black/10`}>
            <div className="xl:w-1/4 lg:w-1/3 md:w-1/2 w-full bg-transparent rounded-xl py-0 px-0 z-10 relative mx-auto">
                {children}
                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </div>
    )
}