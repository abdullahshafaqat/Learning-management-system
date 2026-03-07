"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, showPasswordToggle, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    const isPassword = type === "password";
    const inputType = isPassword ? (visible ? "text" : "password") : type;

    return (
      <div className="w-full relative">
        <input
          type={inputType}
          className={cn(
            "flex h-11 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm ring-offset-background transition-all placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />

        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center p-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {error && (
          <p className="mt-1.5 text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";


