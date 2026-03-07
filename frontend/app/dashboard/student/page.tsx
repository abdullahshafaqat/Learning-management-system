"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { BookOpen, CheckCircle2, Clock, BarChart3, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";

interface EnrolledCourse {
  id: string;
  title: string;
  progress?: number;
  enrollmentCount?: number;
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [avgProgress, setAvgProgress] = useState(0);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const enrollRes = await apiFetch("/enrollments/student/enrollments");
        if (enrollRes.success && Array.isArray(enrollRes.enrollments)) {
          const enrolledCourses = enrollRes.enrollments.map((e: any) => ({
            id: e.course?._id || e.courseId,
            title: e.course?.title || "Untitled Course",
            progress: 0,
          }));
          setEnrolledCount(enrolledCourses.length);

          let totalProgress = 0;
          let completed = 0;

          await Promise.all(
            enrolledCourses.map(async (course: EnrolledCourse) => {
              const progressRes = await apiFetch(`/progress/courses/${course.id}`);
              if (progressRes.success && progressRes.data) {
                const courseProgress = progressRes.data.percentage || 0;
                course.progress = courseProgress;
                totalProgress += courseProgress;
                if (courseProgress >= 100) {
                  completed++;
                }
              }
            })
          );

          setCompletedCount(completed);
          setAvgProgress(
            enrolledCourses.length > 0
              ? Math.round(totalProgress / enrolledCourses.length)
              : 0
          );
          setCourses(enrolledCourses.slice(0, 3));
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
          Welcome, Student
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400 max-w-2xl">
          Your learning journey continues here. Access your courses and track your progress.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-brand" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wide">
              Enrolled Courses
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {enrolledCount}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wide">
              Completed
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {completedCount}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wide">
              Avg Progress
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {avgProgress}%
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-8 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
          <BookOpen className="h-5 w-5 text-brand" />
          My Learning Path
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard/student/my-courses">
            <Button variant="primary" className="gap-2 font-semibold">
              <BookOpen className="h-4 w-4" />
              View My Courses
            </Button>
          </Link>
          <Link href="/dashboard/student/courses">
            <Button variant="outline" className="gap-2 font-semibold">
              <BarChart3 className="h-4 w-4" />
              Explore Catalog
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {courses.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 tracking-wide mb-3">
              Recent Progress
            </p>
            <div className="space-y-3">
              {courses.map((c) => (
                <Link key={c.id} href={`/dashboard/student/courses/${c.id}`}>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800 px-4 py-3 hover:border-brand/30 transition-colors cursor-pointer">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {c.title}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand transition-all"
                          style={{ width: `${c.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 w-10">
                        {Math.round(c.progress || 0)}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
