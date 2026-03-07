"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/app/lib/api";
import { toast } from "sonner";
import { BookOpen, Plus, Edit2, Trash2, Eye, Loader2, X, Check, Users, ClipboardList, AlertTriangle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  status: "published" | "draft" | "archived";
  createdAt: string;
}

interface CourseAnalytics {
  id: string;
  enrollmentCount: number;
  avgCompletion: number;
}

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, CourseAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchCourses = async () => {
    try {
      const [coursesData, analyticsData] = await Promise.all([
        apiFetch("/courses/teacher"),
        apiFetch("/progress/teacher/analytics"),
      ]);
      if (coursesData.success) {
        setCourses(Array.isArray(coursesData.courses) ? coursesData.courses : []);
      } else {
        setError(coursesData.message || "Failed to fetch courses");
      }
      if (analyticsData.success && Array.isArray(analyticsData.data)) {
        const map: Record<string, CourseAnalytics> = {};
        analyticsData.data.forEach((a: CourseAnalytics) => {
          map[a.id] = a;
        });
        setAnalyticsMap(map);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const totalStudents = useMemo(
    () =>
      courses.reduce((sum, c) => sum + (analyticsMap[c.id]?.enrollmentCount || 0), 0),
    [courses, analyticsMap]
  );
  const avgCompletion = useMemo(() => {
    const withData = courses.filter((c) => analyticsMap[c.id]);
    if (withData.length === 0) return 0;
    return (
      withData.reduce((sum, c) => sum + (analyticsMap[c.id]?.avgCompletion || 0), 0) /
      withData.length
    );
  }, [courses, analyticsMap]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCode || !newDesc) return;
    
    setIsCreating(true);
    try {
      const data = await apiFetch("/courses", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          code: newCode,
          description: newDesc,
        }),
      });
      if (data.success) {
        setCourses([...courses, data.course]);
        setShowCreate(false);
        setNewTitle("");
        setNewCode("");
        setNewDesc("");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? All lectures will be lost.")) return;
    
    try {
      const data = await apiFetch(`/courses/${courseId}`, {
        method: "DELETE",
      });
      if (data.success) {
        setCourses(courses.filter(c => c.id !== courseId));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  const handleStartEdit = (course: Course) => {
    setEditingId(course.id);
    setEditTitle(course.title);
    setEditCode(course.code);
    setEditDesc(course.description);
  };

  const handleUpdate = async (courseId: string) => {
    setIsUpdating(true);
    try {
      const data = await apiFetch(`/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editTitle,
          code: editCode,
          description: editDesc,
        }),
      });
      if (data.success) {
        setCourses(courses.map(c => c.id === courseId ? data.course : c));
        setEditingId(null);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update course");
    } finally {
      setIsUpdating(false);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">My Courses</h1>
          <p className="text-sm text-zinc-500">Manage your curriculum and lectures</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2 w-fit">
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? "Cancel" : "New Course"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-brand" />
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400">Total Students</p>
            <p className="text-xl font-bold">{totalStudents}</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-violet-500" />
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400">Courses</p>
            <p className="text-xl font-bold">{courses.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4 flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-amber-500" />
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-zinc-400">Avg. Completion</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold">{Math.round(avgCompletion)}%</p>
              <div className="flex-1 min-w-[60px] h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand"
                  style={{ width: `${avgCompletion}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="Course Title"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Code</label>
                <input
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="CS101"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <textarea
                required
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="Course description..."
                rows={3}
              />
            </div>
            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Course"}
            </Button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div key={course.id} className="group relative rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            {editingId === course.id ? (
              <div className="space-y-3">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-sm font-bold dark:border-zinc-700 dark:bg-zinc-800"
                />
                <input
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(course.id)} disabled={isUpdating} className="flex-1 h-8">
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    course.status === "published" ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                  }`}>
                    {course.status}
                  </span>
                </div>
                <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">{course.title}</h3>
                <p className="mb-3 text-xs font-medium text-zinc-500">{course.code}</p>

                {(() => {
                  const a = analyticsMap[course.id];
                  const pct = a?.avgCompletion ?? 0;
                  const atRisk = pct < 40;
                  return (
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase text-zinc-400">Avg Progress</span>
                        <span className={`text-xs font-bold ${atRisk ? "text-red-600" : pct >= 60 ? "text-green-600" : "text-amber-600"}`}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {atRisk && a?.enrollmentCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          At risk – low completion
                        </div>
                      )}
                    </div>
                  );
                })()}

                <p className="mb-6 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {course.description}
                </p>
                
                <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Link href={`/dashboard/teacher/courses/${course.id}`} className="flex-1 min-w-[80px]">
                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs font-bold h-9">
                      <Eye className="h-3 w-3" /> Lectures
                    </Button>
                  </Link>
                  <Link href={`/dashboard/teacher/courses/${course.id}?tab=students`}>
                    <Button variant="outline" size="sm" className="gap-2 text-xs font-bold h-9">
                      <Users className="h-3 w-3" /> Students
                    </Button>
                  </Link>
                  <Link href={`/dashboard/teacher/courses/${course.id}?tab=quizzes`}>
                    <Button variant="outline" size="sm" className="gap-2 text-xs font-bold h-9">
                      <ClipboardList className="h-3 w-3" /> Quiz Results
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => handleStartEdit(course)} className="h-9 w-9 p-0">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(course.id)} className="h-9 w-9 p-0 text-red-500 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {courses.length === 0 && !showCreate && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-800">
            <BookOpen className="mb-4 h-12 w-12 text-zinc-300" />
            <p className="text-lg font-medium text-zinc-500">No courses yet</p>
            <Button variant="ghost" onClick={() => setShowCreate(true)} className="text-brand font-semibold">Create your first course</Button>
          </div>
        )}
      </div>
    </div>
  );
}
