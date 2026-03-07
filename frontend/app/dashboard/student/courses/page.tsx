"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { toast } from "sonner";
import { BookOpen, User as UserIcon, PlusCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface Course {
  id: string;
  title: string;
  description: string;
  instructorName?: string;
  status: string;
}

export default function CourseCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const courseData = await apiFetch("/courses?published=true");
      if (courseData.success) {
        setCourses(Array.isArray(courseData.data) ? courseData.data : []);
        setError(null);
      } else {
        setCourses([]);
        setError("Failed to load courses.");
      }

      const enrollData = await apiFetch("/enrollments/student/enrollments");
      if (enrollData.success && Array.isArray(enrollData.enrollments)) {
        const ids = new Set<string>(enrollData.enrollments.map((e: any) => e.course?._id as string));
        setEnrolledIds(ids);
      }
    } catch (err) {
      setCourses([]);
      setError("Unable to load course catalog. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async (courseId: string) => {
    setProcessingId(courseId);
    try {
      const data = await apiFetch(`/enrollments/courses/${courseId}/enroll`, {
        method: "POST",
      });
      if (data.success) {
        setEnrolledIds(prev => new Set(prev).add(courseId));
      } else {
        toast.error(data.error || "Enrollment failed");
      }
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "An error occurred during enrollment");
    } finally {
      setProcessingId(null);
    }
  };

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
          <p className="font-bold text-sm">Error loading catalog</p>
          <p className="text-xs mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 text-xs font-semibold"
            onClick={() => {
              setLoading(true);
              setError(null);
              setCourses([]);
              setEnrolledIds(new Set());
              fetchData();
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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Course Catalog</h1>
          <p className="text-sm text-zinc-500">Explore and enroll in available courses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div key={course.id} className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-md">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">{course.title}</h3>
            <div className="mb-4 flex items-center gap-2 text-xs text-zinc-500">
              <UserIcon className="h-3 w-3" />
              <span>{course.instructorName || "Platform Instructor"}</span>
            </div>
            <p className="mb-6 line-clamp-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
              {course.description || "No description provided for this course."}
            </p>
            
            <Button 
              onClick={() => handleEnroll(course.id)}
              disabled={enrolledIds.has(course.id) || processingId === course.id}
              variant={enrolledIds.has(course.id) ? "outline" : "primary"}
              className="w-full gap-2 font-bold"
            >
              {enrolledIds.has(course.id) ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Enrolled
                </>
              ) : processingId === course.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Enroll Now
                </>
              )}
            </Button>
          </div>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
            <p className="text-zinc-500">No courses are currently available for enrollment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
