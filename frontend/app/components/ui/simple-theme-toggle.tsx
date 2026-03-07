"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function SimpleThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme-simple");
    if (saved === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
      return;
    }
    if (saved === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(prefersDark);
    if (prefersDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme-simple", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme-simple", "light");
    }
  };

  if (isDark === null) return null;

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
      aria-pressed={isDark}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
