import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/admin-auth";
import GoogleSignInButton from "./GoogleSignInButton";
import SignOutButton from "./SignOutButton";

export const metadata = {
  title: "Sign in · Vibes Studio",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const state = await getAuthState();
  // Already a superadmin? Go straight in.
  if (state.status === "admin") redirect("/");

  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <p className="text-sm font-medium text-[var(--accent)]">
          Vibes Studio · Restaurant Vibes
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Back of house</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Sign in with the authorized Google account. Only superadmins may enter the kitchen.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          Login failed. Please try again.
        </p>
      ) : null}

      {state.status === "not-admin" ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
          <p className="font-medium">You&apos;re signed in, but not an admin.</p>
          <p className="mt-1 text-[var(--muted)]">
            {state.email} does not have superadmin access. Switch accounts to continue.
          </p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      ) : (
        <GoogleSignInButton />
      )}
    </main>
  );
}
