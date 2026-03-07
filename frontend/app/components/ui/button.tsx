"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";
import { motion } from "framer-motion";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-brand text-brand-foreground shadow-lg shadow-brand/20 hover:bg-brand/90",
      secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700",
      outline: "border border-border bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800",
      ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800",
    };

    const sizes = {
      sm: "h-9 px-3 text-xs",
      md: "h-11 px-6 text-sm",
      lg: "h-14 px-10 text-base",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:opacity-50 disabled:pointer-events-none inner-glow",
          variants[variant],
          sizes[size],
          className
        )}
        {...props as any}
      />
    );
  }
);
Button.displayName = "Button";


