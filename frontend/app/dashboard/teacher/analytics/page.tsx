"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import {
  BarChart3,
  Users,
  BookOpen,
  ChevronRight,
  Loader2,
  AlertCircle,
  Search,
  Clock,
} from "lucide-react";

interface CourseAnalytics {
  id: string;
  title: string;
  teacherName: string;
  enrollmentCount: number;
  avgCompletion: number;
  enrolledStudentNames: string[];
}

interface StudentProgress {
  id: string;
  studentName: string;
  studentEmail: string;
  percentage: number;
  lecturesCompleted: string[];
  quizzesCompleted: string[];
  updatedAt: string;
}

const normalizeStudentProgress = (payload: unknown): StudentProgress[] => {
  if (Array.isArray(payload)) return payload;
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { progress?: unknown }).progress)
  ) {
    return (payload as { progress: StudentProgress[] }).progress;
  }
  return [];
};

export default function TeacherAnalyticsPage() {
  const [courses, setCourses] = useState<CourseAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await apiFetch("/progress/teacher/analytics");
        if (data.success) {
          setCourses(data.data || []);
          setError(null);
        } else {
          setError("Failed to load analytics.");
        }
      } catch (err) {
        setError("Unable to load analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const fetchCourseDetails = async (courseId: string) => {
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null);
      return;
    }

    setSelectedCourseId(courseId);
    setLoadingDetails(true);
    try {
      const data = await apiFetch(`/progress/courses/${courseId}/admin`);
      if (data.success) {
        setStudentProgress(normalizeStudentProgress(data.data));
      }
    } catch (err) {
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredCourses = (courses || []).filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      (c.title || "").toLowerCase().includes(q) ||
      (c.enrolledStudentNames || []).some((name) =>
        (name || "").toLowerCase().includes(q)
      )
    );
  });

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
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Error loading analytics</p>
            <p className="text-xs mt-1">{error}</p>
            <button
              className="mt-3 text-xs font-semibold inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 bg-white hover:bg-red-50"
              onClick={() => {
                setLoading(true);
                setError(null);
                setCourses([]);
                setSelectedCourseId(null);
                setStudentProgress([]);
                setLoadingDetails(false);
                setSearchQuery("");
                (async () => {
                  try {
                    const data = await apiFetch("/progress/teacher/analytics");
                    if (data.success) {
                      setCourses(data.data || []);
                    } else {
                      setError("Failed to load analytics.");
                    }
                  } catch (err) {
                    setError("Unable to load analytics. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 sm:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
            <BarChart3 className="h-6 w-6 text-brand sm:h-8 sm:w-8" />
            Course Analytics
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">
            See how your courses and students are progressing.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search courses or students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all hover:border-brand/30"
          >
            <div
            className="cursor-pointer p-4 sm:p-8 flex flex-col justify-between gap-6 md:flex-row md:items-center"
              onClick={() => fetchCourseDetails(course.id)}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {course.title}
                  </h3>
                  <p className="text-sm text-zinc-500 font-medium">
                    Enrollments: {course.enrollmentCount}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-8 md:grid-cols-3 md:gap-16">
                <div>
                  <p className="text-[10px] uppercase font-black text-zinc-400 tracking-widest mb-1">
                    Completion Rate
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {Math.round(course.avgCompletion || 0)}%
                      </span>
                    </div>
                    <div className="w-24 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand transition-all duration-500"
                        style={{ width: `${course.avgCompletion || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="hidden md:block">
                  <p className="text-[10px] uppercase font-black text-zinc-400 tracking-widest mb-1">
                    Overall Health
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                      course.avgCompletion > 60
                        ? "bg-green-100 text-green-600"
                        : course.avgCompletion > 30
                        ? "bg-amber-100 text-amber-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {course.avgCompletion > 60
                      ? "Healthy"
                      : course.avgCompletion > 30
                      ? "Monitor"
                      : "At Risk"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <ChevronRight
                  className={`h-5 w-5 text-zinc-300 transition-transform ${
                    selectedCourseId === course.id ? "rotate-90" : ""
                  }`}
                />
              </div>
            </div>

            {selectedCourseId === course.id && (
              <div className="animate-in slide-in-from-top-4 px-4 pb-4 duration-300 sm:px-8 sm:pb-8">
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold flex items-center gap-2">
                      <Users className="h-4 w-4 text-brand" />
                      Student Progress & Insights
                    </h4>
                  </div>

                  {loadingDetails ? (
                    <div className="flex py-10 justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-brand" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/30">
                          <tr>
                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest">
                              Student
                            </th>
                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest text-center">
                              Progress %
                            </th>
                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest text-center">
                              Quizzes Attempted
                            </th>
                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest text-center">
                              Quiz Performance
                            </th>
                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest text-right">
                              Last Activity
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {(studentProgress || []).map((sp) => {
                            const isAtRisk = sp.percentage < 40;
                            const lastActivity = new Date(sp.updatedAt);
                            const daysSince =
                              (Date.now() - lastActivity.getTime()) /
                              (1000 * 60 * 60 * 24);
                            const isInactive = daysSince > 7;

                            let performanceLabel = "Needs Data";
                            let performanceClass =
                              "bg-zinc-100 text-zinc-600";
                            if (sp.percentage >= 80) {
                              performanceLabel = "Strong";
                              performanceClass =
                                "bg-green-100 text-green-700";
                            } else if (sp.percentage >= 50) {
                              performanceLabel = "Average";
                              performanceClass =
                                "bg-amber-100 text-amber-700";
                            } else {
                              performanceLabel = "Weak";
                              performanceClass = "bg-red-100 text-red-700";
                            }

                            return (
                              <tr
                                key={sp.id}
                                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
                              >
                                <td className="px-6 py-4">
                                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                                    {sp.studentName}
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    {sp.studentEmail}
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-bold">
                                    {isAtRisk && (
                                      <span className="inline-flex rounded-full px-2 py-0.5 bg-red-100 text-red-700 uppercase">
                                        At Risk
                                      </span>
                                    )}
                                    {isInactive && (
                                      <span className="inline-flex rounded-full px-2 py-0.5 bg-zinc-100 text-zinc-600 uppercase">
                                        Inactive
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="font-black text-brand text-xs">
                                      {Math.round(sp.percentage)}%
                                    </span>
                                    <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                      <div
                                        className="h-full bg-brand"
                                        style={{
                                          width: `${sp.percentage}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {sp.quizzesCompleted?.length || 0}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${performanceClass}`}
                                  >
                                    {performanceLabel}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right text-zinc-500 font-medium">
                                  <div className="flex items-center justify-end gap-2 text-[11px]">
                                    <Clock className="h-3 w-3" />
                                    {lastActivity.toLocaleDateString()}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {(!studentProgress ||
                            studentProgress.length === 0) && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-6 py-12 text-center opacity-40"
                              >
                                <p className="text-sm font-medium">
                                  No progress records found for this course.
                                </p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredCourses.length === 0 && !loading && (
          <div className="py-20 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-zinc-200 mx-auto" />
            <p className="text-zinc-500 font-medium">
              No courses found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

