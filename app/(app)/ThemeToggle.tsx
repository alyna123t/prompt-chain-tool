"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀" },
  { value: "dark", label: "Dark", icon: "☾" },
  { value: "system", label: "System", icon: "🖥" },
];

// Light / Dark / System default. "system" removes the data-theme attribute so the
// CSS prefers-color-scheme media query decides; "light"/"dark" force it.
function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  } else {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }
}

export default function ThemeToggle() {
  // Start neutral so server and first client render match; sync from localStorage
  // after mount (a browser-only API) to avoid a hydration mismatch.
  const [state, setState] = useState<{ theme: Theme; mounted: boolean }>({
    theme: "system",
    mounted: false,
  });
  const { theme, mounted } = state;

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reflect the stored theme once after mount
    setState({
      theme: saved === "light" || saved === "dark" ? saved : "system",
      mounted: true,
    });
  }, []);

  function choose(next: Theme) {
    setState({ theme: next, mounted: true });
    apply(next);
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5"
      role="group"
      aria-label="Color theme"
    >
      {OPTIONS.map((o) => {
        const active = mounted && theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => choose(o.value)}
            aria-pressed={active}
            title={`${o.label} theme`}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <span aria-hidden>{o.icon}</span>
            <span className="ml-1 hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
