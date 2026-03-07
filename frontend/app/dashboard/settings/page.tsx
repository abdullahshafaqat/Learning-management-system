"use client";

import { useAuth } from "@/app/context/auth-context";
import { Settings, Bell, Palette, Shield, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { SimpleThemeToggle } from "@/app/components/ui/simple-theme-toggle";

export default function SettingsPage() {
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
          Settings
        </h1>
        <p className="text-zinc-500 mt-1 font-medium">
          Manage your preferences
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">
              Notifications
            </h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            Configure how you receive updates and alerts.
          </p>
          <Button variant="outline" size="sm" disabled className="text-xs">
            Coming soon
          </Button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">
              Appearance
            </h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">Theme and display preferences.</p>
          <div className="flex items-center gap-4">
            <SimpleThemeToggle />
            <p className="text-xs text-zinc-500">Toggle dark / light mode (saved in browser).</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">
              Security
            </h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            Password and security settings.
          </p>
          <Button variant="outline" size="sm" disabled className="text-xs">
            Coming soon
          </Button>
        </div>
      </div>
    </div>
  );
}
