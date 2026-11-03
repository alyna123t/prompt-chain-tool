import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_superadmin: boolean;
  created_at: string;
};

export type AuthState =
  | { status: "anon" }
  | { status: "not-admin"; email: string | null }
  | { status: "admin"; profile: AdminProfile };

// Who is asking? Reads the session + the caller's own profile row.
// (A logged-in user can always read their own row under the existing RLS, so this
// works even before the superadmin policies would let them read anything else.)
export async function getAuthState(): Promise<AuthState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "anon" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, avatar_url, is_superadmin, created_at")
    .eq("id", user.id)
    .maybeSingle<AdminProfile>();

  if (!profile?.is_superadmin) {
    return { status: "not-admin", email: profile?.email ?? user.email ?? null };
  }

  return { status: "admin", profile };
}

// Guard for Server Components / pages. Sends logged-out users to /login and lets the
// layout render the "no access" screen for logged-in non-admins by returning the state.
// The return type excludes "anon" because that case always redirects (never returns).
export async function requireSuperadmin(): Promise<Exclude<AuthState, { status: "anon" }>> {
  const state = await getAuthState();
  if (state.status === "anon") redirect("/login");
  return state;
}

// Stricter guard for mutating server actions: throws for anyone who is not a
// superadmin, so a chain/step/media row can never be written without the flag —
// even if a request somehow slips past the proxy and layout.
export async function assertSuperadmin() {
  const state = await getAuthState();
  if (state.status !== "admin") {
    throw new Error("Not authorized: superadmin access required.");
  }
  return state.profile;
}
