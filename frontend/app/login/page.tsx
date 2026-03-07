"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/auth-context";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/app/components/ui/card";
import { LogIn, Mail, Lock, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { BackgroundBlobs } from "@/app/components/ui/background-blobs";

export default function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-background overflow-hidden">
      <BackgroundBlobs />
      
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-brand p-12 lg:flex">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-4xl bg-white text-brand shadow-2xl">
              <ShieldCheck className="h-10 w-10" />
            </div>
          </div>
          <div className="space-y-4 text-white">
            <h2 className="text-5xl font-black leading-tight">
              Welcome Back <br /> Master
            </h2>
            <p className="text-xl text-white/70 font-medium max-w-md mx-auto">
              Access your premium content and continue your journey where you left off.
            </p>
          </div>
          
          <div className="pt-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-bold text-white backdrop-blur-md">
              <Sparkles className="h-4 w-4" />
              <span>Personalized Learning Experience</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-8 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[480px]"
        >
          <div className="mb-10 lg:hidden text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-lg">
                <LogIn className="h-6 w-6" />
              </div>
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">Welcome Back</h1>
          </div>

          <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] bg-white/70 backdrop-blur-2xl dark:bg-zinc-900/70">
            <CardHeader className="space-y-1 pb-8 hidden lg:block">
              <CardTitle className="text-3xl font-extrabold tracking-tight xl:text-4xl">Sign In</CardTitle>
              <CardDescription className="text-lg font-medium">
                Enter your credentials to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold ml-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <Input
                        name="email"
                        type="email"
                        placeholder="Type you email"
                        className="h-11 bg-zinc-50/50 pl-11 dark:bg-zinc-800/50 sm:h-12"
                        required
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-sm font-bold">Password</label>
                      <Link href="/forgot-password" className="text-xs font-bold text-brand hover:underline">Forgot password?</Link>
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Input
                        name="password"
                        type="password"
                        showPasswordToggle
                        placeholder="••••••••"
                        className="h-11 bg-zinc-50/50 pl-11 dark:bg-zinc-800/50 sm:h-12"
                        required
                        value={formData.password}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full text-base font-black sm:h-14 sm:text-lg"
                  disabled={loading}
                >
                  {loading ? "Authenticating..." : "Sign In"}
                  {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col border-t border-border/50 pt-6 text-center">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                New to the platform?{" "}
                <Link
                  href="/signup"
                  className="font-black text-brand hover:underline underline-offset-4"
                >
                  Create account
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
