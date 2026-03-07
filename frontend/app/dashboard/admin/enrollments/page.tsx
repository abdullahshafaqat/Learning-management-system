"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/app/lib/api";
import { toast } from "sonner";
import { 
  Users, BookOpen, Calendar, 
  Plus, Loader2, AlertCircle, 
  ShieldCheck, UserPlus, Search
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  studentId: string;
  courseId: string;
  student: {
    username: string;
    email: string;
  };
  course: {
    title: string;
    code: string;
  };
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface Course {
  id: string;
  title: string;
  code: string;
}

export default function AdminEnrollmentManagementPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"student" | "course" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchData = async () => {
    try {
      const [enrollmentsData, usersData, coursesData] = await Promise.all([
        apiFetch("/enrollments"),
        apiFetch("/admin/users"),
        apiFetch("/admin/courses")
      ]);

      if (enrollmentsData.success) setEnrollments(enrollmentsData.enrollments);
      if (usersData.success) {
        setTotalUsers(usersData.users?.length ?? 0);
        setStudents(usersData.users.filter((u: User) => u.role === "student"));
      }
      if (coursesData.success) {
        setCourses(coursesData.data || coursesData.courses || []);
      }
    } catch (err) {
      setError("Unable to load enrollments or related data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = (enrollments || []).filter(
      (e) =>
        !search.trim() ||
        (e.student?.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.student?.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.course?.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.course?.code || "").toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "student") {
        cmp = (a.student?.username || "").localeCompare(b.student?.username || "", undefined, { sensitivity: "base" });
      } else if (sortKey === "course") {
        cmp = (a.course?.title || "").localeCompare(b.course?.title || "", undefined, { sensitivity: "base" });
      } else {
        cmp = new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [enrollments, search, sortKey, sortDir]);

  const toggleSort = (key: "student" | "course" | "date") => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else setSortKey(key);
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCourseId) return;

    setIsSubmitting(true);
    try {
      const data = await apiFetch("/enrollments/admin/enroll", {
        method: "POST",
        body: JSON.stringify({
          studentId: selectedStudentId,
          courseId: selectedCourseId
        })
      });

      if (data.success) {
        toast.success("Student enrolled successfully!");
        setSelectedStudentId("");
        setSelectedCourseId("");
        fetchData();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to enroll student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (studentId: string, courseId: string) => {
    if (!studentId || !courseId) {
      toast.error("Error: Missing Student ID or Course ID for removal.");
      return;
    }
    
    if (!confirm("Are you sure you want to remove this enrollment? This action is irreversible.")) return;

    try {
      const data = await apiFetch("/enrollments/admin/remove", {
        method: "POST",
        body: JSON.stringify({ studentId, courseId })
      });

      if (data.success) {
        toast.success("Student removed from course");
        fetchData();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove enrollment");
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
          <p className="font-bold text-sm">Error loading enrollments</p>
          <p className="text-xs mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 text-xs font-semibold"
            onClick={() => {
              setLoading(true);
              setError(null);
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
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-brand" />
            Enrollment Control Panel
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">Platform-wide enrollment management and manual overrides.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-brand" />
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400">Total Users</p>
              <p className="text-xl font-bold">{totalUsers}</p>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-brand" />
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400">Total Courses</p>
              <p className="text-xl font-bold">{(courses || []).length}</p>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4 flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-brand" />
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400">Enrollments</p>
              <p className="text-xl font-bold">{(enrollments || []).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
           <Plus className="h-5 w-5 text-brand" />
           <h2 className="text-lg font-bold">Manual Enrollment Override</h2>
        </div>
        
        <form onSubmit={handleEnroll} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-zinc-400 ml-1">Select Student</label>
            <select 
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
              required
            >
              <option value="">Choose a student...</option>
              {(students || []).map(s => (
                <option key={s.id} value={s.id}>{s.username} ({s.email})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-zinc-400 ml-1">Select Course</label>
            <select 
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
              required
            >
              <option value="">Choose a course...</option>
              {(courses || []).map(c => (
                <option key={c.id} value={c.id}>{c.title} [{c.code}]</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button 
               type="submit" 
               disabled={isSubmitting || !selectedStudentId || !selectedCourseId}
               className="w-full h-[46px] font-bold"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Enrollment"}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
           <h2 className="text-lg font-bold">Platform Enrollments</h2>
           <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
             <input
               type="text"
               placeholder="Search student or course..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th
                  className="px-8 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => toggleSort("student")}
                >
                  Student {sortKey === "student" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-8 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => toggleSort("course")}
                >
                  Course {sortKey === "course" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-8 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => toggleSort("date")}
                >
                  Enrolled Date {sortKey === "date" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-8 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredAndSorted.map((e) => (
                <tr
                  key={e.id}
                  className={cn(
                    "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group",
                    e.status !== "active" && "bg-amber-50/50 dark:bg-amber-900/10"
                  )}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Users className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{e.student?.username}</p>
                        <p className="text-xs text-zinc-500">{e.student?.email}</p>
                        {e.status !== "active" && (
                          <span className="inline-flex mt-1 text-[10px] font-black uppercase text-amber-600 dark:text-amber-500">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-violet-500" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{e.course?.title}</p>
                        <p className="text-xs text-violet-500 font-medium">#{e.course?.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-zinc-500 font-medium">
                    <div className="flex items-center gap-2">
                       <Calendar className="h-4 w-4 opacity-50" />
                       {new Date(e.enrolledAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRemove(e.studentId, e.courseId)}
                      className="text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 border-red-100 opacity-0 group-hover:opacity-100"
                    >
                      Remove Access
                    </Button>
                  </td>
                </tr>
              ))}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-70">
                       <AlertCircle className="h-12 w-12 text-zinc-400" />
                       <p className="font-medium text-lg text-zinc-600 dark:text-zinc-400">
                         {search.trim() ? "No enrollments match your search." : "No platform enrollments found."}
                       </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
