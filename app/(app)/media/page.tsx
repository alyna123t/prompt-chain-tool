import { createClient } from "@/lib/supabase/server";
import MediaCard from "./MediaCard";
import type { GeneratedMedia } from "@/lib/types";

export const dynamic = "force-dynamic";

type MediaRow = GeneratedMedia & { prompt_chains: { name: string } | null };

export default async function MediaPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_media")
    .select(
      "id, chain_id, created_by, input_type, input_text, input_image_url, steps, " +
        "final_output, used_mock, created_at, prompt_chains(name)",
    )
    .order("created_at", { ascending: false })
    .returns<MediaRow[]>();

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Generated media</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          <span className="font-[family-name:var(--font-mono)] tabular-nums">
            {rows.length}
          </span>{" "}
          generation{rows.length === 1 ? "" : "s"} across all chains
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load media: {error.message}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
          Nothing generated yet. Open a chain and run it to produce media.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((m) => (
            <MediaCard
              key={m.id}
              media={m}
              chainName={m.prompt_chains?.name ?? "Unknown chain"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
