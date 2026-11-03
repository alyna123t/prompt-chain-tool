import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, primaryBtn } from "./components/ui";
import type { PromptChain } from "@/lib/types";

export const dynamic = "force-dynamic";

type ChainRow = PromptChain & {
  prompt_chain_steps: { count: number }[];
  generated_media: { count: number }[];
};

export default async function ChainsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prompt_chains")
    .select(
      "id, user_id, name, description, created_at, updated_at, " +
        "prompt_chain_steps(count), generated_media(count)",
    )
    .order("updated_at", { ascending: false })
    .returns<ChainRow[]>();

  const chains = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prompt chains</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            <span className="font-[family-name:var(--font-mono)] tabular-nums">
              {chains.length}
            </span>{" "}
            chain{chains.length === 1 ? "" : "s"} · build multi-step AI pipelines
          </p>
        </div>
        <Link href="/chains/new" className={primaryBtn}>
          New chain
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load chains: {error.message}
        </p>
      ) : null}

      {chains.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            No chains yet. Create your first one with “New chain”. A chain is an ordered
            list of steps — e.g. describe an image → make it funny → write five captions.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {chains.map((c) => {
            const steps = c.prompt_chain_steps?.[0]?.count ?? 0;
            const media = c.generated_media?.[0]?.count ?? 0;
            return (
              <Link key={c.id} href={`/chains/${c.id}`} className="block">
                <Card className="h-full transition-colors hover:bg-[var(--surface-2)]">
                  <h2 className="font-medium">{c.name}</h2>
                  {c.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                      {c.description}
                    </p>
                  ) : null}
                  <p className="mt-3 font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--muted)]">
                    {steps} step{steps === 1 ? "" : "s"} · {media} generation
                    {media === 1 ? "" : "s"} · updated{" "}
                    {new Date(c.updated_at).toLocaleDateString()}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
