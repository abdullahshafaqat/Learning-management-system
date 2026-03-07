"use client";

import { useEffect, useState, use } from "react";
import { apiFetch } from "@/app/lib/api";
import { toast } from "sonner";
import { 
  Plus, Trash2, ChevronLeft, Loader2, 
  CheckCircle2, Send, X, AlertCircle, HelpCircle,
  ClipboardList, Icon, FileText, Clock, Users
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Question {
  question: string;
  options: string[];
  correct: number;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
}

interface Submission {
  id: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  marks?: number;
  feedback?: string;
  fileUrl?: string;
  fileName?: string;
}

type Tab = "quizzes" | "assignments";

export default function TeacherLectureManagementPage({ params }: { params: Promise<{ id: string; lectureId: string }> }) {
  const { id: courseId, lectureId } = use(params);
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lectureTitle, setLectureTitle] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("quizzes");

  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", "", "", ""], correct: 0 }
  ]);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentInstructions, setAssignmentInstructions] = useState("");
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentMaxMarks, setAssignmentMaxMarks] = useState(100);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const quizData = await apiFetch(`/quizzes/courses/${courseId}`);
        if (quizData.success) {
          const filtered = quizData.data.filter((q: any) => q.lectureId === lectureId);
          setQuizzes(filtered);
        }

        const assignmentData = await apiFetch(`/assignments/lectures/${lectureId}`);
        if (assignmentData.success) {
          setAssignments(assignmentData.data || []);
        }

        const lectureData = await apiFetch(`/lectures/courses/${courseId}`);
        if (lectureData.success) {
          const found = lectureData.data.find((l: any) => l.id === lectureId);
          if (found) setLectureTitle(found.title);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, lectureId]);

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correct: 0 }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].question = text;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, optIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[optIndex] = text;
    setQuestions(newQuestions);
  };

  const setCorrect = (qIndex: number, optIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correct = optIndex;
    setQuestions(newQuestions);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle || questions.some(q => !q.question || q.options.some(o => !o))) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSavingQuiz(true);
    try {
      const data = await apiFetch(`/lectures/${lectureId}/quizzes`, {
        method: "POST",
        body: JSON.stringify({
          title: quizTitle,
          questions: questions
        })
      });

      if (data.success) {
        setQuizzes([...quizzes, data.quiz]);
        setShowAddQuiz(false);
        setQuizTitle("");
        setQuestions([{ question: "", options: ["", "", "", ""], correct: 0 }]);
        toast.success("Quiz created successfully!");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save quiz");
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle.trim() || !assignmentDescription.trim() || !assignmentDueDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSavingAssignment(true);
    try {
      const form = new FormData();
      form.append("title", assignmentTitle);
      form.append("description", assignmentDescription);
      form.append("instructions", assignmentInstructions);
      form.append("dueDate", new Date(assignmentDueDate).toISOString());
      form.append("maxMarks", String(assignmentMaxMarks));
      if (assignmentFile) {
        form.append("attachment", assignmentFile);
      }

      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${base}/assignments/lectures/${lectureId}`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setShowAddAssignment(false);
        setAssignmentTitle("");
        setAssignmentDescription("");
        setAssignmentInstructions("");
        setAssignmentFile(null);
        setAssignmentDueDate("");
        setAssignmentMaxMarks(100);
        setAssignments([...assignments, data.data]);
        toast.success("Assignment created successfully!");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const openAssignmentSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setLoadingSubmissions(true);
    try {
      const res = await apiFetch(`/assignments/${assignment.id}/submissions`);
      if (res.success) {
        const items: Submission[] = res.submissions || [];
        setSubmissions(items);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoadingSubmissions(false);
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
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link 
          href={`/dashboard/teacher/courses/${courseId}`}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Lecture Management</h1>
          <p className="text-zinc-500">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{lectureTitle || "Loading..."}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("quizzes")}
          className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${
            activeTab === "quizzes"
              ? "text-brand border-brand"
              : "text-zinc-500 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Quizzes ({quizzes.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab("assignments")}
          className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${
            activeTab === "assignments"
              ? "text-brand border-brand"
              : "text-zinc-500 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Assignments ({assignments.length})
          </div>
        </button>
      </div>

      {activeTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Manage Quizzes</h2>
            <Button 
              onClick={() => setShowAddQuiz(!showAddQuiz)} 
              className="gap-2"
            >
              {showAddQuiz ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showAddQuiz ? "Cancel" : "New Quiz"}
            </Button>
          </div>

          {showAddQuiz && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-8 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-4">
                <h3 className="text-lg font-bold">New Quiz Configuration</h3>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Quiz Title</label>
                  <input
                    required
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
                    placeholder="e.g. Final Assessment for Module 1"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-500 uppercase tracking-widest text-xs">Questions</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="h-8 gap-1">
                    <Plus className="h-3 w-3" /> Question
                  </Button>
                </div>

                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-6 rounded-xl border border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/20 space-y-6 relative group">
                    {questions.length > 1 && (
                      <button 
                        onClick={() => removeQuestion(qIdx)}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold flex gap-2 items-center">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white text-[10px]">{qIdx + 1}</span>
                        Question Text
                      </label>
                      <input
                        required
                        value={q.question}
                        onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
                        placeholder="Enter your question here..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase text-zinc-400">Option {String.fromCharCode(65 + optIdx)}</label>
                            <button 
                              type="button"
                              onClick={() => setCorrect(qIdx, optIdx)}
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                q.correct === optIdx ? "bg-green-500 text-white" : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700"
                              }`}
                            >
                              {q.correct === optIdx ? "Correct" : "Mark Correct"}
                            </button>
                          </div>
                          <input
                            required
                            value={opt}
                            onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                            className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:bg-zinc-800 ${
                              q.correct === optIdx ? "border-green-500/50 ring-1 ring-green-500/20" : "border-zinc-200 dark:border-zinc-700"
                            }`}
                            placeholder={`Option ${optIdx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveQuiz} disabled={isSavingQuiz} className="w-full h-12 text-lg font-bold gap-2">
                {isSavingQuiz ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Save Quiz
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="p-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between transition-all hover:border-zinc-300 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{quiz.title}</h3>
                    <p className="text-sm text-zinc-500">{quiz.questions.length} Questions</p>
                  </div>
                </div>
                <Link href={`/dashboard/teacher/courses/${courseId}/lectures/${lectureId}/quizzes/${quiz.id}/results`}>
                  <Button variant="outline" size="sm" className="gap-2 font-bold text-xs h-9">
                    View Results
                  </Button>
                </Link>
              </div>
            ))}

            {quizzes.length === 0 && !showAddQuiz && (
              <div className="py-20 text-center space-y-4 rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                <div className="mx-auto h-16 w-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                  <HelpCircle className="h-8 w-8 text-zinc-300" />
                </div>
                <p className="text-zinc-500 font-medium">No quizzes for this lecture yet.</p>
                <Button variant="outline" onClick={() => setShowAddQuiz(true)}>Create the first quiz</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Manage Assignments</h2>
            <Button 
              onClick={() => setShowAddAssignment(!showAddAssignment)} 
              className="gap-2"
            >
              {showAddAssignment ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showAddAssignment ? "Cancel" : "New Assignment"}
            </Button>
          </div>

          {showAddAssignment && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6 animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-bold">Create New Assignment</h3>
              <form onSubmit={handleCreateAssignment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assignment Title</label>
                  <input
                    required
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
                    placeholder="e.g. Problem Set 1"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    required
                    value={assignmentDescription}
                    onChange={(e) => setAssignmentDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
                    placeholder="Assignment details and instructions..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Detailed Instructions (optional)</label>
                  <textarea
                    value={assignmentInstructions}
                    onChange={(e) => setAssignmentInstructions(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
                    placeholder="Additional instructions or guidelines..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Attachment (optional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                      className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800 file:cursor-pointer file:mr-2 file:px-3 file:py-1 file:rounded file:border-0 file:text-xs file:font-medium file:bg-brand file:text-white hover:file:bg-brand/90"
                    />
                  </div>
                  {assignmentFile && (
                    <p className="text-xs text-zinc-500 mt-2">Selected: {assignmentFile.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <input
                      required
                      type="datetime-local"
                      value={assignmentDueDate}
                      onChange={(e) => setAssignmentDueDate(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Marks</label>
                    <input
                      type="number"
                      min="1"
                      value={assignmentMaxMarks}
                      onChange={(e) => setAssignmentMaxMarks(Number(e.target.value) || 0)}
                      className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isSavingAssignment} className="w-full h-12 text-lg font-bold gap-2">
                  {isSavingAssignment ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  Create Assignment
                </Button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {assignments.map((assignment) => (
              <div 
                key={assignment.id} 
                className="p-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-md cursor-pointer"
                onClick={() => openAssignmentSubmissions(assignment)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">{assignment.title}</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">{assignment.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">Max Marks:</span>
                      <span className="text-zinc-600 dark:text-zinc-400">{assignment.maxMarks}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {assignments.length === 0 && !showAddAssignment && (
              <div className="py-20 text-center space-y-4 rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                <div className="mx-auto h-16 w-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                  <ClipboardList className="h-8 w-8 text-zinc-300" />
                </div>
                <p className="text-zinc-500 font-medium">No assignments for this lecture yet.</p>
                <Button variant="outline" onClick={() => setShowAddAssignment(true)}>Create the first assignment</Button>
              </div>
            )}
          </div>

          {selectedAssignment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 rounded-2xl">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div>
                    <h3 className="text-xl font-bold">{selectedAssignment.title}</h3>
                    <p className="text-sm text-zinc-500">Submissions</p>
                  </div>
                  <button
                    onClick={() => setSelectedAssignment(null)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6">
                  {loadingSubmissions ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-brand" />
                    </div>
                  ) : submissions.length > 0 ? (
                    <div className="space-y-4">
                      {submissions.map((submission) => (
                        <div key={submission.id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{submission.studentName}</p>
                              <p className="text-xs text-zinc-500">{submission.studentEmail}</p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Submitted</span>
                          </div>
                          <p className="text-xs text-zinc-500 mb-2">
                            Submitted: {new Date(submission.submittedAt).toLocaleString()}
                          </p>
                          {submission.marks !== undefined && (
                            <p className="text-sm font-semibold text-brand">Marks: {submission.marks}/{selectedAssignment.maxMarks}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-zinc-500 py-10">
                      <ClipboardList className="h-12 w-12 mx-auto text-zinc-300 mb-3" />
                      <p>No submissions yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
