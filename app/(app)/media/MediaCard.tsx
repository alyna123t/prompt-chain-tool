import Link from "next/link";
import Image from "next/image";
import type { GeneratedMedia } from "@/lib/types";

// A compact, clickable gallery card: thumbnail + chain name + a snippet of the
// final result. The full input → steps → final breakdown lives on /media/[id].
export default function MediaCard({
  media,
  chainName,
}: {
  media: GeneratedMedia;
  chainName: string;
}) {
  const stepCount = media.steps.length;
  const subtitle = media.final_output?.trim() || media.input_text?.trim() || "";

  return (
    <Link
      href={`/media/${media.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-colors hover:border-[var(--accent)]"
    >
      <Thumb media={media} />

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{chainName}</p>
          {media.used_mock ? (
            <span className="shrink-0 rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--muted)]">
              Mock
            </span>
          ) : null}
        </div>

        {subtitle ? (
          <p className="line-clamp-2 text-xs text-[var(--muted)]">{subtitle}</p>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-1 font-[family-name:var(--font-mono)] text-[11px] tabular-nums text-[var(--muted)]">
          <span>{new Date(media.created_at).toLocaleDateString()}</span>
          <span aria-hidden>·</span>
          <span>
            {stepCount} step{stepCount === 1 ? "" : "s"}
          </span>
          <span className="ml-auto text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

function Thumb({ media }: { media: GeneratedMedia }) {
  if (media.input_image_url) {
    return (
      <div className="relative aspect-video overflow-hidden bg-[var(--surface-2)]">
        <Image
          src={media.input_image_url}
          alt="Dish input"
          fill
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
    );
  }

  // Text input (or an image too large to store a preview): show a text tile.
  const preview =
    media.input_text?.trim() ||
    (media.input_type === "image" ? "Image input" : "No input");

  return (
    <div className="flex aspect-video items-center bg-[var(--surface-2)] p-4">
      <p className="line-clamp-3 text-sm text-[var(--muted)]">{preview}</p>
    </div>
  );
}
