"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createChain, type FormState } from "../actions";
import {
  Card,
  Field,
  ErrorBanner,
  inputClass,
  textareaClass,
  primaryBtn,
} from "../../components/ui";

export default function NewChainPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(createChain, {});

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Back to recipes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New recipe</h1>
      </div>

      <Card>
        <form action={action} className="space-y-5">
          <Field label="Name">
            <input
              name="name"
              required
              maxLength={120}
              placeholder="e.g. Dish photo → menu copy → captions"
              className={inputClass}
            />
          </Field>

          <Field label="Description" hint="Optional — what this recipe is for">
            <textarea
              name="description"
              rows={3}
              placeholder="Takes a dish photo and plates out a menu description plus five social captions"
              className={textareaClass}
            />
          </Field>

          <ErrorBanner message={state.error} />

          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className={primaryBtn}>
              {pending ? "Creating…" : "Create recipe"}
            </button>
            <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
