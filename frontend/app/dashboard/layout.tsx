"use client";

import { useAuth } from "@/app/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  User as UserIcon
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: `/dashboard/${user.role}` },
    { name: "My Courses", icon: BookOpen, href: "#" },
    { name: "Profile", icon: UserIcon, href: "#" },
    { name: "Settings", icon: Settings, href: "#" },
  ];

  if (user.role === "admin") {
    navItems.splice(2, 0, { name: "Users", icon: Users, href: "/dashboard/admin/users" });
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 transition-transform duration-300 transform lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col p-6">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                <span className="text-xl font-bold italic">A</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Premium <span className="text-brand">LMS</span>
              </span>
            </div>
            <button
              className="lg:hidden p-2 text-zinc-500"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-brand text-white shadow-md shadow-brand/20"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "group-hover:text-brand")} />
                  {item.name}
                </a>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="mb-6 flex items-center gap-3 p-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-brand">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">{user.username}</span>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{user.role}</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-red-500 border-zinc-200 dark:border-zinc-800 hover:bg-red-50 hover:text-red-600"
              onClick={logout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button
                className="p-2 text-zinc-500"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-zinc-500 hover:text-brand">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-brand" />
            </button>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 font-bold dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {user.username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-zinc-50 p-8 dark:bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}
