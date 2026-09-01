import Link from "next/link";
import { ViewSwitcher, type ViewKey } from "./ViewSwitcher";

export function PageHeader({
  view,
  date,
  title,
  subtitle,
  prev,
  next,
  today,
  meta,
}: {
  view: ViewKey;
  date: string;
  title: string;
  subtitle?: React.ReactNode;
  prev: string;
  next: string;
  today: string;
  meta?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-col gap-3 sm:mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-[var(--border-strong)] bg-[var(--surface)]">
            <Link
              href={prev}
              aria-label="Période précédente"
              className="px-2.5 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-muted)]"
            >
              ‹
            </Link>
            <Link
              href={today}
              className="border-x border-[var(--border-strong)] px-3 py-1.5 text-[0.8125rem] font-semibold hover:bg-[var(--surface-muted)]"
            >
              Aujourd&rsquo;hui
            </Link>
            <Link
              href={next}
              aria-label="Période suivante"
              className="px-2.5 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-muted)]"
            >
              ›
            </Link>
          </div>
        </div>

        <ViewSwitcher current={view} date={date} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {meta}
      </div>

      {subtitle && <p className="-mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
    </header>
  );
}
