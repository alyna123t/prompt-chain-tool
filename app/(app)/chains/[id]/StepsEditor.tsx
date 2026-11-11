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
import { ChevronUpIcon, ChevronDownIcon } from "../../components/icons";
import {
  Field,
  ErrorBanner,
  inputClass,
  textareaClass,
  primaryBtnSm,
  ghostBtnSm,
} from "../../components/ui";
import type { PromptChainStep } from "@/lib/types";

export default function StepsEditor({
  chainId,
  steps,
}: {
  chainId: string;
  steps: PromptChainStep[];
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-[var(--foreground)]">
        Steps{" "}
        <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--muted)]">
          {steps.length}
        </span>
      </h2>

      {steps.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
          No steps yet. Add the first step below. Step 1 receives the ingredients you provide
          when you cook the recipe; each later step receives the previous step&apos;s output.
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
    <li className="flex gap-3">
      {/* Chain rail: amber node joined to the next by a hairline connector. */}
      <div className="relative flex w-7 flex-col items-center pt-4">
        {!isLast ? (
          <span
            className="absolute left-1/2 top-9 bottom-[-12px] w-px -translate-x-1/2 bg-[var(--border)]"
            aria-hidden
          />
        ) : null}
        <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--background)]">
          {index + 1}
        </span>
      </div>

      <div className="min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
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
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-medium">{step.name}</h3>
              <div className="flex items-center gap-1">
                <ReorderButton chainId={chainId} stepId={step.id} direction="up" disabled={isFirst} />
                <ReorderButton chainId={chainId} stepId={step.id} direction="down" disabled={isLast} />
                <button onClick={() => setEditing(true)} className={ghostBtnSm}>
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
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-[var(--muted)]">
              {step.prompt}
            </p>
          </>
        )}
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
  const Icon = direction === "up" ? ChevronUpIcon : ChevronDownIcon;
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
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Icon size={15} />
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
        className="w-full rounded-xl border border-dashed border-[var(--border)] py-3 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--muted)] hover:text-[var(--foreground)]"
      >
        Add step
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
        <input name="name" required placeholder="e.g. Describe the dish" className={inputClass} />
      </Field>
      <Field label="Prompt / instruction" hint="What this step should do with its input">
        <textarea
          name="prompt"
          required
          rows={3}
          placeholder="Describe this dish photo in one vivid, appetizing sentence"
          className={textareaClass}
        />
      </Field>
      <ErrorBanner message={state.error} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryBtnSm}>
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
