"use client";

import { useState, createContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Folder,
  Settings,
  LogOut,
  Menu,
  X,
  GitBranch,
  Clock,
  FolderSearch,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DashboardDndProvider } from "@/components/dashboard/dnd-provider";
import FolderTree from "@/components/dashboard/folder-tree";
import { useRepoStats, useUser } from "@/hooks/queries";
import { cn } from "@/lib/utils";

export const HeaderContext = createContext<{
  headerTitle: string;
  setHeaderTitle: (title: string) => void;
}>({
  headerTitle: "",
  setHeaderTitle: () => {},
});

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Folder, label: "Folders", href: "/dashboard/folders" },
  { icon: GitBranch, label: "Repositories", href: "/dashboard/repos" },
  { icon: FolderSearch, label: "Uncategorized", href: "/dashboard/uncategorized" },
  { icon: Clock, label: "Recents", href: "/dashboard/recents" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dynamicTitle, setDynamicTitle] = useState("");
  const pathname = usePathname();
  const { data: user } = useUser();
  const { data: repoStats } = useRepoStats();

  // "/dashboard" only matches exactly; other sections also match their sub-pages
  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const defaultTitle = navItems.find((item) => isActive(item.href))?.label;
  const headerTitle = dynamicTitle || defaultTitle;

  return (
    <HeaderContext.Provider
      value={{ headerTitle: dynamicTitle, setHeaderTitle: setDynamicTitle }}
    >
      <DashboardDndProvider>
      <div className="min-h-dvh bg-gray-50/50">
        {/* Mobile top bar */}
        <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 pt-[env(safe-area-inset-top)] md:hidden">
          <Logo href="/dashboard" />
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-sidebar"
            className="-mr-2 flex size-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          id="dashboard-sidebar"
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-out md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-14 items-center px-5">
            <Logo href="/dashboard" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <nav aria-label="Main" className="space-y-0.5">
            {navItems.map(({ icon: Icon, label, href }) => {
              const active = isActive(href);
              const badge =
                href === "/dashboard/uncategorized" ? repoStats?.uncategorized : undefined;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  <Icon className={cn("size-4", active ? "text-blue-600" : "text-gray-400")} />
                  {label}
                  {badge > 0 && (
                    <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs tabular-nums text-gray-600">
                      {badge.toLocaleString()}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <FolderTree onNavigate={() => setSidebarOpen(false)} />
          </div>

          <div className="border-t border-gray-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt=""
                  className="size-8 rounded-full outline outline-1 -outline-offset-1 outline-black/10"
                />
              ) : (
                <div className="size-8 rounded-full bg-gray-200" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user?.username ?? " "}
                </p>
                <p className="truncate text-xs text-gray-500">GitHub account</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
                className="flex size-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="pt-14 md:ml-64 md:pt-0">
          <div className="sticky top-0 z-20 hidden h-14 border-b border-gray-200 bg-white/90 backdrop-blur-sm md:block">
            <div className="mx-auto flex h-full max-w-7xl items-center px-8">
              <h1 className="truncate text-lg font-semibold text-gray-900">{headerTitle}</h1>
            </div>
          </div>
          <div className="px-4 py-6 md:px-8 md:py-8">
            {pathname !== "/dashboard" && (
              <h1 className="mb-4 text-xl font-semibold text-gray-900 md:hidden">{headerTitle}</h1>
            )}
            {children}
          </div>
        </main>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            aria-hidden
            className="fixed inset-0 z-40 bg-gray-900/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
      </DashboardDndProvider>
    </HeaderContext.Provider>
  );
}
