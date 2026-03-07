"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/app/lib/api";
import { BookOpen, ChevronDown, ChevronRight, ClipboardList, Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  code?: string;
}

interface Lecture {
  id: string;
  title: string;
}

export default function TeacherAssignmentsHubPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [lecturesByCourse, setLecturesByCourse] = useState<Record<string, Lecture[]>>({});
  const [loadingLecturesByCourse, setLoadingLecturesByCourse] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await apiFetch("/courses/teacher");
        if (data.success) {
          setCourses(Array.isArray(data.courses) ? data.courses : []);
        } else {
          setCourses([]);
        }
      } catch (err) {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const toggleCourse = async (courseId: string) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
      return;
    }

    setExpandedCourseId(courseId);
    if (lecturesByCourse[courseId]) return;

    setLoadingLecturesByCourse((prev) => ({ ...prev, [courseId]: true }));
    try {
      const data = await apiFetch(`/lectures/courses/${courseId}`);
      const items = data.success && Array.isArray(data.data) ? data.data : [];
      setLecturesByCourse((prev) => ({ ...prev, [courseId]: items }));
    } catch (err) {
      setLecturesByCourse((prev) => ({ ...prev, [courseId]: [] }));
    } finally {
      setLoadingLecturesByCourse((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-brand/10 via-white to-cyan-50 dark:from-brand/20 dark:via-zinc-900 dark:to-zinc-900 p-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Assignments Workspace</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Open a lecture to create assignments and grade submissions.
        </p>
        <div className="mt-4 inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/70 px-3 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          {courses.length} course{courses.length === 1 ? "" : "s"} available
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 text-sm font-bold bg-zinc-50/80 dark:bg-zinc-900/50">
          Courses ({courses.length})
        </div>

        {courses.length === 0 ? (
          <div className="px-4 py-10 text-sm text-zinc-500 text-center">No courses found.</div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {courses.map((course) => {
              const isExpanded = expandedCourseId === course.id;
              const lectures = lecturesByCourse[course.id] || [];
              const loadingLectures = loadingLecturesByCourse[course.id];

              return (
                <div key={course.id}>
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-left transition-colors"
                    onClick={() => toggleCourse(course.id)}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-brand" />
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{course.title}</p>
                        {course.code && (
                          <p className="text-xs text-zinc-500">{course.code}</p>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      {loadingLectures ? (
                        <div className="flex items-center gap-2 text-sm text-zinc-500 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading lectures...
                        </div>
                      ) : lectures.length === 0 ? (
                        <p className="text-sm text-zinc-500 py-2">No lectures in this course.</p>
                      ) : (
                        <div className="space-y-2">
                          {lectures.map((lecture) => (
                            <div
                              key={lecture.id}
                              className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 flex items-center justify-between gap-3 bg-white dark:bg-zinc-900/60 hover:border-brand/40 transition-colors"
                            >
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">{lecture.title}</p>
                                <p className="text-xs text-zinc-500">Lecture assignments and grading</p>
                              </div>
                              <Link
                                href={`/dashboard/teacher/lectures/${lecture.id}/assignments?courseId=${course.id}`}
                                className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:opacity-90 shadow-sm shadow-brand/25"
                              >
                                <ClipboardList className="h-3.5 w-3.5" />
                                Manage
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
