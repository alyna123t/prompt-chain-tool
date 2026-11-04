"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertSuperadmin } from "@/lib/supabase/admin-auth";
import { DEFAULT_MODEL } from "@/lib/settings";

export type SettingsState = { error?: string; ok?: boolean };

const ALLOWED_MODELS = [
  "claude-opus-5-5",
  "claude-sonnet-5-5",
  "claude-haiku-5-5",
];

export async function saveSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await assertSuperadmin();

  const apiKey = String(formData.get("api_key") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim() || DEFAULT_MODEL;

  if (!ALLOWED_MODELS.includes(model)) {
    return { error: "Pick one of the listed models." };
  }
  // A new key must look like an Anthropic key; a blank field means "keep current".
  if (apiKey && !apiKey.startsWith("sk-ant-")) {
    return { error: "That doesn't look like an Anthropic API key (should start with sk-ant-)." };
  }

  const supabase = await createClient();

  // Only overwrite the key column when a new key was actually typed, so saving
  // just a model change doesn't wipe the stored key.
  const payload: Record<string, unknown> = {
    id: 1,
    anthropic_model: model,
    updated_at: new Date().toISOString(),
  };
  if (apiKey) payload.anthropic_api_key = apiKey;

  const { error } = await supabase
    .from("app_settings")
    .upsert(payload, { onConflict: "id" });
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

export async function removeApiKey(): Promise<void> {
  await assertSuperadmin();
  const supabase = await createClient();
  await supabase
    .from("app_settings")
    .update({ anthropic_api_key: null, updated_at: new Date().toISOString() })
    .eq("id", 1);
  revalidatePath("/settings");
}
