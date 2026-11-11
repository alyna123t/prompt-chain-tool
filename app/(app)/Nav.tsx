"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Recipes" },
  { href: "/media", label: "Dishes" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/chains");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="flex flex-wrap gap-1">
      {LINKS.map((l) => {
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-[var(--surface-2)] font-medium text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                active ? "bg-[var(--accent)]" : "bg-transparent"
              }`}
              aria-hidden
            />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
