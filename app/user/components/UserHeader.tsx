"use client";

import Link from "next/link";
import { IoMdMenu } from "react-icons/io";
import { IoSettingsSharp } from "react-icons/io5";

interface UserHeaderProps {
  onMenuClick: () => void;
}

export default function UserHeader({ onMenuClick }: UserHeaderProps) {
  return (
    <header
      className="
        sticky top-0 z-30 w-full
        backdrop-blur-lg bg-white/30
        border-b border-white/50
        shadow-md
        px-4 md:px-6 xl:px-10
        py-3
        flex items-center justify-between
      "
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-800 hover:text-green-700 transition"
        >
          <IoMdMenu className="text-3xl md:text-4xl" />
        </button>

        <Link
          href="/user/request"
          className="
            bg-green-600 hover:bg-green-700
            text-white text-sm md:text-base
            px-4 md:px-5 py-2
            rounded-lg font-medium
            shadow-md transition
          "
        >
          Request Pickup
        </Link>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <Link href="/user/settings" className="text-gray-800 hover:text-green-700">
          <IoSettingsSharp className="text-2xl md:text-3xl" />
        </Link>
      </div>
    </header>
  );
}
