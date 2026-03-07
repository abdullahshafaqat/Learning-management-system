"use client";

import { useAuth } from "@/app/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Users, Settings, LogOut, Menu, X, Bell, User as UserIcon, ShieldCheck, ClipboardList, ClipboardCheck, BarChart3 } from "lucide-react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 1024;
  });

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

  const coursesHref =
    user.role === "admin"
      ? "/dashboard/admin/courses"
      : user.role === "teacher"
      ? "/dashboard/teacher/courses"
      : "/dashboard/student/my-courses";

  const coursesLabel = user.role === "student" ? "My Courses" : "Courses";

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: `/dashboard/${user.role}` },
    { name: coursesLabel, icon: BookOpen, href: coursesHref },
    { name: "Profile", icon: UserIcon, href: "/dashboard/profile" },
    { name: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  if (user.role === "admin") {
    navItems.splice(2, 0, { name: "Users", icon: Users, href: "/dashboard/admin/users" });
    navItems.splice(3, 0, { name: "Enrollments", icon: ShieldCheck, href: "/dashboard/admin/enrollments" });
    navItems.splice(4, 0, { name: "Analytics", icon: BarChart3, href: "/dashboard/admin/analytics" });
  }

  if (user.role === "teacher") {
    navItems.splice(2, 0, { name: "Analytics", icon: BarChart3, href: "/dashboard/teacher/analytics" });
    navItems.splice(3, 0, { name: "Assignments", icon: ClipboardList, href: "/dashboard/teacher/assignments" });
  }

  if (user.role === "student") {
    navItems.splice(2, 0, { name: "Course Catalog", icon: Users, href: "/dashboard/student/courses" });
    navItems.splice(3, 0, { name: "Assignments", icon: ClipboardCheck, href: "/dashboard/student/assignments" });
  }

  return (
    <div className="relative flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[84vw] max-w-72 border-r border-zinc-200 bg-white transition-transform duration-300 transform dark:border-zinc-800 dark:bg-zinc-900 lg:relative lg:w-64 lg:max-w-none lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col p-4 sm:p-6">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                <span className="text-xl font-bold italic">A</span>
              </div>
              <span className="hidden text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:block">
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
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4 sm:py-3",
                    isActive
                      ? "bg-brand text-white shadow-md shadow-brand/20"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "group-hover:text-brand")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="mb-6 flex items-center gap-3 p-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-brand">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-40">{user.username}</span>
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

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button
                className="p-2 text-zinc-500"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 sm:text-lg">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative hidden p-2 text-zinc-500 hover:text-brand sm:block">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-brand" />
            </button>
            <div className="mx-2 hidden h-8 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" />
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 font-bold dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {user.username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-zinc-50 p-3 sm:p-5 lg:p-8 dark:bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}
