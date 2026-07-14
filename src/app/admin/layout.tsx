import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/queries/profiles";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/settings", label: "Settings" },
] as const;

/**
 * Role gate for everything under /admin. The proxy already bounces
 * signed-out visitors; this layout bounces non-admins. RLS remains the
 * real enforcement — a non-admin who somehow rendered these pages would
 * still read/write nothing.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const current = await getCurrentUser();
  if (current?.profile?.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Admin</h1>
        <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-primary-soft hover:text-ink"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
