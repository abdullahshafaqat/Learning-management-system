"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/app/lib/api";
import {
  Loader2,
  ChevronLeft,
  Plus,
  Check,
  ClipboardCheck,
  FileText,
  Upload,
  Search,
  BadgeCheck,
  Clock3,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  dueDate: string;
  maxMarks: number;
  lectureId?: string;
}

interface Submission {
  id: string;
  studentName: string;
  studentEmail: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  submittedAt: string;
  marks?: number;
  feedback?: string;
  gradedAt?: string;
  status?: string;
}

export default function TeacherAssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: lectureId } = use(params);
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [creating, setCreating] = useState(false);

  const [gradingId, setGradingId] = useState<string | null>(null);
  const [marksDraft, setMarksDraft] = useState<Record<string, string>>({});
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});
  const [submissionQuery, setSubmissionQuery] = useState("");

  const isSubmissionGraded = (submission: Submission) =>
    (submission.marks !== undefined && submission.marks !== null) ||
    submission.gradedAt !== undefined ||
    submission.status === "graded";

  const fetchAssignments = async () => {
    try {
      const res = await apiFetch(`/assignments/lectures/${lectureId}`);
      if (res.success) {
        setAssignments(res.data || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [lectureId]);

  const openSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionQuery("");
    setLoadingSubmissions(true);
    try {
      const res = await apiFetch(`/assignments/${assignment.id}/submissions`);
      if (res.success) {
        const items: Submission[] = res.submissions || [];
        setSubmissions(items);
        const nextMarks: Record<string, string> = {};
        const nextFeedback: Record<string, string> = {};
        items.forEach((s) => {
          if (s.marks !== undefined && s.marks !== null) {
            nextMarks[s.id] = String(s.marks);
          }
          if (s.feedback) {
            nextFeedback[s.id] = s.feedback;
          }
        });
        setMarksDraft(nextMarks);
        setFeedbackDraft(nextFeedback);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dueDate) {
      toast.error("Fill all required fields");
      return;
    }

    setCreating(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("instructions", instructions.trim());
      form.append("dueDate", new Date(dueDate).toISOString());
      form.append("maxMarks", String(maxMarks));
      if (attachment) {
        form.append("attachment", attachment);
      }

      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${base}/assignments/lectures/${lectureId}`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const res = await response.json();

      if (res.success) {
        setShowCreate(false);
        setTitle("");
        setDescription("");
        setInstructions("");
        setAttachment(null);
        setDueDate("");
        setMaxMarks(100);
        fetchAssignments();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setCreating(false);
    }
  };

  const gradeSubmission = async (submissionId: string) => {
    const rawMarks = marksDraft[submissionId];
    if (rawMarks === undefined || rawMarks === "") {
      toast.error("Please enter marks before saving");
      return;
    }
    const marks = Number(rawMarks);
    const feedback = feedbackDraft[submissionId] ?? "";
    if (Number.isNaN(marks)) {
      toast.error("Enter valid marks");
      return;
    }
    if (selectedAssignment && (marks < 0 || marks > selectedAssignment.maxMarks)) {
      toast.error(`Marks must be between 0 and ${selectedAssignment.maxMarks}`);
      return;
    }

    const current = submissions.find((s) => s.id === submissionId);
    if (current && isSubmissionGraded(current)) {
      toast.error("This submission is already graded");
      return;
    }

    setGradingId(submissionId);
    try {
      const res = await apiFetch(`/assignments/submissions/${submissionId}/grade`, {
        method: "PUT",
        body: JSON.stringify({ marks, feedback }),
      });
      if (res.success && selectedAssignment) {
        openSubmissions(selectedAssignment);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to grade submission");
    } finally {
      setGradingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const filteredSubmissions = submissions
    .filter((s) => {
      const q = submissionQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        (s.studentName || "").toLowerCase().includes(q) ||
        (s.studentEmail || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aGraded = isSubmissionGraded(a);
      const bGraded = isSubmissionGraded(b);
      if (aGraded !== bGraded) return aGraded ? 1 : -1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

  const gradedCount = submissions.filter(isSubmissionGraded).length;
  const pendingCount = submissions.length - gradedCount;

  return (
    <div className="space-y-6">
      <Link
        href={courseId ? `/dashboard/teacher/courses/${courseId}` : "/dashboard/teacher/courses"}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-brand/10 via-white to-emerald-50 dark:from-brand/20 dark:via-zinc-900 dark:to-zinc-900 p-5 md:p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Lecture Assignments</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Create assignments and grade submissions.</p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)} className="gap-2 shadow-sm shadow-brand/20">
          <Plus className="h-4 w-4" />
          {showCreate ? "Cancel" : "New Assignment"}
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={createAssignment} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <input
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            placeholder="Assignment title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            placeholder="Assignment description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
          <textarea
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            placeholder="Detailed instructions (optional)"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
          />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-600 block">
                    Attachment (optional)
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-200 border-dashed rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-800">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-zinc-400" />
                        <p className="mb-2 text-sm text-zinc-500">
                          <span className="font-semibold">
                            {attachment ? "File attached" : "Click to upload"}
                          </span>
                        </p>
                        <p className="text-xs text-zinc-400">Max size 100MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  {attachment && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                      Attachment: {attachment.name}
                    </p>
                  )}
                </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="datetime-local"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
            <input
              type="number"
              min={1}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              required
            />
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Assignment"}
          </Button>
        </form>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50/80 dark:bg-zinc-900/50">
            Assignments ({assignments.length})
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {assignments.map((a) => (
              <button
                key={a.id}
                onClick={() => openSubmissions(a)}
                className={`w-full text-left px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${
                  selectedAssignment?.id === a.id
                    ? "bg-brand/5 border-l-4 border-brand"
                    : "border-l-4 border-transparent"
                }`}
              >
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{a.title}</p>
                {a.instructions && (
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{a.instructions}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                    Due: {new Date(a.dueDate).toLocaleString()}
                  </span>
                  <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                    Max: {a.maxMarks}
                  </span>
                </div>
                {a.attachmentUrl && (
                  <p className="text-xs mt-1">
                    <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="text-brand underline">
                      {a.attachmentName || "Attachment"}
                    </a>
                  </p>
                )}
              </button>
            ))}
            {assignments.length === 0 && (
              <div className="px-4 py-10 text-sm text-zinc-500 text-center">No assignments yet.</div>
            )}
          </div>
        </div>

        <div className="xl:col-span-3 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50/80 dark:bg-zinc-900/50">
            {selectedAssignment ? `Submissions: ${selectedAssignment.title}` : "Submissions"}
          </div>
          {selectedAssignment && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                <p className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Total</p>
                <p className="text-lg font-bold">{submissions.length}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                <p className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Pending</p>
                <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                <p className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Graded</p>
                <p className="text-lg font-bold text-green-600">{gradedCount}</p>
              </div>
            </div>
          )}
          {selectedAssignment && (
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  value={submissionQuery}
                  onChange={(e) => setSubmissionQuery(e.target.value)}
                  placeholder="Search by student name or email"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 pl-9 pr-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
          {loadingSubmissions ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredSubmissions.map((s) => {
                const graded = isSubmissionGraded(s);
                return (
                <div key={s.id} className="px-4 py-4 space-y-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{s.studentName}</p>
                      <p className="text-xs text-zinc-500">{s.studentEmail}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-500 inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {new Date(s.submittedAt).toLocaleString()}
                      </span>
                      <p
                        className={`mt-1 text-[10px] font-black uppercase tracking-wider ${
                          graded ? "text-green-600" : "text-amber-600"
                        }`}
                      >
                        {graded ? "Graded" : "Pending"}
                      </p>
                    </div>
                  </div>

                  {s.text && (
                    <div className="text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 p-2 bg-zinc-50 dark:bg-zinc-800/40">
                      {s.text}
                    </div>
                  )}
                  {s.fileUrl && (
                    <a href={s.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-brand">
                      <FileText className="h-4 w-4" />
                      {s.fileName || "Open attachment"}
                    </a>
                  )}

                  <div className={`rounded-lg border p-3 ${graded ? "border-green-200 bg-green-50/60 dark:border-green-900/40 dark:bg-green-900/10" : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/40"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Grade Sheet
                      </p>
                      {graded && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Locked after grading
                        </span>
                      )}
                    </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Marks"
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                      value={marksDraft[s.id] ?? (s.marks ?? "")}
                      onChange={(e) => setMarksDraft((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      disabled={graded}
                    />
                    <input
                      type="text"
                      placeholder="Feedback (optional)"
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 md:col-span-2"
                      value={feedbackDraft[s.id] ?? (s.feedback ?? "")}
                      onChange={(e) => setFeedbackDraft((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      disabled={graded}
                    />
                  </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => gradeSubmission(s.id)}
                    disabled={gradingId === s.id || graded}
                    className="gap-2"
                  >
                    {gradingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {graded ? "Already Graded" : "Save Grade"}
                  </Button>
                </div>
              )})}

              {selectedAssignment && submissions.length === 0 && (
                <div className="px-4 py-10 text-sm text-zinc-500 text-center inline-flex w-full items-center justify-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  No submissions yet.
                </div>
              )}
              {selectedAssignment && submissions.length > 0 && filteredSubmissions.length === 0 && (
                <div className="px-4 py-10 text-sm text-zinc-500 text-center">
                  No submissions match your search.
                </div>
              )}
              {!selectedAssignment && (
                <div className="px-4 py-10 text-sm text-zinc-500 text-center">Select an assignment to view submissions.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
