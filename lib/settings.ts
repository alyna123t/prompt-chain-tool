import "server-only";
import { createClient } from "@/lib/supabase/server";

// Default to the current Opus; the Settings page or ANTHROPIC_MODEL can override it.
export const DEFAULT_MODEL = "claude-opus-5-5";

type Raw = { anthropic_api_key: string | null; anthropic_model: string | null };

// Reads the single app_settings row. Returns nulls if the table doesn't exist yet
// (e.g. before the migration is run) so the app degrades to env vars / mock.
async function readRaw(): Promise<Raw> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("anthropic_api_key, anthropic_model")
      .eq("id", 1)
      .maybeSingle<Raw>();
    return {
      anthropic_api_key: data?.anthropic_api_key?.trim() || null,
      anthropic_model: data?.anthropic_model?.trim() || null,
    };
  } catch {
    return { anthropic_api_key: null, anthropic_model: null };
  }
}

// Server-side config used to actually call the model. The key stays on the server.
// Precedence: the key/model saved in the DB, then the env var, then the default.
export type ApiConfig = { apiKey: string | null; model: string; hasKey: boolean };

export async function getApiConfig(): Promise<ApiConfig> {
  const raw = await readRaw();
  const apiKey = raw.anthropic_api_key || process.env.ANTHROPIC_API_KEY?.trim() || null;
  const model = raw.anthropic_model || process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
  return { apiKey, model, hasKey: Boolean(apiKey) };
}

// Safe summary for the Settings UI — never exposes the full key.
export type SettingsView = {
  hasKey: boolean;
  keySource: "database" | "environment" | "none";
  maskedKey: string | null;
  model: string;
  canRemove: boolean;
};

export async function getSettingsView(): Promise<SettingsView> {
  const raw = await readRaw();
  const envKey = process.env.ANTHROPIC_API_KEY?.trim() || null;
  const effectiveKey = raw.anthropic_api_key || envKey;
  const keySource = raw.anthropic_api_key ? "database" : envKey ? "environment" : "none";
  return {
    hasKey: Boolean(effectiveKey),
    keySource,
    maskedKey: effectiveKey ? maskKey(effectiveKey) : null,
    model: raw.anthropic_model || process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
    // Only a DB-stored key can be removed from the UI; an env-var key lives in Vercel.
    canRemove: Boolean(raw.anthropic_api_key),
  };
}

function maskKey(k: string): string {
  if (k.length <= 10) return "••••••";
  return `${k.slice(0, 6)}…${k.slice(-4)}`;
}
