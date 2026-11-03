"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      onClick={signIn}
      disabled={loading}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 font-medium transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
    >
      {loading ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}
