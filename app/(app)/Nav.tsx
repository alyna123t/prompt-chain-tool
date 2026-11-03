"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Chains" },
  { href: "/media", label: "Generated media" },
];

export default function Nav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/chains");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="flex flex-wrap gap-1">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            isActive(l.href)
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
