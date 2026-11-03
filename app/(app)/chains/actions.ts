"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertSuperadmin } from "@/lib/supabase/admin-auth";
import { runChain, type ChainStepDef } from "@/lib/ai";
import type { PromptChainStep } from "@/lib/types";

export type FormState = { error?: string };

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
// Only store images below this size (bytes) as a data URL in the DB; larger images
// are still used for generation, just not persisted for the gallery thumbnail.
const MAX_STORED_IMAGE_BYTES = 700 * 1024;

// ---------------------------------------------------------------------------
// Chains
// ---------------------------------------------------------------------------

export async function createChain(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await assertSuperadmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return { error: "Give the chain a name." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prompt_chains")
    .insert({ name, description: description || null, user_id: admin.id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/");
  redirect(`/chains/${data.id}`);
}

export async function updateChain(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertSuperadmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!id) return { error: "Missing chain id." };
  if (!name) return { error: "Give the chain a name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("prompt_chains")
    .update({ name, description: description || null })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/chains/${id}`);
  return {};
}

export async function deleteChain(formData: FormData): Promise<void> {
  await assertSuperadmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("prompt_chains").delete().eq("id", id);

  revalidatePath("/");
  redirect("/");
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export async function createStep(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertSuperadmin();

  const chainId = String(formData.get("chain_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!chainId) return { error: "Missing chain id." };
  if (!name) return { error: "Give the step a name." };
  if (!prompt) return { error: "The step needs a prompt / instruction." };

  const supabase = await createClient();

  // Next position = (current max) + 1.
  const { data: last } = await supabase
    .from("prompt_chain_steps")
    .select("position")
    .eq("chain_id", chainId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();
  const position = (last?.position ?? 0) + 1;

  const { error } = await supabase
    .from("prompt_chain_steps")
    .insert({ chain_id: chainId, position, name, prompt });
  if (error) return { error: error.message };

  revalidatePath(`/chains/${chainId}`);
  return {};
}

export async function updateStep(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertSuperadmin();

  const id = String(formData.get("id") ?? "");
  const chainId = String(formData.get("chain_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!id) return { error: "Missing step id." };
  if (!name) return { error: "Give the step a name." };
  if (!prompt) return { error: "The step needs a prompt / instruction." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("prompt_chain_steps")
    .update({ name, prompt })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/chains/${chainId}`);
  return {};
}

export async function deleteStep(formData: FormData): Promise<void> {
  await assertSuperadmin();

  const id = String(formData.get("id") ?? "");
  const chainId = String(formData.get("chain_id") ?? "");
  if (!id || !chainId) return;

  const supabase = await createClient();
  await supabase.from("prompt_chain_steps").delete().eq("id", id);

  // Renumber the survivors so positions stay 1..n with no gaps. Processing in
  // ascending order only ever decreases a position into an already-freed slot,
  // so there's no unique-constraint collision.
  const { data: rows } = await supabase
    .from("prompt_chain_steps")
    .select("id, position")
    .eq("chain_id", chainId)
    .order("position", { ascending: true });

  if (rows) {
    for (let i = 0; i < rows.length; i++) {
      const desired = i + 1;
      if (rows[i].position !== desired) {
        await supabase
          .from("prompt_chain_steps")
          .update({ position: desired })
          .eq("id", rows[i].id);
      }
    }
  }

  revalidatePath(`/chains/${chainId}`);
}

// Move a step one slot up or down (e.g. "move step 2 to step 1"). Swaps positions
// with the neighbor using a temporary out-of-range slot (-1), since the unique
// (chain_id, position) constraint commits per REST call.
export async function moveStep(formData: FormData): Promise<void> {
  await assertSuperadmin();

  const id = String(formData.get("id") ?? "");
  const chainId = String(formData.get("chain_id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || !chainId || (direction !== "up" && direction !== "down")) return;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("prompt_chain_steps")
    .select("id, position")
    .eq("chain_id", chainId)
    .order("position", { ascending: true });
  if (!rows) return;

  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= rows.length) return; // at a boundary

  const current = rows[index];
  const neighbor = rows[targetIndex];

  // current -> temp, neighbor -> current's old slot, current -> neighbor's old slot
  await supabase.from("prompt_chain_steps").update({ position: -1 }).eq("id", current.id);
  await supabase
    .from("prompt_chain_steps")
    .update({ position: current.position })
    .eq("id", neighbor.id);
  await supabase
    .from("prompt_chain_steps")
    .update({ position: neighbor.position })
    .eq("id", current.id);

  revalidatePath(`/chains/${chainId}`);
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export type GenerateState = {
  error?: string;
  ok?: boolean;
  usedMock?: boolean;
};

export async function generateMedia(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  await assertSuperadmin();

  const chainId = String(formData.get("chain_id") ?? "");
  const inputText = String(formData.get("input_text") ?? "").trim();
  if (!chainId) return { error: "Missing chain id." };

  const supabase = await createClient();

  const { data: steps, error: stepsError } = await supabase
    .from("prompt_chain_steps")
    .select("id, chain_id, position, name, prompt, created_at, updated_at")
    .eq("chain_id", chainId)
    .order("position", { ascending: true })
    .returns<PromptChainStep[]>();
  if (stepsError) return { error: stepsError.message };
  if (!steps || steps.length === 0) {
    return { error: "Add at least one step before generating." };
  }

  // Optional image for the first step.
  let image: { base64: string; mediaType: string } | null = null;
  let storedImageUrl: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { error: "Image must be a JPEG, PNG, GIF or WebP file." };
    }
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    image = { base64, mediaType: file.type };
    if (file.size <= MAX_STORED_IMAGE_BYTES) {
      storedImageUrl = `data:${file.type};base64,${base64}`;
    }
  }

  if (!inputText && !image) {
    return { error: "Provide some text or an image to feed into the chain." };
  }

  const defs: ChainStepDef[] = steps.map((s) => ({ name: s.name, prompt: s.prompt }));

  let result;
  try {
    result = await runChain(defs, { text: inputText || null, image });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Generation failed." };
  }

  const admin = await assertSuperadmin();
  const { error: insertError } = await supabase.from("generated_media").insert({
    chain_id: chainId,
    created_by: admin.id,
    input_type: image ? "image" : "text",
    input_text: inputText || null,
    input_image_url: storedImageUrl,
    steps: result.steps,
    final_output: result.final,
    used_mock: result.usedMock,
  });
  if (insertError) return { error: insertError.message };

  revalidatePath(`/chains/${chainId}`);
  revalidatePath("/media");
  return { ok: true, usedMock: result.usedMock };
}

export async function deleteMedia(formData: FormData): Promise<void> {
  await assertSuperadmin();
  const id = String(formData.get("id") ?? "");
  const chainId = String(formData.get("chain_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("generated_media").delete().eq("id", id);

  if (chainId) revalidatePath(`/chains/${chainId}`);
  revalidatePath("/media");
}
