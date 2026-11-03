"use client";

import { useActionState, useRef } from "react";
import { generateMedia, type GenerateState } from "../actions";
import { Card, Field, ErrorBanner, inputClass, textareaClass } from "../../components/ui";

export default function GeneratePanel({
  chainId,
  hasSteps,
  hasApiKey,
}: {
  chainId: string;
  hasSteps: boolean;
  hasApiKey: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<GenerateState, FormData>(
    async (prev, fd) => {
      const result = await generateMedia(prev, fd);
      if (result.ok) formRef.current?.reset();
      return result;
    },
    {},
  );

  return (
    <Card title="Generate media" subtitle="Run the whole chain on an input and save the result below.">
      {!hasApiKey ? (
        <p className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
          No <code>ANTHROPIC_API_KEY</code> is set, so generation will produce{" "}
          <strong>mock output</strong>. Add the key in your Vercel env vars for real AI
          results.
        </p>
      ) : null}

      <form ref={formRef} action={action} className="space-y-4">
        <input type="hidden" name="chain_id" value={chainId} />

        <Field label="Text input" hint="Fed into step 1 (optional if you upload an image).">
          <textarea
            name="input_text"
            rows={3}
            placeholder="Paste text here, or upload an image below."
            className={textareaClass}
          />
        </Field>

        <Field label="Image input" hint="Optional — JPEG, PNG, GIF or WebP. Great for an image → description → … chain.">
          <input
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-[var(--accent)] file:px-3 file:py-1 file:text-white`}
          />
        </Field>

        <ErrorBanner message={state.error} />
        {state.ok ? (
          <p className="rounded-lg border border-[var(--positive)] bg-[var(--surface-2)] p-3 text-sm text-[var(--positive)]">
            Done! {state.usedMock ? "(mock output — set an API key for real results) " : ""}
            Scroll down to see it.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || !hasSteps}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-60"
        >
          {pending ? "Running chain…" : hasSteps ? "Generate" : "Add a step first"}
        </button>
      </form>
    </Card>
  );
}
