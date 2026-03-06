"use client";

import { useState, createContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Folder,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Zap,
} from "lucide-react";

export const HeaderContext = createContext<{
  headerTitle: string;
  setHeaderTitle: (title: string) => void;
}>({
  headerTitle: "",
  setHeaderTitle: () => {},
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dynamicTitle, setDynamicTitle] = useState("");
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Folder, label: "Folders", href: "/dashboard/folders" },
    { icon: Zap, label: "Repositories", href: "/dashboard/repos" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const defaultTitle = navItems.find((item) => item.href === pathname)?.label;
  const headerTitle = dynamicTitle || defaultTitle;

  return (
    <HeaderContext.Provider
      value={{ headerTitle: dynamicTitle, setHeaderTitle: setDynamicTitle }}
    >
      <div className="min-h-screen bg-white">
        {/* Mobile Menu Button */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="font-bold text-gray-900">RepoFolders</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 transition-all duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 md:block pt-4 z-50`}
        >
          <div className="flex items-center gap-3 px-6 mb-8 mt-2 md:mt-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="font-bold text-gray-900">RepoFolders</span>
          </div>

          <nav className="space-y-2 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                >
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      active
                        ? "bg-blue-100 text-blue-600 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-3">
            <Button
              variant="outline"
              className="w-full hidden border-gray-300 text-gray-900 hover:bg-gray-50"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Workspace
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-gray-600 hover:text-red-600"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="md:ml-64 pt-16 md:pt-0 relative">
          <div className="w-full h-14 border-b border-gray-200 sticky top-0 z-10 bg-white">
            <div className="max-w-7xl mx-auto flex items-center h-full px-4 md:px-8 2xl:px-0">
              <h1 className="text-3xl font-bold text-gray-900">
                {headerTitle}
              </h1>
            </div>
          </div>
          <div className="p-4 md:pt-0 md:p-8">{children}</div>
        </main>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </HeaderContext.Provider>
  );
}
