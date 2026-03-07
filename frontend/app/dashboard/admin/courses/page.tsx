"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/app/lib/api";
import { BookOpen, Edit2, Trash2, Check, X, Loader2, Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  status: "published" | "draft";
  instructorName?: string;
  createdAt: string;
}

type SortKey = "title" | "instructorName" | "createdAt";
type SortDir = "asc" | "desc";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchCourses = async () => {
    try {
      const data = await apiFetch("/admin/courses");
      if (data.success) {
        setCourses(Array.isArray(data.data) ? data.data : []);
      } else {
        setCourses([]);
        setError(data.message || "Failed to fetch courses");
      }
    } catch (err) {
      setCourses([]);
      setError("An unexpected error occurred while fetching courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = courses.filter(
      (c) =>
        !search.trim() ||
        (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.instructorName || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      const aVal = String((a as any)[sortKey] ?? "");
      const bVal = String((b as any)[sortKey] ?? "");
      const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [courses, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else setSortKey(key);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    
    setProcessingId(courseId);
    try {
      const data = await apiFetch(`/courses/${courseId}`, {
        method: "DELETE",
      });
      if (data.success) {
        setCourses(courses.filter(c => c.id !== courseId));
      }
    } catch (err) {
    } finally {
      setProcessingId(null);
    }
  };

  const handleStartEdit = (course: Course) => {
    setEditingId(course.id);
    setEditTitle(course.title);
  };

  const handleSaveEdit = async (courseId: string) => {
    if (!editTitle.trim()) return;
    
    setProcessingId(courseId);
    try {
      const data = await apiFetch(`/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify({ title: editTitle }),
      });
      if (data.success) {
        setCourses(courses.map(c => c.id === courseId ? { ...c, title: editTitle } : c));
        setEditingId(null);
      }
    } catch (err) {
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
        <p className="font-bold">Error loading courses</p>
        <p className="text-sm">{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchCourses}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Course Overview</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-zinc-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand" />
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400">Total Courses</p>
              <p className="text-lg font-bold">{courses?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th
                className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => toggleSort("title")}
              >
                Course Title {sortKey === "title" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => toggleSort("instructorName")}
              >
                Teacher {sortKey === "instructorName" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">Description</th>
              <th className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">Status</th>
              <th
                className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => toggleSort("createdAt")}
              >
                Date {sortKey === "createdAt" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredAndSorted.map((course) => (
              <tr key={course.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4">
                  {editingId === course.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="rounded-lg border border-zinc-200 px-3 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand/50"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveEdit(course.id)}
                        disabled={processingId === course.id}
                        className="text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        disabled={processingId === course.id}
                        className="text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{course.title}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-medium">
                  {course.instructorName || "Unknown"}
                </td>
                <td className="px-6 py-4">
                  <div className="text-zinc-600 dark:text-zinc-400 text-xs line-clamp-1 max-w-[200px]">
                    {course.description || "No description provided"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider",
                    course.status === "published" ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800"
                  )}>
                    {course.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-500 text-xs">
                  {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleStartEdit(course)}
                      disabled={processingId !== null}
                      className="p-1.5 text-zinc-500 hover:text-brand transition-colors disabled:opacity-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      disabled={processingId !== null}
                      className="p-1.5 text-zinc-500 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredAndSorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-zinc-500 text-sm">
                  {search.trim() ? "No courses match your search." : "No courses found yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
