import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MediaCard from "./MediaCard";
import type { GeneratedMedia } from "@/lib/types";

export const dynamic = "force-dynamic";

type MediaRow = GeneratedMedia & { prompt_chains: { name: string } | null };
type ChainCount = { id: string; name: string; generated_media: { count: number }[] };

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ chain?: string }>;
}) {
  const { chain: selectedChain } = await searchParams;
  const supabase = await createClient();

  // Chains that actually have media — used to build the filter chips.
  const { data: chainData } = await supabase
    .from("prompt_chains")
    .select("id, name, generated_media(count)")
    .order("name", { ascending: true })
    .returns<ChainCount[]>();

  const chains = (chainData ?? [])
    .map((c) => ({ id: c.id, name: c.name, count: c.generated_media?.[0]?.count ?? 0 }))
    .filter((c) => c.count > 0);

  const activeChain = chains.find((c) => c.id === selectedChain);

  // The media list, optionally filtered to the selected chain.
  let query = supabase
    .from("generated_media")
    .select(
      "id, chain_id, created_by, input_type, input_text, input_image_url, steps, " +
        "final_output, used_mock, created_at, prompt_chains(name)",
    )
    .order("created_at", { ascending: false });
  if (selectedChain) query = query.eq("chain_id", selectedChain);
  const { data, error } = await query.returns<MediaRow[]>();

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dishes</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          <span className="font-[family-name:var(--font-mono)] tabular-nums">
            {rows.length}
          </span>{" "}
          dish{rows.length === 1 ? "" : "es"}{" "}
          {activeChain ? (
            <>
              from <span className="text-[var(--foreground)]">{activeChain.name}</span>
            </>
          ) : (
            "across all recipes"
          )}
        </p>
      </div>

      {chains.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <FilterChip href="/media" label="All" active={!selectedChain} />
          {chains.map((c) => (
            <FilterChip
              key={c.id}
              href={`/media?chain=${c.id}`}
              label={c.name}
              count={c.count}
              active={c.id === selectedChain}
            />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load dishes: {error.message}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
          {selectedChain
            ? "No dishes from this recipe yet."
            : "Nothing plated yet. Open a recipe and cook it to serve your first dish."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((m) => (
            <MediaCard
              key={m.id}
              media={m}
              chainName={m.prompt_chains?.name ?? "Unknown recipe"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count?: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-[var(--accent)] bg-[var(--surface-2)] font-medium text-[var(--foreground)]"
          : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[var(--accent)]" : "bg-transparent"}`}
        aria-hidden
      />
      <span className="max-w-[12rem] truncate">{label}</span>
      {count !== undefined ? (
        <span className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--muted)]">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
