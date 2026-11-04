import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MediaItem from "../../components/MediaItem";
import type { GeneratedMedia } from "@/lib/types";

export const dynamic = "force-dynamic";

type MediaRow = GeneratedMedia & { prompt_chains: { name: string } | null };

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("generated_media")
    .select(
      "id, chain_id, created_by, input_type, input_text, input_image_url, steps, " +
        "final_output, used_mock, created_at, prompt_chains(name)",
    )
    .eq("id", id)
    .maybeSingle<MediaRow>();

  if (!data) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/media"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Back to generated media
        </Link>
      </div>

      <MediaItem
        media={data}
        chainName={data.prompt_chains?.name ?? "Unknown chain"}
        deleteRedirectTo="/media"
      />
    </div>
  );
}
