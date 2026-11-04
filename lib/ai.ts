import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { StepResult } from "@/lib/types";

export type ChainStepDef = { name: string; prompt: string };

export type ChainInput = {
  text?: string | null;
  image?: { base64: string; mediaType: string } | null;
};

// Resolved server-side by lib/settings.ts (DB key/model, else env, else default).
export type RunConfig = {
  apiKey: string | null;
  model: string;
};

export type RunResult = {
  steps: StepResult[];
  final: string;
  usedMock: boolean;
};

// Runs the chain: step 1 receives the initial input (text and/or an image); every
// later step receives the previous step's output. Each step's `prompt` is the
// instruction applied to that input. With no API key, returns labeled mock output
// so the app still works end-to-end.
export async function runChain(
  steps: ChainStepDef[],
  input: ChainInput,
  config: RunConfig,
): Promise<RunResult> {
  if (steps.length === 0) {
    throw new Error("This chain has no steps yet — add at least one step first.");
  }
  if (!config.apiKey) {
    return runMock(steps, input);
  }

  const client = new Anthropic({ apiKey: config.apiKey });
  const results: StepResult[] = [];
  let previous = "";

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const isFirst = i === 0;

    const content: Anthropic.ContentBlockParam[] = [];
    if (isFirst && input.image) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: input.image.mediaType as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp",
          data: input.image.base64,
        },
      });
    }

    const priorText = isFirst ? (input.text?.trim() ?? "") : previous;
    content.push({ type: "text", text: buildUserText(step.prompt, priorText, isFirst) });

    try {
      const response = await client.messages.create({
        model: config.model,
        max_tokens: 2000,
        system:
          "You are one step in a multi-step prompt chain. Apply the step's " +
          "instruction to the provided input and return ONLY the resulting content " +
          "— no preamble, no explanation, no markdown fences.",
        messages: [{ role: "user", content }],
      });

      const out = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      results.push({ name: step.name, prompt: step.prompt, output: out });
      previous = out;
    } catch (err) {
      const message =
        err instanceof Anthropic.APIError
          ? `Claude API error (${err.status ?? "?"}): ${err.message}`
          : err instanceof Error
            ? err.message
            : "Unknown error while calling the model.";
      throw new Error(`Step ${i + 1} ("${step.name}") failed: ${message}`);
    }
  }

  return { steps: results, final: previous, usedMock: false };
}

function buildUserText(prompt: string, priorText: string, isFirst: boolean): string {
  const label = isFirst ? "INPUT" : "INPUT (output of the previous step)";
  const body = priorText
    ? `${label}:\n${priorText}`
    : isFirst
      ? "INPUT: (see the attached image)"
      : "INPUT: (empty)";
  return `STEP INSTRUCTION:\n${prompt}\n\n${body}`;
}

// Deterministic, clearly-labeled stand-in so the deployed app works without a key.
function runMock(steps: ChainStepDef[], input: ChainInput): RunResult {
  const results: StepResult[] = [];
  let previous =
    input.text?.trim() ||
    (input.image ? "[an uploaded image]" : "[no input provided]");

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const output =
      `[MOCK OUTPUT — add an Anthropic API key in Settings for real generation]\n` +
      `Step ${i + 1} "${step.name}" applied the instruction:\n` +
      `  "${truncate(step.prompt, 160)}"\n` +
      `to the input:\n  "${truncate(previous, 160)}"`;
    results.push({ name: step.name, prompt: step.prompt, output });
    previous = output;
  }

  return { steps: results, final: previous, usedMock: true };
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
