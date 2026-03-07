"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch } from "@/app/lib/api";
import { Loader2, ChevronLeft, Upload, CheckCircle2 } from "lucide-react";
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
}

interface MySubmission {
  id: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  submittedAt: string;
  marks?: number;
  feedback?: string;
  status?: string;
}

export default function StudentAssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [mySubmission, setMySubmission] = useState<MySubmission | null>(null);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editMode, setEditMode] = useState(false);

  const fetchData = async () => {
    try {
      const res = await apiFetch(`/assignments/${id}`);
      if (res.success) {
        setAssignment(res.assignment || null);
        setMySubmission(res.mySubmission || null);
        if (res.mySubmission?.text) {
          setText(res.mySubmission.text);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !file) {
      toast.error("Add text or upload file");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      if (text.trim()) form.append("text", text.trim());
      if (file) form.append("file", file);

      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${base}/assignments/${id}/submit`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Submission failed");
      }

      toast.success("Assignment submitted");
      setText("");
      setFile(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!assignment) {
    return <div className="text-sm text-zinc-500">Assignment not found.</div>;
  }

  const deadlinePassed = new Date(assignment.dueDate).getTime() < Date.now();

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/student/assignments" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800">
        <ChevronLeft className="h-4 w-4" />
        Back to assignments
      </Link>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold">{assignment.title}</h1>
        <p className="text-sm text-zinc-500 mt-1">Due: {new Date(assignment.dueDate).toLocaleString()}</p>
        <p className="text-sm text-zinc-500">Max Marks: {assignment.maxMarks}</p>
        <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{assignment.description}</p>
        {assignment.instructions && (
          <div className="mt-4">
            <h3 className="font-semibold">Instructions</h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{assignment.instructions}</p>
          </div>
        )}
        {assignment.attachmentUrl && (
          <div className="mt-4">
            <a 
              href={assignment.attachmentUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors text-sm font-medium"
            >
              📎 Assignment File
            </a>
          </div>
        )}
      </div>

      {mySubmission && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-900/40 dark:bg-green-900/10">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Submitted on {new Date(mySubmission.submittedAt).toLocaleString()}
          </div>
          {mySubmission.status && (
            <p className="mt-2 text-xs font-medium text-zinc-600">Status: {mySubmission.status}</p>
          )}
          {mySubmission.text && <p className="mt-3 text-sm">{mySubmission.text}</p>}
          {mySubmission.fileUrl && (
            <a href={mySubmission.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-brand">
              Open submitted file ({mySubmission.fileName || "attachment"})
            </a>
          )}
          {typeof mySubmission.marks === "number" && (
            <div className="mt-4 rounded-lg bg-white/70 p-3 text-sm">
              <p className="font-semibold">Marks: {mySubmission.marks} / {assignment.maxMarks}</p>
              {mySubmission.feedback && <p className="mt-1 text-zinc-600">Feedback: {mySubmission.feedback}</p>}
            </div>
          )}
        </div>
      )}

      {!deadlinePassed && (
        <form onSubmit={submit} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <h2 className="font-bold">{mySubmission ? "Resubmit Your Work" : "Submit Your Work"}</h2>
          {deadlinePassed && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Submission deadline has passed.
            </div>
          )}
          <textarea
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            rows={6}
            placeholder="Write your answer..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={deadlinePassed}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-600 block">
              Attach File (optional)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-zinc-200 border-dashed rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="flex flex-col items-center justify-center pt-3 pb-4">
                  <Upload className="w-6 h-6 mb-2 text-zinc-400" />
                  <p className="text-sm text-zinc-500">
                    <span className="font-semibold">
                      {file ? "File attached" : "Click to upload"}
                    </span>
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={deadlinePassed}
                />
              </label>
            </div>
            {file && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 dark:text-blue-300">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                  disabled={deadlinePassed}
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <Button type="submit" disabled={submitting || deadlinePassed} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {mySubmission ? "Resubmit" : "Submit Assignment"}
          </Button>
        </form>
      )}
    </div>
  );
}
