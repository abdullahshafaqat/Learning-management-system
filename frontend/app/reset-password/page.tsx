"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/app/components/ui/card";
import { Lock, ArrowLeft, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { BackgroundBlobs } from "@/app/components/ui/background-blobs";
import { apiFetch } from "@/app/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) toast.error("Invalid or missing reset link. Request a new one from the forgot password page.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="relative flex min-h-screen bg-background overflow-hidden">
        <BackgroundBlobs />
        <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-8">
          <Card className="max-w-md w-full border-none shadow-xl bg-white/70 backdrop-blur-2xl dark:bg-zinc-900/70">
            <CardContent className="pt-8 pb-8">
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 p-4 text-sm font-bold text-red-600 dark:text-red-400">
                Invalid or missing reset link. Please request a new one.
              </div>
              <Link href="/forgot-password" className="mt-4 inline-block">
                <Button variant="outline" className="w-full mt-4">Go to Forgot Password</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-background overflow-hidden">
      <BackgroundBlobs />

      <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl sm:max-w-2xl"
        >
          <div className="mb-8 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg">
              <KeyRound className="h-7 w-7" />
            </div>
          </div>

          <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] bg-white/70 backdrop-blur-2xl dark:bg-zinc-900/70">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-extrabold tracking-tight sm:text-2xl">Set new password</CardTitle>
              <CardDescription className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Enter a new password different from your current one. You&apos;ll sign in again after reset.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-green-50 dark:bg-green-950/30 p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-green-800 dark:text-green-200">
                        Password reset successfully
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Redirecting you to sign in...
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold ml-1">New password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        type="password"
                        showPasswordToggle
                        placeholder="Min 6 characters"
                        className="pl-11 bg-zinc-50/50 dark:bg-zinc-800/50 h-12"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold ml-1">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        type="password"
                        showPasswordToggle
                        placeholder="Confirm new password"
                        className="pl-11 bg-zinc-50/50 dark:bg-zinc-800/50 h-12"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 font-bold"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
