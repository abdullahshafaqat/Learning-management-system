"use client";

import { useEffect, useState, use } from "react";
import { apiFetch } from "@/app/lib/api";
import { toast } from "sonner";
import { Loader2, ChevronLeft, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Question {
  question: string;
  options: string[];
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  lectureId: string;
}

export default function StudentQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get("courseId");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [courseId, setCourseId] = useState<string | null>(initialCourseId);
  const [locked, setLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  const fetchQuiz = async () => {
    try {
      const data = await apiFetch(`/quizzes/${quizId}`);
      if (data.success) {
        setQuiz(data.data);
        if (data.isSubmitted) {
          setResult({ score: data.score });
        }

        const q = data.data as Quiz;
        if (initialCourseId) {
          try {
            const progress = await apiFetch(
              `/progress/courses/${initialCourseId}`,
            );
            if (progress.success) {
              const completedLectures =
                progress.data?.lecturesCompleted || [];
              if (!completedLectures.includes(q.lectureId)) {
                setLocked(true);
                setLockMessage(
                  "Complete the associated lecture before taking this quiz.",
                );
              }
            }
          } catch (err) {
          }
        }
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const handleSubmit = async () => {
    if (!quiz) return;
    
    if (Object.keys(answers).length < quiz.questions.length) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const submission = quiz.questions.map((_, idx) => answers[idx] ?? -1);

      const data = await apiFetch(`/quizzes/${quizId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: submission })
      });

      if (data.success) {
        setResult(data.submission);
      }
    } catch (err) {
      toast.error("Failed to submit results. Try again.");
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

  const handleBackToCourse = () => {
    if (courseId) {
      router.push(`/dashboard/student/courses/${courseId}`);
    } else {
      router.push("/dashboard/student/my-courses");
    }
  };

  if (result && quiz) {
    const totalQuestions = quiz.questions.length || 1;
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold">Quiz Submitted!</h1>
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-8 space-y-2">
          <p className="text-zinc-500 uppercase font-black tracking-widest text-xs">Your Score</p>
          <p className="text-3xl font-black text-brand">
            {result.score} / {totalQuestions}
          </p>
        </div>
        <p className="text-zinc-600">Your progress has been updated.</p>
        <Button onClick={handleBackToCourse}>
          Back to Course
        </Button>
      </div>
    );
  }

  if (!quiz) return <div>Quiz not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{quiz.title}</h1>
        <p className="text-zinc-500">
          {locked
            ? lockMessage ||
              "Complete the course lecture before attempting this quiz."
            : "Answer all questions to complete the assessment."}
        </p>
      </div>

      <div className="space-y-6">
        {!locked &&
          quiz.questions.map((q, qIdx) => (
          <div key={qIdx} className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
            <h3 className="text-lg font-bold flex gap-3">
              <span className="text-brand">Q{qIdx + 1}.</span>
              {q.question}
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt, optIdx) => (
                <button
                   key={optIdx}
                   onClick={() => setAnswers({...answers, [qIdx]: optIdx})}
                   className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                     answers[qIdx] === optIdx 
                       ? "border-brand bg-brand/5 ring-1 ring-brand" 
                       : "border-zinc-100 hover:border-zinc-300 dark:border-zinc-800"
                   }`}
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      answers[qIdx] === optIdx ? "border-brand bg-brand text-white" : "border-zinc-200"
                  }`}>
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="font-medium">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!locked && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="text-sm font-bold text-zinc-500">
              {Object.keys(answers).length} of {quiz.questions.length} Answered
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="gap-2 font-bold px-8 h-12"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Quiz
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
