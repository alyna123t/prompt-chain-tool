import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasApiKey } from "@/lib/ai";
import ChainHeader from "./ChainHeader";
import StepsEditor from "./StepsEditor";
import GeneratePanel from "./GeneratePanel";
import MediaItem from "../../components/MediaItem";
import type { GeneratedMedia, PromptChain, PromptChainStep } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ChainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: chain } = await supabase
    .from("prompt_chains")
    .select("id, user_id, name, description, created_at, updated_at")
    .eq("id", id)
    .maybeSingle<PromptChain>();

  if (!chain) notFound();

  const { data: steps } = await supabase
    .from("prompt_chain_steps")
    .select("id, chain_id, position, name, prompt, created_at, updated_at")
    .eq("chain_id", id)
    .order("position", { ascending: true })
    .returns<PromptChainStep[]>();

  const { data: media } = await supabase
    .from("generated_media")
    .select(
      "id, chain_id, created_by, input_type, input_text, input_image_url, steps, final_output, used_mock, created_at",
    )
    .eq("chain_id", id)
    .order("created_at", { ascending: false })
    .returns<GeneratedMedia[]>();

  const stepList = steps ?? [];
  const mediaList = media ?? [];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Back to chains
        </Link>
      </div>

      <ChainHeader chain={chain} />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <StepsEditor chainId={chain.id} steps={stepList} />
        </div>
        <div className="lg:col-span-2">
          <GeneratePanel
            chainId={chain.id}
            hasSteps={stepList.length > 0}
            hasApiKey={hasApiKey()}
          />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Generated media ({mediaList.length})
        </h2>
        {mediaList.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
            Nothing generated yet. Run the chain above to produce media.
          </p>
        ) : (
          <div className="space-y-4">
            {mediaList.map((m) => (
              <MediaItem key={m.id} media={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
