import Link from "next/link";

const VIEWS = [
  { key: "jour", label: "Jour", href: "/jour" },
  { key: "semaine", label: "Semaine", href: "/semaine" },
  { key: "mois", label: "Mois", href: "/mois" },
] as const;

export type ViewKey = (typeof VIEWS)[number]["key"];

export function ViewSwitcher({ current, date }: { current: ViewKey; date: string }) {
  return (
    <nav
      aria-label="Changer de vue"
      className="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-0.5"
    >
      {VIEWS.map((v) => {
        const active = v.key === current;
        return (
          <Link
            key={v.key}
            href={`${v.href}?d=${date}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-[0.8125rem] font-semibold transition-colors ${
              active
                ? "bg-[var(--accent)] text-white dark:text-[#10121a]"
                : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
