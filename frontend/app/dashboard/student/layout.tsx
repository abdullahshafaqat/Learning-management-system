"use client";

import { useAuth } from "@/app/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "student") {
        logout();
      }
    }
  }, [user, loading, logout, router]);

  if (loading || !user || user.role !== "student") {
    return null;
  }

  return <>{children}</>;
}
