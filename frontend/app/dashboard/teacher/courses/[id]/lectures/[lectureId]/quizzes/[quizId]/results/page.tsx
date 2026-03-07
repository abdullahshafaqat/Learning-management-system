"use client";

import { useEffect, useState, use } from "react";
import { apiFetch } from "@/app/lib/api";
import { 
  ChevronLeft, Loader2, User as UserIcon, 
  Calendar, Trophy, ClipboardList
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

interface Result {
  id: string;
  studentName: string;
  score: number;
  submittedAt: string;
}

export default function QuizResultsPage({ params }: { params: Promise<{ id: string; lectureId: string; quizId: string }> }) {
  const { id: courseId, lectureId, quizId } = use(params);
  const [results, setResults] = useState<Result[]>([]);
  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const quizData = await apiFetch(`/quizzes/${quizId}`);
        if (quizData.success) {
          setQuizDetails(quizData.data || quizData.quiz);
        }

        const resultsData = await apiFetch(`/quizzes/${quizId}/results`);
        if (resultsData.success) {
          setResults(resultsData.results || []);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const maxScore = quizDetails?.questions?.length || 1;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <Link 
        href={`/dashboard/teacher/courses/${courseId}/lectures/${lectureId}`}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Quiz Management
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {quizDetails?.title || "Quiz Results"}
          </h1>
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1 font-medium">
              <ClipboardList className="h-4 w-4" />
              {quizDetails?.questions?.length || 0} Questions
            </span>
            <span className="flex items-center gap-1 font-medium">
              <UserIcon className="h-4 w-4" />
              {results.length} Submissions
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">Student Name</th>
              <th className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 text-center">Score</th>
              <th className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 text-center">Percentage</th>
              <th className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 text-right">Completion Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {results.map((result) => (
              <tr key={result.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                      {result.studentName?.[0]?.toUpperCase() || "S"}
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{result.studentName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 font-black text-zinc-600 dark:text-zinc-400">
                     <span className="text-brand text-lg">{result.score}</span>
                     <span className="text-zinc-300 text-xs">/</span>
                     <span className="text-xs">{maxScore}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                    (result.score / maxScore) >= 0.7 
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30" 
                      : (result.score / maxScore) >= 0.4
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                        : "bg-red-100 text-red-600 dark:bg-red-900/30"
                  }`}>
                    {Math.round((result.score / maxScore) * 100)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-zinc-500 font-medium">
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <Calendar className="h-3 w-3" />
                    {new Date(result.submittedAt).toLocaleDateString()} at {new Date(result.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
              </tr>
            ))}

            {results.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                   <div className="flex flex-col items-center gap-2 opacity-30">
                     <Trophy className="h-12 w-12" />
                     <p className="font-medium">No students have completed this quiz yet.</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
