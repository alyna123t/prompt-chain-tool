import Link from "next/link";
import { requireSuperadmin } from "@/lib/supabase/admin-auth";
import { fullName } from "@/lib/types";
import SignOutButton from "@/app/login/SignOutButton";
import Nav from "./Nav";
import ThemeToggle from "./ThemeToggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = await requireSuperadmin();

  // Logged in, but not a superadmin: never render the app or its data.
  if (state.status === "not-admin") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4">
        <h1 className="text-2xl font-semibold">No access</h1>
        <p className="text-[var(--muted)]">
          You&apos;re signed in as{" "}
          <span className="font-medium text-[var(--foreground)]">{state.email}</span>, but
          this account isn&apos;t a superadmin. Ask an existing admin to grant access, then
          sign back in.
        </p>
        <div>
          <SignOutButton />
        </div>
      </main>
    );
  }

  const who = fullName(state.profile) || state.profile.email || "Admin";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-base font-semibold tracking-tight">
              Prep<span className="text-[var(--accent)]">Line</span>
            </Link>
            <Nav />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ThemeToggle />
            <span className="hidden text-[var(--muted)] sm:inline">{who}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
