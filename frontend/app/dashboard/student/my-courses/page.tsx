"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { BookOpen, ArrowRight, Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  instructorName?: string;
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyCourses = async () => {
    try {
      const data = await apiFetch("/enrollments/student/enrollments");
      if (data.success && Array.isArray(data.enrollments)) {
        const mapped: Course[] = data.enrollments.map((e: any) => ({
          id: e.course?._id,
          title: e.course?.title || "Untitled Course",
          description: e.course?.description || "",
          instructorName: e.course?.teacher?.username,
        }));
        setCourses(mapped);
        setError(null);
      } else {
        setError("Failed to load your courses.");
      }
    } catch (err) {
      setError("Unable to load your courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-bold text-sm">Error loading your courses</p>
          <p className="text-xs mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 text-xs font-semibold"
            onClick={() => {
              setLoading(true);
              setError(null);
              setCourses([]);
              fetchMyCourses();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            My Learning
          </h1>
          <p className="text-sm text-zinc-500">
            Track your progress and continue learning
          </p>
        </div>
        <Link href="/dashboard/student/courses">
          <Button variant="outline" size="sm">
            Browse Catalog
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <PlayCircle className="h-6 w-6" />
              </div>
            </div>
            <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {course.title}
            </h3>
            <p className="mb-6 line-clamp-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
              {course.description || "No description provided."}
            </p>

            <Link href={`/dashboard/student/courses/${course.id}`}>
              <Button className="w-full gap-2 font-bold group-hover:bg-brand">
                Continue Learning
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
              <BookOpen className="h-8 w-8 text-zinc-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              No active courses
            </h2>
            <p className="mb-6 text-sm text-zinc-500">
              You haven't enrolled in any courses yet.
            </p>
            <Link href="/dashboard/student/courses">
              <Button>Browse Catalog</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
