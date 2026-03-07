"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/app/lib/api";
import { UserCheck, UserMinus, ShieldAlert, ShieldCheck, Loader2, Search, Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

interface User {
  id: string;
  username: string;
  email: string;
  role: "student" | "teacher" | "admin";
  isBlocked: boolean;
}

type SortKey = "username" | "email" | "role";
type SortDir = "asc" | "desc";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("username");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchUsers = async () => {
    try {
      const data = await apiFetch("/admin/users");
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      setError("An unexpected error occurred while fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = users.filter(
      (u) =>
        !search.trim() ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      const aVal = String(a[sortKey] ?? "");
      const bVal = String(b[sortKey] ?? "");
      const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [users, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else setSortKey(key);
  };

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    setProcessingId(userId);
    try {
      const data = await apiFetch(`/admin/users/${userId}/block`, {
        method: "PUT",
        body: JSON.stringify({ isBlocked: !currentStatus }),
      });
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: !currentStatus } : u));
      }
    } catch (err) {
    } finally {
      setProcessingId(null);
    }
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "student" ? "teacher" : "student";
    setProcessingId(userId);
    try {
      const data = await apiFetch(`/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      }
    } catch (err) {
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
        <p className="font-bold">Error loading users</p>
        <p className="text-sm">{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchUsers}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">User Management</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-zinc-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand/50 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-brand" />
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400">Total Users</p>
              <p className="text-lg font-bold">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th
                className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => toggleSort("username")}
              >
                User {sortKey === "username" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => toggleSort("email")}
              >
                Email {sortKey === "email" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => toggleSort("role")}
              >
                Role {sortKey === "role" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredAndSorted.map((user) => (
              <tr
                key={user.id}
                className={cn(
                  "hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors",
                  user.isBlocked && "bg-red-50/50 dark:bg-red-900/10"
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{user.username}</div>
                      {user.isBlocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-500">
                          <ShieldAlert className="h-3 w-3" /> Blocked
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-medium">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider",
                    user.role === "admin" ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                    user.role === "teacher" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" :
                    "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {user.role !== "admin" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={processingId === user.id}
                          className="h-8 text-[11px] font-bold"
                          onClick={() => handleChangeRole(user.id, user.role)}
                        >
                          Change to {user.role === "student" ? "Teacher" : "Student"}
                        </Button>
                        <Button
                          variant={user.isBlocked ? "outline" : "outline"}
                          size="sm"
                          disabled={processingId === user.id}
                          className={cn(
                            "h-8 w-8 p-0",
                            user.isBlocked ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-red-500 hover:text-red-600 hover:bg-red-50"
                          )}
                          onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                        >
                          {user.isBlocked ? <ShieldCheck className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredAndSorted.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-zinc-500 text-sm">
                  {search.trim() ? "No users match your search." : "No users found yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
