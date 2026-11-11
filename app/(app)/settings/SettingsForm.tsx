"use client";

import { useActionState } from "react";
import { saveSettings, removeApiKey, type SettingsState } from "./actions";
import type { SettingsView } from "@/lib/settings";
import {
  Card,
  Field,
  ErrorBanner,
  inputClass,
  primaryBtn,
  ghostBtnSm,
} from "../components/ui";

const MODELS = [
  { value: "claude-opus-5-5", label: "Opus 5.5 — most capable" },
  { value: "claude-sonnet-5-5", label: "Sonnet 5.5 — balanced" },
  { value: "claude-haiku-5-5", label: "Haiku 5.5 — fastest / cheapest" },
];

export default function SettingsForm({ view }: { view: SettingsView }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveSettings,
    {},
  );

  return (
    <div className="space-y-4">
      <Card title="API key" subtitle="Used to cook recipes into dishes">
        <Status view={view} />

        <form action={action} className="mt-4 space-y-5">
          <Field
            label="Anthropic API key"
            hint={
              view.hasKey
                ? "Leave blank to keep the current key. Paste a new key to replace it."
                : "Paste your key (starts with sk-ant-). Get one at console.anthropic.com."
            }
          >
            <input
              name="api_key"
              type="password"
              autoComplete="off"
              placeholder={view.hasKey ? "•••••••••• (unchanged)" : "sk-ant-..."}
              className={`${inputClass} font-[family-name:var(--font-mono)]`}
            />
          </Field>

          <Field label="Model" hint="Which Claude model each recipe step calls">
            <select name="model" defaultValue={view.model} className={inputClass}>
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>

          <ErrorBanner message={state.error} />
          {state.ok ? (
            <p className="rounded-lg border border-[var(--border)] bg-[var(--accent-light)] p-3 text-sm text-[var(--foreground)]">
              Saved. New dishes will use these settings.
            </p>
          ) : null}

          <button type="submit" disabled={pending} className={primaryBtn}>
            {pending ? "Saving…" : "Save settings"}
          </button>
        </form>
      </Card>

      {view.canRemove ? (
        <Card title="Remove key" subtitle="Delete the stored key and fall back to mock output">
          <form action={removeApiKey}>
            <button type="submit" className={ghostBtnSm}>
              Remove stored API key
            </button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}

function Status({ view }: { view: SettingsView }) {
  if (!view.hasKey) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--border)] p-3 text-sm text-[var(--muted)]">
        No key set — cooking returns labeled{" "}
        <span className="font-medium text-[var(--foreground)]">mock</span> output.
      </p>
    );
  }

  const source =
    view.keySource === "database"
      ? "stored in the database"
      : "from the ANTHROPIC_API_KEY environment variable";

  return (
    <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)] align-middle" />{" "}
      Key active —{" "}
      <span className="font-[family-name:var(--font-mono)] text-[var(--muted)]">
        {view.maskedKey}
      </span>{" "}
      <span className="text-[var(--muted)]">({source})</span>
    </p>
  );
}
