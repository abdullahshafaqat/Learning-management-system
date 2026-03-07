"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { 
  BarChart3, Users, BookOpen, 
  ChevronRight, Loader2, AlertCircle, 
  Search, ShieldCheck, GraduationCap,
  Clock, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface CourseAnalytics {
  id: string;
  title: string;
  teacherName: string;
  enrollmentCount: number;
  avgCompletion: number;
  avgQuizScore?: number;
  enrolledStudentNames: string[];
  assignmentCount?: number;
}

interface StudentProgress {
  id: string;
  studentName: string;
  studentEmail: string;
  percentage: number;
  lecturesCompleted: string[];
  quizzesCompleted: string[];
  assignmentsSubmitted?: string[];
  updatedAt: string;
}

interface CourseDetails {
  progress: StudentProgress[];
  assignmentCount: number;
}

export default function AdminAnalyticsPage() {
  const [courses, setCourses] = useState<CourseAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [courseAssignmentCount, setCourseAssignmentCount] = useState<number | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await apiFetch("/progress/admin/analytics");
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
        const details: CourseDetails = data.data;
        setStudentProgress(details.progress || []);
        setCourseAssignmentCount(details.assignmentCount ?? 0);
      }
    } catch (err) {
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredCourses = (courses || []).filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    
    return (
      (c.title || "").toLowerCase().includes(q) || 
      (c.teacherName || "").toLowerCase().includes(q) ||
      (c.enrolledStudentNames || []).some(name => (name || "").toLowerCase().includes(q))
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
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs font-semibold"
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
                    const data = await apiFetch("/progress/admin/analytics");
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
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 sm:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900 sm:text-4xl dark:text-zinc-100">
            <div className="p-2 rounded-xl bg-brand/10">
              <BarChart3 className="h-6 w-6 text-brand sm:h-8 sm:w-8" />
            </div>
            Analytics Dashboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium">Monitor course performance, student progress, and submission status across all courses.</p>
        </div>
        
        <div className="flex gap-4 flex-wrap">
          <div className="px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 uppercase font-bold">Total Courses</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{filteredCourses.length}</p>
          </div>
          <div className="px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 uppercase font-bold">Total Students</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{filteredCourses.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0)}</p>
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input 
          type="text" 
          placeholder="Search courses or teachers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredCourses.map((course) => (
          <div 
            key={course.id} 
            className="group relative bg-linear-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:border-brand/50 hover:-translate-y-0.5"
          >
            <div 
            className="cursor-pointer p-4 sm:p-8 flex flex-col justify-between gap-6 md:flex-row md:items-center"
              onClick={() => fetchCourseDetails(course.id)}
            >
              <div className="flex items-center gap-6 flex-1">
                <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-brand/20 to-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand transition-colors">{course.title}</h3>
                  <p className="text-sm text-zinc-500 font-medium flex items-center gap-2">
                    {course.teacherName}
                    {course.assignmentCount !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600">
                        {course.assignmentCount === 0 ? "No assignments" : `${course.assignmentCount} assignment${course.assignmentCount > 1 ? "s" : ""}`}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 md:gap-8">
                <div className="flex flex-col items-start">
                  <p className="text-[9px] uppercase font-black text-zinc-400 tracking-widest mb-2">Students</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand" />
                    <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{course.enrollmentCount}</span>
                  </div>
                </div>

                <div className="flex flex-col items-start">
                  <p className="text-[9px] uppercase font-black text-zinc-400 tracking-widest mb-2">Avg. Progress</p>
                  <div className="flex flex-col gap-1 w-24">
                    <span className="font-bold text-lg text-brand">{Math.round(course.avgCompletion || 0)}%</span>
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-linear-to-r from-brand to-blue-500 transition-all duration-500" 
                        style={{ width: `${course.avgCompletion || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start">
                  <p className="text-[9px] uppercase font-black text-zinc-400 tracking-widest mb-2">Quiz Score</p>
                  <div className="text-lg font-bold">
                    {course.avgQuizScore ? (
                      <span className="text-zinc-900 dark:text-zinc-100">{Math.round(course.avgQuizScore)}%</span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] uppercase font-black text-zinc-400 tracking-widest mb-2">Status</p>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${
                    (course.avgCompletion > 60) 
                      ? "bg-green-100 text-green-600" 
                      : (course.avgCompletion > 30)
                        ? "bg-amber-100 text-amber-600"
                        : "bg-red-100 text-red-600"
                  }`}>
                    {course.avgCompletion > 60 ? "✓ Healthy" : course.avgCompletion > 30 ? "⚠ Monitor" : "⛔ At Risk"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ChevronRight className={`h-5 w-5 text-zinc-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all ${selectedCourseId === course.id ? "rotate-90" : ""}`} />
              </div>
            </div>

            {selectedCourseId === course.id && (
              <div className="animate-in slide-in-from-top-4 px-4 pb-4 duration-300 sm:px-8 sm:pb-8">
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold flex items-center gap-2">
                      <Users className="h-4 w-4 text-brand" />
                      Student Engagement Details
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
                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest">Student</th>
                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest text-center">Progress %</th>
                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest text-center">Quiz Status</th>
                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest text-center">Assignment Status</th>
                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest text-right">Last Activity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {(studentProgress || []).map((sp) => (
                            <tr key={sp.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                              <td className="px-6 py-4">
                                <p className="font-bold text-zinc-900 dark:text-zinc-100">{sp.studentName}</p>
                                <p className="text-xs text-zinc-500">{sp.studentEmail}</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-black text-brand text-xs">{Math.round(sp.percentage)}%</span>
                                  <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                    <div className="h-full bg-brand" style={{ width: `${sp.percentage}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div
                                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold ${
                                    !sp.quizzesCompleted?.length
                                      ? "bg-zinc-100 text-zinc-500"
                                      : sp.quizzesCompleted.length > 0
                                      ? "bg-green-100 text-green-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {!sp.quizzesCompleted?.length
                                    ? "Not Attempted"
                                    : `${sp.quizzesCompleted.length} Completed`}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div
                                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold ${
                                    courseAssignmentCount !== null && courseAssignmentCount === 0
                                      ? "bg-zinc-100 text-zinc-500"
                                      : !sp.assignmentsSubmitted?.length
                                      ? "bg-zinc-100 text-zinc-500"
                                      : sp.assignmentsSubmitted.length > 0
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                      {
                                    courseAssignmentCount !== null && courseAssignmentCount === 0
                                      ? "No assignments"
                                      : !sp.assignmentsSubmitted?.length
                                      ? "Not Submitted"
                                      : `${sp.assignmentsSubmitted.length} Submitted`
                                  }
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right text-zinc-500 font-medium">
                                <div className="flex items-center justify-end gap-2 text-[11px]">
                                  <Clock className="h-3 w-3" />
                                  {new Date(sp.updatedAt).toLocaleDateString()}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {(!studentProgress || studentProgress.length === 0) && (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center opacity-40">
                                <p className="text-sm font-medium">No progress records found for this course.</p>
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
             <p className="text-zinc-500 font-medium">No courses found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
