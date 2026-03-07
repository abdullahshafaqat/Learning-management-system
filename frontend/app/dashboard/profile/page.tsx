"use client";

import { useAuth } from "@/app/context/auth-context";
import { User, Mail, Shield, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Profile
        </h1>
        <p className="text-zinc-500 mt-1 font-medium">
          View your account information
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-8 shadow-sm">
        <div className="flex items-center gap-6 mb-8">
          <div className="h-20 w-20 rounded-full bg-brand/10 flex items-center justify-center">
            <User className="h-10 w-10 text-brand" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {user.username}
            </h2>
            <span className="inline-flex mt-2 items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-bold uppercase">
              <Shield className="h-4 w-4" />
              {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <User className="h-5 w-5 text-zinc-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                Username
              </p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {user.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Mail className="h-5 w-5 text-zinc-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                Email
              </p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Shield className="h-5 w-5 text-zinc-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                Role
              </p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
