"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { Users, BookOpen, UserCheck, Activity, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const usersRes = await apiFetch("/admin/users");
        const coursesRes = await apiFetch("/admin/courses");
        const enrollRes = await apiFetch("/enrollments");

        if (usersRes.success && Array.isArray(usersRes.users)) {
          setStats((prev) => ({
            ...prev,
            totalUsers: usersRes.users.length,
            activeUsers: usersRes.users.filter(
              (u: any) => !u.isBlocked && u.role !== "admin"
            ).length,
          }));
        }

        if (coursesRes.success && Array.isArray(coursesRes.data)) {
          setStats((prev) => ({
            ...prev,
            totalCourses: coursesRes.data.length,
          }));
        }

        if (enrollRes.success && Array.isArray(enrollRes.enrollments)) {
          setStats((prev) => ({
            ...prev,
            totalEnrollments: enrollRes.enrollments.length,
          }));
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Administrator Dashboard
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400 max-w-2xl">
          Your command center for platform oversight. Monitor system health and manage all resources.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-brand" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wide">
              Total Users
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.totalUsers}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wide">
              Total Courses
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.totalCourses}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wide">
              Active Users
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.activeUsers}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wide">
              Enrollments
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.totalEnrollments}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-8 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-brand" />
          Platform Management
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/admin/users">
            <Button variant="primary" className="gap-2 font-semibold">
              <Users className="h-4 w-4" />
              Manage Users
            </Button>
          </Link>
          <Link href="/dashboard/admin/courses">
            <Button variant="outline" className="gap-2 font-semibold">
              <BookOpen className="h-4 w-4" />
              Manage Courses
            </Button>
          </Link>
          <Link href="/dashboard/admin/enrollments">
            <Button variant="outline" className="gap-2 font-semibold">
              <UserCheck className="h-4 w-4" />
              Manage Enrollments
            </Button>
          </Link>
          <Link href="/dashboard/admin/analytics">
            <Button variant="outline" className="gap-2 font-semibold">
              <Activity className="h-4 w-4" />
              View Analytics
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200">System Health Notice</h3>
            <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
              All systems operational. Regular backups are configured and running.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
