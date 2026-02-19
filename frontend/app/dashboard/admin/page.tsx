export default function AdminDashboard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-xl shadow-brand/5">
      <h2 className="text-4xl font-bold tracking-tight text-foreground">Welcome, Administrator</h2>
      <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
        Your command center for overseeing the entire platform. Manage users, courses, and site-wide settings from here.
      </p>
    </div>
  );
}
