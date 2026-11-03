"use client";

import { useActionState, useState } from "react";
import {
  createStep,
  updateStep,
  deleteStep,
  moveStep,
  type FormState,
} from "../actions";
import DeleteButton from "../../components/DeleteButton";
import { Field, ErrorBanner, inputClass, textareaClass } from "../../components/ui";
import type { PromptChainStep } from "@/lib/types";

export default function StepsEditor({
  chainId,
  steps,
}: {
  chainId: string;
  steps: PromptChainStep[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Steps ({steps.length})
        </h2>
      </div>

      {steps.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
          No steps yet. Add the first step below. Step 1 receives the input you provide at
          generation time; each later step receives the previous step&apos;s output.
        </p>
      ) : (
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <StepRow
              key={step.id}
              step={step}
              chainId={chainId}
              index={i}
              isFirst={i === 0}
              isLast={i === steps.length - 1}
            />
          ))}
        </ol>
      )}

      <AddStep chainId={chainId} />
    </div>
  );
}

function StepRow({
  step,
  chainId,
  index,
  isFirst,
  isLast,
}: {
  step: PromptChainStep;
  chainId: string;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      const result = await updateStep(prev, fd);
      if (!result.error) setEditing(false);
      return result;
    },
    {},
  );

  return (
    <li className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
            {index + 1}
          </span>
          <ReorderButton chainId={chainId} stepId={step.id} direction="up" disabled={isFirst} />
          <ReorderButton chainId={chainId} stepId={step.id} direction="down" disabled={isLast} />
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <form action={action} className="space-y-3">
              <input type="hidden" name="id" value={step.id} />
              <input type="hidden" name="chain_id" value={chainId} />
              <Field label="Step name">
                <input name="name" required defaultValue={step.name} className={inputClass} />
              </Field>
              <Field label="Prompt / instruction">
                <textarea
                  name="prompt"
                  required
                  rows={3}
                  defaultValue={step.prompt}
                  className={textareaClass}
                />
              </Field>
              <ErrorBanner message={state.error} />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-60"
                >
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
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold">{step.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[var(--surface-2)]"
                  >
                    Edit
                  </button>
                  <DeleteButton
                    action={deleteStep}
                    hidden={{ id: step.id, chain_id: chainId }}
                    label="Delete"
                    confirmText={`Delete step "${step.name}"?`}
                    className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--negative)] transition-colors hover:bg-[var(--negative)] hover:text-white"
                  />
                </div>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--muted)]">
                {step.prompt}
              </p>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function ReorderButton({
  chainId,
  stepId,
  direction,
  disabled,
}: {
  chainId: string;
  stepId: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  return (
    <form action={moveStep}>
      <input type="hidden" name="id" value={stepId} />
      <input type="hidden" name="chain_id" value={chainId} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={`Move step ${direction}`}
        title={`Move ${direction}`}
        className="flex h-5 w-5 items-center justify-center rounded border border-[var(--border)] text-xs text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-30"
      >
        {direction === "up" ? "↑" : "↓"}
      </button>
    </form>
  );
}

function AddStep({ chainId }: { chainId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      const result = await createStep(prev, fd);
      if (!result.error) setOpen(false);
      return result;
    },
    {},
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-[var(--border)] py-3 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        + Add step
      </button>
    );
  }

  return (
    <form
      action={action}
      className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <input type="hidden" name="chain_id" value={chainId} />
      <Field label="Step name">
        <input name="name" required placeholder="e.g. Describe the image" className={inputClass} />
      </Field>
      <Field
        label="Prompt / instruction"
        hint="What this step should do with its input."
      >
        <textarea
          name="prompt"
          required
          rows={3}
          placeholder="Describe this image in one vivid sentence."
          className={textareaClass}
        />
      </Field>
      <ErrorBanner message={state.error} />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add step"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
