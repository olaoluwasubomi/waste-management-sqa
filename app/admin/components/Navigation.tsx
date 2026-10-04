"use client";

import { IoMdMenu, IoMdNotifications } from "react-icons/io";
import { IoSettingsSharp } from "react-icons/io5";
import { useState, useRef, useEffect } from "react";

interface NavigationProps {
  onMenuClick: () => void;
  onCreateUser: () => void;
  onCreateCollector: () => void;
  onCreateWaste: () => void;
}

export default function AdminNavigation({ onMenuClick, onCreateUser, onCreateCollector, onCreateWaste }: NavigationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      {/* LEFT */}
      <div className="flex items-center gap-4">
        {/* Hamburger: visible on sm & md, hidden on lg+ */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-800 hover:text-green-700 transition"
        >
          <IoMdMenu className="text-3xl md:text-4xl" />
        </button>

        {/* Create New Button */}
        <div className="relative hidden sm:block" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="
              bg-green-600 hover:bg-green-700
              text-white text-sm md:text-base
              px-4 md:px-5 py-2
              rounded-lg font-medium
              shadow-md transition
            "
          >
            Create new
          </button>

          {isDropdownOpen && (
            <div
              className="
                absolute left-0 mt-2 w-56
                rounded-lg bg-white shadow-xl
                border border-gray-200
                overflow-hidden
              "
            >
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onCreateUser();
                }}
                className="w-full text-left px-4 py-3 hover:bg-green-50 hover:text-green-700 transition"
              >
                New User
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onCreateCollector();
                }}
                className="w-full text-left px-4 py-3 hover:bg-green-50 hover:text-green-700 transition"
              >
                New Collector
              </button>

              <button
              onClick={() => {
                setIsDropdownOpen(false);
                onCreateWaste();
              }}
                className="w-full text-left px-4 py-3 hover:bg-green-50 hover:text-green-700 transition"
              >
                New Waste Category
              </button>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 md:gap-5">
        <IoMdNotifications className="text-2xl md:text-3xl cursor-pointer" />
        <IoSettingsSharp className="text-2xl md:text-3xl cursor-pointer" />
      </div>
    </header>
  );
}
