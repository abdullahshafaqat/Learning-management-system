"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/app/components/ui/card";
import { Mail, ArrowLeft, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { BackgroundBlobs } from "@/app/components/ui/background-blobs";
import { apiFetch } from "@/app/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setResetUrl(null);
    try {
      const data = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (data.success) {
        setSuccess(true);
        if (data.resetUrl) setResetUrl(data.resetUrl);
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-background overflow-hidden">
      <BackgroundBlobs />

      <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px]"
        >
          <div className="mb-8 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg">
              <KeyRound className="h-7 w-7" />
            </div>
          </div>

          <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] bg-white/70 backdrop-blur-2xl dark:bg-zinc-900/70">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-extrabold tracking-tight sm:text-2xl">Forgot password?</CardTitle>
              <CardDescription className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Enter your email and we&apos;ll send you a secure link to set a new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="space-y-5">
                  <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50/80 dark:bg-green-950/20 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-green-800 dark:text-green-100">
                          Reset link sent
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300/90 leading-relaxed">
                          We&apos;ve sent a password reset link to <span className="font-semibold text-zinc-900 dark:text-zinc-100">{email}</span>. The link expires in 15 minutes.
                        </p>
                      </div>
                    </div>
                  </div>
                  {resetUrl && (
                    <a
                      href={resetUrl}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand text-white px-4 py-3 text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                      Open reset link
                    </a>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="pl-11 bg-zinc-50/50 dark:bg-zinc-800/50 h-12"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 font-bold"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send reset link"}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col border-t border-border/50 pt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
