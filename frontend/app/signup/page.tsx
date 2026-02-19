"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/auth-context";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select } from "@/app/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/app/components/ui/card";
import { UserPlus, Mail, Lock, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { BackgroundBlobs } from "@/app/components/ui/background-blobs";

export default function SignupPage() {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signup(formData);
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      <BackgroundBlobs />
      
      {/* Left Column: Visual Panel */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.4),transparent_50%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-4xl bg-brand text-white shadow-2xl shadow-brand/40">
              <Sparkles className="h-10 w-10" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-black text-white leading-tight">
              Start Your <span className="text-brand">Premium</span> <br /> Journey Today
            </h2>
            <p className="text-xl text-zinc-400 font-medium max-w-md mx-auto">
              Join thousands of learners and masters in the most elegant LMS ever built.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-10">
            {[
              { label: "Elite Courses", value: "500+" },
              { label: "Expert Mentors", value: "100+" },
            ].map((stat, i) => (
              <div key={i} className="rounded-3xl bg-white/5 p-6 backdrop-blur-xl border border-white/10">
                <div className="text-3xl font-black text-white">{stat.value}</div>
                <div className="text-sm font-bold text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Column: Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[480px]"
        >
          <div className="mb-10 lg:hidden text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
            <h1 className="text-3xl font-black">Create Account</h1>
          </div>

          <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] bg-white/70 backdrop-blur-2xl dark:bg-zinc-900/70">
            <CardHeader className="space-y-1 pb-8 hidden lg:block">
              <CardTitle className="text-4xl font-extrabold tracking-tight">Sign Up</CardTitle>
              <CardDescription className="text-lg font-medium">
                Enter your details to create your premium account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-500 dark:bg-red-950/20"
                  >
                    {error}
                  </motion.div>
                )}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold ml-1">Full Name</label>
                      <div className="relative">
                        <Input
                          name="username"
                          placeholder="John Doe"
                          className="bg-zinc-50/50 dark:bg-zinc-800/50"
                          required
                          value={formData.username}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold ml-1">Email</label>
                      <Input
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        className="bg-zinc-50/50 dark:bg-zinc-800/50"
                        required
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold ml-1">Password</label>
                    <Input
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-zinc-50/50 dark:bg-zinc-800/50 h-12"
                      required
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>

                  <Select
                    label="Choose Your Role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="h-12 bg-zinc-50/50 dark:bg-zinc-800/50"
                  >
                    <option value="student">Student — I want to learn</option>
                    <option value="teacher">Teacher — I want to instruct</option>
                    <option value="admin">Admin — System access</option>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-black"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                  {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col border-t border-border/50 pt-6 text-center">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Already part of the community?{" "}
                <Link
                  href="/login"
                  className="font-black text-brand hover:underline underline-offset-4"
                >
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
