"use client";

type Action = (formData: FormData) => void | Promise<void>;

// Generic confirm-then-submit delete button used for chains, steps and media.
export default function DeleteButton({
  action,
  hidden,
  label = "Delete",
  confirmText = "Delete this permanently? This cannot be undone.",
  className = "",
}: {
  action: Action;
  hidden: Record<string, string>;
  label?: string;
  confirmText?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        className={
          className ||
          "rounded-lg border border-[var(--negative)] px-3 py-1.5 text-sm font-medium text-[var(--negative)] transition-colors hover:bg-[var(--negative)] hover:text-white"
        }
      >
        {label}
      </button>
    </form>
  );
}
