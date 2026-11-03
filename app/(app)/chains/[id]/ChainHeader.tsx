"use client";

import { useActionState, useState } from "react";
import { updateChain, deleteChain, type FormState } from "../actions";
import DeleteButton from "../../components/DeleteButton";
import {
  Field,
  ErrorBanner,
  inputClass,
  textareaClass,
  primaryBtnSm,
} from "../../components/ui";
import type { PromptChain } from "@/lib/types";

export default function ChainHeader({ chain }: { chain: PromptChain }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      const result = await updateChain(prev, fd);
      if (!result.error) setEditing(false);
      return result;
    },
    {},
  );

  if (!editing) {
    return (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{chain.name}</h1>
          {chain.description ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{chain.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
          >
            Edit
          </button>
          <DeleteButton
            action={deleteChain}
            hidden={{ id: chain.id }}
            label="Delete chain"
            confirmText="Delete this entire chain, its steps and all its generations? This cannot be undone."
          />
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <input type="hidden" name="id" value={chain.id} />
      <Field label="Name">
        <input name="name" required defaultValue={chain.name} maxLength={120} className={inputClass} />
      </Field>
      <Field label="Description">
        <textarea
          name="description"
          rows={3}
          defaultValue={chain.description ?? ""}
          className={textareaClass}
        />
      </Field>
      <ErrorBanner message={state.error} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryBtnSm}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
