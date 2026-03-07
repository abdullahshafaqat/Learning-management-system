"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import {
  Users,
  BookOpen,
  ClipboardList,
  FileCheck,
  Loader2,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";

interface CourseAnalytics {
  id: string;
  title: string;
  enrollmentCount: number;
  avgCompletion: number;
  assignmentCount?: number;
}

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [totalLectures, setTotalLectures] = useState(0);
  const [courses, setCourses] = useState<CourseAnalytics[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const analyticsRes = await apiFetch("/progress/teacher/analytics");
        if (!analyticsRes.success || !Array.isArray(analyticsRes.data)) {
          setLoading(false);
          return;
        }

        const analytics: CourseAnalytics[] = analyticsRes.data;
        setCourses(analytics);
        setTotalCourses(analytics.length);
        setTotalStudents(
          analytics.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0)
        );

        let lectures = 0;
        let quizzes = 0;
        await Promise.all(
          analytics.map(async (c) => {
            const [lecRes, quizRes] = await Promise.all([
              apiFetch(`/lectures/courses/${c.id}`),
              apiFetch(`/quizzes/courses/${c.id}`),
            ]);
            if (lecRes.success && Array.isArray(lecRes.data)) {
              lectures += lecRes.data.length;
            }
            if (quizRes.success && Array.isArray(quizRes.data)) {
              quizzes += quizRes.data.length;
            }
          })
        );
        setTotalLectures(lectures);
        setTotalQuizzes(quizzes);
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
          Welcome, Teacher
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400 max-w-2xl">
          Your workspace for creating impactful learning experiences. Monitor your
          courses and student engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-brand" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wide">
              Total Students
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalStudents}
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
              {totalCourses}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wide">
              Total Quizzes
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalQuizzes}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <FileCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wide">
              Total Lectures
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalLectures}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-8 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-brand" />
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard/teacher/courses">
            <Button variant="outline" className="gap-2 font-semibold">
              <BookOpen className="h-4 w-4" />
              Manage Courses
            </Button>
          </Link>
          <Link href="/dashboard/teacher/analytics">
            <Button variant="outline" className="gap-2 font-semibold">
              <BarChart3 className="h-4 w-4" />
              View Analytics
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {courses.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wide mb-3">
              Course Health Overview
            </p>
            <div className="space-y-3">
              {courses.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800 px-4 py-3"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {c.title}
                  </span>
                  {c.assignmentCount !== undefined && (
                    <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600">
                      {c.assignmentCount === 0 ? "No assignments" : `${c.assignmentCount} assign${c.assignmentCount > 1 ? "s" : ""}`}
                    </span>
                  )}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand transition-all"
                        style={{ width: `${c.avgCompletion || 0}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-bold w-10 ${
                        (c.avgCompletion || 0) >= 60
                          ? "text-green-600"
                          : (c.avgCompletion || 0) >= 30
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {Math.round(c.avgCompletion || 0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
