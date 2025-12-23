"use client";
import React from "react";
import {
  LayoutDashboard,
  Users,
  History,
  Settings,
  LogIn,
  X,
  Moon,
  Sun,
  Filter,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
  handleLogout: () => void;
  companyName: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  darkMode,
  setDarkMode,
  handleLogout,
  companyName,
}: SidebarProps) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { id: "leads", label: "Lead Manager", icon: <Filter size={20} /> }, // ✅ NEW TAB
    { id: "clients", label: "Clients", icon: <Users size={20} /> },
    { id: "history", label: "History", icon: <History size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-50 w-64 card-base border-r border-[var(--border)] transform transition-transform duration-200 ease-in-out ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 flex flex-col`}
    >
      <div className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">{companyName}</h1>
        <button
          className="md:hidden text-sub"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X size={24} />
        </button>
      </div>

      <nav className="px-4 space-y-2 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors capitalize ${
              activeTab === item.id
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                : "text-sub hover:bg-[var(--bg-main)]"
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border)] space-y-2">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-sub hover:bg-[var(--bg-main)] transition-colors"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-sub hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogIn className="rotate-180" size={20} /> Logout
        </button>
      </div>
    </aside>
  );
}
