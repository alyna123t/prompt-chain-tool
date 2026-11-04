import Link from "next/link";
import Image from "next/image";
import { deleteMedia } from "../chains/actions";
import DeleteButton from "./DeleteButton";
import type { GeneratedMedia } from "@/lib/types";

export default function MediaItem({
  media,
  chainName,
  deleteRedirectTo,
}: {
  media: GeneratedMedia;
  chainName?: string;
  deleteRedirectTo?: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--muted)]">
            {new Date(media.created_at).toLocaleString()}
            {media.used_mock ? (
              <span className="ml-2 rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-[family-name:var(--font-sans)] text-[11px] font-medium text-[var(--muted)]">
                Mock
              </span>
            ) : null}
          </p>
          {chainName ? <p className="text-sm font-medium">{chainName}</p> : null}
        </div>
        <DeleteButton
          action={deleteMedia}
          hidden={{
            id: media.id,
            chain_id: media.chain_id,
            ...(deleteRedirectTo ? { redirect_to: deleteRedirectTo } : {}),
          }}
          label="Delete"
          confirmText="Delete this generation?"
        />
      </div>

      <div className="mt-3 space-y-3">
        <div className="rounded-lg bg-[var(--surface-2)] p-3">
          <p className="text-xs font-medium text-[var(--muted)]">Input</p>
          {media.input_image_url ? (
            <Image
              src={media.input_image_url}
              alt="Chain input"
              width={160}
              height={160}
              unoptimized
              className="mt-2 max-h-40 w-auto rounded-md border border-[var(--border)]"
            />
          ) : media.input_type === "image" ? (
            <p className="mt-1 text-sm text-[var(--muted)]">
              (image input — too large to store a preview)
            </p>
          ) : null}
          {media.input_text ? (
            <p className="mt-1 whitespace-pre-wrap text-sm">{media.input_text}</p>
          ) : null}
        </div>

        <ol className="space-y-2">
          {media.steps.map((s, i) => (
            <li key={i} className="rounded-lg border border-[var(--border)] p-3">
              <p className="text-xs font-medium text-[var(--muted)]">
                <span className="font-[family-name:var(--font-mono)] tabular-nums">
                  {i + 1}
                </span>{" "}
                · {s.name}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{s.output}</p>
            </li>
          ))}
        </ol>

        <div className="rounded-lg border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--accent-light)] p-3">
          <p className="text-xs font-medium text-[var(--accent)]">Final output</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{media.final_output}</p>
        </div>
      </div>

      {chainName === undefined ? null : (
        <div className="mt-3">
          <Link
            href={`/chains/${media.chain_id}`}
            className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
          >
            View chain →
          </Link>
        </div>
      )}
    </article>
  );
}
