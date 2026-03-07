"use client";

import { useAuth } from "@/app/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
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
      } else if (user.role !== "admin") {
        logout();
      }
    }
  }, [user, loading, logout, router]);

  if (loading || !user || user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
