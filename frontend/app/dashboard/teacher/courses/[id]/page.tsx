"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/app/lib/api";
import { toast } from "sonner";
import {
  FileVideo,
  FileAudio,
  FileText,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  Loader2,
  Upload,
  Check,
  X,
  Users,
  Clock,
  HelpCircle,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

interface Lecture {
  id: string;
  title: string;
  mediaType: string;
  isPublished: boolean;
  isPreview: boolean;
  fileUrl: string;
}

interface Course {
  id: string;
  title: string;
  code?: string;
  status?: "published" | "draft" | "archived";
  description?: string;
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

interface Quiz {
  id: string;
  title: string;
  lectureId: string;
  questions?: { question: string; options: string[] }[];
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

export default function TeacherCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const searchParams = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"lectures" | "quizzes" | "students">("lectures");

  useEffect(() => {
    if (tabParam === "students" || tabParam === "quizzes") {
      setActiveTab(tabParam);
    } else if (tabParam === "lectures") {
      setActiveTab("lectures");
    }
  }, [tabParam]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseData = await apiFetch(`/courses/teacher`);
        if (courseData.success) {
          const found = courseData.courses.find((c: any) => c.id === courseId);
          if (found) setCourse(found);
        }

        const lectureData = await apiFetch(`/lectures/courses/${courseId}`);
        if (lectureData.success) {
          setLectures(Array.isArray(lectureData.data) ? lectureData.data : []);
        }

        setLoadingQuizzes(true);
        try {
          const quizData = await apiFetch(`/quizzes/courses/${courseId}`);
          if (quizData.success) {
            setQuizzes(quizData.data || []);
          } else {
            setQuizzes([]);
          }
        } catch (err) {
          setQuizzes([]);
        } finally {
          setLoadingQuizzes(false);
        }

        setLoadingStudents(true);
        try {
          const progressData = await apiFetch(`/progress/courses/${courseId}/admin`);
          if (progressData.success) {
            setStudentProgress(normalizeStudentProgress(progressData.data));
          } else {
            setStudentProgress([]);
          }
        } catch (err) {
          setStudentProgress([]);
        } finally {
          setLoadingStudents(false);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) return;

    setIsAdding(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("isPublished", String(isPublished));
    formData.append("isPreview", String(isPreview));
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/lectures/courses/${courseId}`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        setLectures([...lectures, data.lecture]);
        setShowAdd(false);
        setTitle("");
        setFile(null);
      } else {
        toast.error(data.error || "Failed to add lecture");
      }
    } catch (err) {
      toast.error("An error occurred while uploading. Please check the backend connection.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (lectureId: string) => {
    if (!confirm("Are you sure you want to delete this lecture?")) return;
    try {
      const data = await apiFetch(`/lectures/${lectureId}`, {
        method: "DELETE",
      });
      if (data.success) {
        setLectures(lectures.filter((l) => l.id !== lectureId));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete lecture");
    }
  };

  const handleUpdate = async (lectureId: string) => {
    if (!editTitle.trim()) return;
    setIsUpdating(true);
    try {
      const data = await apiFetch(`/lectures/${lectureId}`, {
        method: "PUT",
        body: JSON.stringify({ title: editTitle }),
      });
      if (data.success) {
        setLectures(
          lectures.map((l) =>
            l.id === lectureId ? { ...l, title: editTitle } : l,
          ),
        );
        setEditingId(null);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update lecture");
    } finally {
      setIsUpdating(false);
    }
  };

  const getIcon = (type: string) => {
    if (type.includes("video")) return <FileVideo className="h-5 w-5" />;
    if (type.includes("audio")) return <FileAudio className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const totalStudents = studentProgress.length;
  const avgCompletion =
    totalStudents > 0
      ? studentProgress.reduce((sum, sp) => sum + (sp.percentage || 0), 0) /
        totalStudents
      : 0;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/teacher/courses"
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {course?.title || "Course Workspace"}
          </h1>
          <p className="text-sm text-zinc-500">
            Central place to manage lectures and monitor student progress
          </p>
        </div>
        {activeTab === "lectures" && (
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
            {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAdd ? "Cancel" : "Add Lecture"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
            Status
          </p>
          <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
            {course?.status || "draft"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
            Enrolled Students
          </p>
          <p className="mt-1 font-bold text-zinc-900 dark:text-zinc-100">
            {totalStudents}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
            Avg. Completion
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {Math.round(avgCompletion) || 0}%
            </span>
            <div className="w-24 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand"
                style={{ width: `${avgCompletion || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-4 text-sm font-semibold">
          <button
            className={`pb-2 border-b-2 ${
              activeTab === "lectures"
                ? "border-brand text-brand"
                : "border-transparent text-zinc-500"
            }`}
            onClick={() => setActiveTab("lectures")}
          >
            Lectures
          </button>
          <button
            className={`pb-2 border-b-2 ${
              activeTab === "quizzes"
                ? "border-brand text-brand"
                : "border-transparent text-zinc-500"
            }`}
            onClick={() => setActiveTab("quizzes")}
          >
            Quizzes
          </button>
          <button
            className={`pb-2 border-b-2 ${
              activeTab === "students"
                ? "border-brand text-brand"
                : "border-transparent text-zinc-500"
            }`}
            onClick={() => setActiveTab("students")}
          >
            Students & Progress
          </button>
        </div>
      </div>

      {activeTab === "lectures" && (
        <>
          {showAdd && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <form onSubmit={handleAddLecture} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Lecture Title</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
                    placeholder="e.g. Introduction to Calculus"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="rounded"
                    />
                    Published
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPreview}
                      onChange={(e) => setIsPreview(e.target.checked)}
                      className="rounded"
                    />
                    Preview Mode
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-600 block">
                    Select File (Video, Audio, PDF, etc.)
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-200 border-dashed rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-800">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-zinc-400" />
                        <p className="mb-2 text-sm text-zinc-500">
                          <span className="font-semibold">
                            {file ? file.name : "Click to upload"}
                          </span>
                        </p>
                        <p className="text-xs text-zinc-400">Max size 100MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        required
                        onChange={(e) =>
                          setFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>
                </div>

                <Button type="submit" disabled={isAdding} className="w-full">
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Upload Lecture"
                  )}
                </Button>
              </form>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                    Lecture Name
                  </th>
                  <th className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                    Type
                  </th>
                  <th className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 text-center">
                    Status
                  </th>
                  <th className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {lectures.map((lecture) => (
                  <tr
                    key={lecture.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {editingId === lecture.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="rounded border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdate(lecture.id)}
                            disabled={isUpdating}
                            className="text-green-600"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-zinc-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {lecture.title}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                        {getIcon(lecture.mediaType)}
                        <span className="text-xs uppercase font-medium">
                          {lecture.mediaType.split("/")[1] || lecture.mediaType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          lecture.isPublished
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                        }`}
                      >
                        {lecture.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-3">
                        <Link
                          href={`/dashboard/teacher/courses/${courseId}/lectures/${lecture.id}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-[10px] font-bold h-8"
                          >
                            Manage Quiz
                          </Button>
                        </Link>
                        <Link
                          href={`/dashboard/teacher/lectures/${lecture.id}/assignments?courseId=${courseId}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-[10px] font-bold h-8"
                          >
                            Assignments
                          </Button>
                        </Link>
                        <button
                          onClick={() => {
                            setEditingId(lecture.id);
                            setEditTitle(lecture.title);
                          }}
                          className="text-zinc-400 hover:text-zinc-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lecture.id)}
                          className="text-zinc-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {lectures.length === 0 && (
              <div className="p-12 text-center text-zinc-500 italic">
                This course has no lectures yet.
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "quizzes" && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-brand" />
              Quizzes by Lecture
            </h2>
          </div>

          {loadingQuizzes ? (
            <div className="flex py-10 justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {lectures.map((lecture) => {
                const lectureQuizzes = quizzes.filter(
                  (q) => q.lectureId === lecture.id,
                );

                return (
                  <div key={lecture.id} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                          {lecture.title}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {lectureQuizzes.length} quizzes
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/teacher/courses/${courseId}/lectures/${lecture.id}`}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] font-bold"
                        >
                          Manage Quizzes
                        </Button>
                      </Link>
                    </div>

                    {lectureQuizzes.length > 0 ? (
                      <div className="space-y-2">
                        {lectureQuizzes.map((quiz) => (
                          <div
                            key={quiz.id}
                            className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-800/40"
                          >
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {quiz.title}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {(quiz.questions || []).length} questions
                              </p>
                            </div>
                            <Link
                              href={`/dashboard/teacher/courses/${courseId}/lectures/${lecture.id}/quizzes/${quiz.id}/results`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[11px] font-bold"
                              >
                                View Results
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 italic">
                        No quizzes for this lecture yet. Use &quot;Manage
                        Quizzes&quot; to create one.
                      </p>
                    )}
                  </div>
                );
              })}

              {lectures.length === 0 && (
                <div className="p-12 text-center text-zinc-500 text-sm">
                  This course has no lectures yet. Add a lecture first to attach
                  quizzes.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "students" && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" />
              Enrolled Students
            </h2>
          </div>
          {loadingStudents ? (
            <div className="flex py-10 justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
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
                    <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest text-right">
                      Last Activity
                    </th>
                    <th className="px-6 py-4 font-bold text-zinc-500 uppercase text-[10px] tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {studentProgress.map((sp) => {
                    const isAtRisk = sp.percentage < 40;
                    const lastActivity = new Date(sp.updatedAt);
                    const daysSince =
                      (Date.now() - lastActivity.getTime()) /
                      (1000 * 60 * 60 * 24);
                    const isInactive = daysSince > 7;

                    return (
                      <tr
                        key={sp.id}
                        className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors ${
                          isAtRisk ? "bg-red-50/50 dark:bg-red-900/10" : ""
                        } ${isInactive && !isAtRisk ? "bg-zinc-100/50 dark:bg-zinc-800/30" : ""}`}
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
                                style={{ width: `${sp.percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {sp.quizzesCompleted?.length || 0}
                        </td>
                        <td className="px-6 py-4 text-right text-zinc-500 font-medium">
                          <div className="flex items-center justify-end gap-2 text-[11px]">
                            <Clock className="h-3 w-3" />
                            {lastActivity.toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/teacher/courses/${courseId}?tab=quizzes`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-[10px] font-bold h-8"
                            >
                              <ClipboardList className="h-3 w-3" />
                              Quiz Results
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}

                  {studentProgress.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-16 text-center text-zinc-500 text-sm"
                      >
                        No students enrolled in this course yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
