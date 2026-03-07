"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/app/lib/api";
import { Loader2, FileText, CheckCircle2, Clock } from "lucide-react";

interface StudentAssignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  courseTitle: string;
  dueDate: string;
  maxMarks: number;
  mySubmission?: {
    marks?: number;
    submittedAt?: string;
  };
}

export default function StudentAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StudentAssignment[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/assignments/student");
        if (res.success) {
          setItems(res.data || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Assignments</h1>
        <p className="text-sm text-zinc-500">Submit work and track grades.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.map((a) => {
          const submitted = !!a.mySubmission;
          const graded = typeof a.mySubmission?.marks === "number";
          const overdue = !submitted && new Date(a.dueDate).getTime() < Date.now();
          const late = submitted && a.mySubmission?.submittedAt && new Date(a.mySubmission.submittedAt).getTime() > new Date(a.dueDate).getTime();

          return (
            <Link key={a.id} href={`/dashboard/student/assignments/${a.id}`}>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 hover:border-brand/40 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{a.title}</h3>
                    <p className="text-xs text-zinc-500">{a.courseTitle}</p>
                    <p className="text-sm text-zinc-600 mt-2 line-clamp-2">{a.description}</p>
                    {a.instructions && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{a.instructions}</p>
                    )}
                    {a.attachmentUrl && (
                      <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-brand underline mt-1 inline-block">
                        {a.attachmentName || "Attachment"}
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Due</p>
                    <p className="text-xs font-semibold">{new Date(a.dueDate).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1">
                    <FileText className="h-3 w-3" />
                    Max: {a.maxMarks}
                  </span>
                  {submitted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Submitted
                    </span>
                  )}
                  {graded && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2 py-1">
                      Marks: {a.mySubmission?.marks}
                    </span>
                  )}
                  {late && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-1">
                      <Clock className="h-3 w-3" />
                      Late submission
                    </span>
                  )}
                  {overdue && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-1">
                      <Clock className="h-3 w-3" />
                      Deadline passed
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-8 text-center text-sm text-zinc-500">
            No assignments available.
          </div>
        )}
      </div>
    </div>
  );
}
