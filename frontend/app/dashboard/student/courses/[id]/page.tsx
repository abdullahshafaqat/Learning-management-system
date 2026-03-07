"use client";

import { useEffect, useState, use } from "react";
import { apiFetch } from "@/app/lib/api";
import { toast } from "sonner";
import { 
  PlayCircle, FileVideo, FileAudio, FileText, 
  CheckCircle2, Circle, Loader2, ChevronLeft, 
  LayoutDashboard, ClipboardList
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

interface Lecture {
  id: string;
  title: string;
  mediaType: string;
  fileUrl: string;
  isCompleted?: boolean;
}

interface Quiz {
  id: string;
  title: string;
  lectureId: string;
  isCompleted?: boolean;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  dueDate: string;
  lectureId?: string;
}

interface Progress {
  percentage: number;
  lecturesCompleted: string[];
  quizzesCompleted: string[];
}

export default function StudentLearningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const [course, setCourse] = useState<any>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const catalogData = await apiFetch("/courses?published=true");
      const found = catalogData.data?.find((c: any) => c.id === courseId);
      setCourse(found || { title: "Course Content" });

      const lectureData = await apiFetch(`/lectures/courses/${courseId}`);
      if (lectureData.success) {
        setLectures(lectureData.data || []);
      }

      const quizReq = await apiFetch(`/quizzes/courses/${courseId}`);
      if (quizReq.success) {
        setQuizzes(quizReq.data || []);
      }

      const progressData = await apiFetch(`/progress/courses/${courseId}`);
      if (progressData.success) {
        setProgress(progressData.data);
      }

      const assignmentsData = await apiFetch(`/assignments/courses/${courseId}`);
      if (assignmentsData.success) {
        setAssignments(assignmentsData.data || []);
      }
    } catch (err) {
      setError("Unable to load course content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const toggleComplete = async (lectureId: string, currentlyDone: boolean) => {
    if (currentlyDone) return;
    
    setProcessingId(lectureId);
    try {
      const data = await apiFetch(`/progress/courses/${courseId}/lectures/${lectureId}`, {
        method: "POST"
      });
      if (data.success) {
        const progressData = await apiFetch(`/progress/courses/${courseId}`);
        if (progressData.success) {
          setProgress(progressData.data);
        }
      }
    } catch (err) {
    } finally {
      setProcessingId(null);
    }
  };

  const openLecture = async (lectureId: string) => {
    try {
      const data = await apiFetch(`/lectures/${lectureId}/file`);
      if (data.success && data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(data.error || "Could not open this file. Please try again.");
      }
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to open lecture file.");
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

  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-bold text-sm">Error loading course</p>
          <p className="text-xs mt-1">{error}</p>
          <button
            className="mt-3 text-xs font-semibold inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 bg-white hover:bg-red-50"
            onClick={() => {
              setLoading(true);
              setError(null);
              setLectures([]);
              setQuizzes([]);
              setProgress(null);
              fetchData();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isLectureCompleted = (id: string) => progress?.lecturesCompleted?.includes(id);
  const isQuizCompleted = (id: string) => progress?.quizzesCompleted?.includes(id);

  const nextLectureId = lectures.find(
    (lecture) => !isLectureCompleted(lecture.id)
  )?.id;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link href="/dashboard/student/my-courses" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        My Learning
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{course?.title}</h1>
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1 font-medium">
              <LayoutDashboard className="h-4 w-4" />
              {lectures.length} Lectures
            </span>
            <span className="flex items-center gap-1 font-medium">
              <ClipboardList className="h-4 w-4" />
              {quizzes.length} Quizzes
            </span>
            <span className="flex items-center gap-1 font-medium">
              <ClipboardList className="h-4 w-4" />
              {assignments.length} Assignments
            </span>
          </div>
        </div>
        
        <div className="w-full md:w-64 space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Overall Progress</span>
            <span className="text-brand">{Math.round(progress?.percentage || 0)}%</span>
          </div>
          <div className="h-3.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
            <div 
              className="h-full bg-linear-to-r from-brand to-indigo-500 dark:to-indigo-400 transition-all duration-700 rounded-full min-w-1"
              style={{ width: `${progress?.percentage ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <div className="bg-zinc-50/50 p-4 border-b border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-800">
              <h2 className="font-bold flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-brand" />
                Course Curriculum
              </h2>
            </div>
            
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {lectures.map((lecture, idx) => {
                const lectureQuiz = quizzes.find(
                  (q) => q.lectureId === lecture.id
                );
                const quizDone = lectureQuiz
                  ? isQuizCompleted(lectureQuiz.id)
                  : false;
                const isNext = lecture.id === nextLectureId;

                return (
                <div 
                  key={lecture.id} 
                  className={`flex items-center justify-between p-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ${
                    isNext
                      ? "border-l-4 border-brand bg-brand/5 dark:bg-brand/10 ring-1 ring-brand/20 dark:ring-brand/30"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      isLectureCompleted(lecture.id) ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                    }`}>
                      {getIcon(lecture.mediaType)}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                        {idx + 1}. {lecture.title}
                      </h4>
                      <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                        {lecture.mediaType || "Content"}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-zinc-500">
                        {lectureQuiz
                          ? quizDone
                            ? "Quiz: Completed"
                            : isLectureCompleted(lecture.id)
                              ? "Quiz: Available"
                              : "Quiz: Locked until this lecture is completed"
                          : "Quiz: Not available for this lecture"}
                      </p>
                      {isNext && !isLectureCompleted(lecture.id) && (
                        <span className="inline-flex mt-2 items-center gap-1 px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-wider">
                          Next lecture
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs font-bold"
                      onClick={() => openLecture(lecture.id)}
                    >
                      Open
                    </Button>
                    <button 
                      onClick={() => toggleComplete(lecture.id, !!isLectureCompleted(lecture.id))}
                      disabled={isLectureCompleted(lecture.id) || processingId === lecture.id}
                      className={`p-1 transition-all rounded-full ${
                        isLectureCompleted(lecture.id) 
                          ? "text-green-500 scale-110" 
                          : "text-zinc-300 hover:text-zinc-500 hover:scale-110"
                      }`}
                    >
                      {processingId === lecture.id ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : isLectureCompleted(lecture.id) ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Circle className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
                );
              })}
              
              {lectures.length === 0 && (
                <div className="p-12 text-center text-zinc-400 italic">
                  No lectures available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 text-left">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-500" />
              Assessments
            </h3>
            <p className="text-xs text-zinc-500 mb-6">Complete quizzes to verify your understanding and track progress.</p>
            
            <div className="space-y-3">
              {quizzes.map((quiz) => {
                const relatedLecture = lectures.find(
                  (l) => l.id === quiz.lectureId
                );
                const lectureDone = relatedLecture
                  ? isLectureCompleted(relatedLecture.id)
                  : false;
                const quizDone = isQuizCompleted(quiz.id);
                const locked = !lectureDone && !quizDone;

                const href = `/dashboard/student/quizzes/${quiz.id}${
                  courseId ? `?courseId=${courseId}` : ""
                }`;

                return (
                <div key={quiz.id} className="block group">
                  <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                    quizDone
                      ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                      : locked
                        ? "bg-zinc-50 border-zinc-200 dark:bg-zinc-800/30 dark:border-zinc-800 opacity-80"
                        : "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20"
                  }`}>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {quiz.title}
                      </span>
                      {quizDone ? (
                        <span className="text-[10px] text-green-600 font-black uppercase tracking-tighter">
                          ✓ Quiz completed
                        </span>
                      ) : locked ? (
                        <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400" />
                          Locked until lecture completed
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Available now
                        </span>
                      )}
                    </div>
                    {quizDone ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : locked ? (
                      <div className="h-8 w-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400">
                        <PlayCircle className="h-4 w-4" />
                      </div>
                    ) : (
                      <Link href={href}>
                        <div className="h-8 w-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center group-hover:bg-brand group-hover:text-white group-hover:border-brand transition-all">
                          <PlayCircle className="h-4 w-4" />
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              )})}

              {quizzes.length === 0 && (
                <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50 dark:bg-zinc-800/30 dark:border-zinc-800 text-center">
                  <p className="text-xs text-zinc-400 italic">No quizzes available for this course yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-brand" />
              Assignments
            </h3>
            <p className="text-xs text-zinc-500 mb-6">Submit your assignment work before deadlines.</p>

            <div className="space-y-3">
              {assignments.map((assignment) => (
                <Link key={assignment.id} href={`/dashboard/student/assignments/${assignment.id}`}>
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-brand/50 transition-colors">
                    <p className="text-sm font-bold">{assignment.title}</p>
                    {assignment.instructions && (
                      <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{assignment.instructions}</p>
                    )}
                    {assignment.attachmentUrl && (
                      <a
                        href={assignment.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-brand underline mt-1 block"
                      >
                        {assignment.attachmentName || "Attachment"}
                      </a>
                    )}
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Due: {new Date(assignment.dueDate).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}

              {assignments.length === 0 && (
                <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50 dark:bg-zinc-800/30 dark:border-zinc-800 text-center">
                  <p className="text-xs text-zinc-400 italic">No assignments available for this course yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
