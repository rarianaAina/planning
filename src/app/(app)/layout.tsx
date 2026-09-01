import Link from "next/link";
import { signOutAction } from "@/lib/actions";
import { requireUser } from "@/lib/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--surface)_88%,transparent)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/mois" className="flex items-center gap-2 font-bold tracking-tight">
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-lg bg-[var(--accent)] text-[0.7rem] font-black text-white dark:text-[#10121a]"
            >
              AB
            </span>
            <span className="hidden sm:inline">Mon planning</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/modele"
              className="rounded-lg px-2.5 py-1.5 text-[0.8125rem] font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)]"
            >
              Modèle A/B
            </Link>
            <Link
              href="/reglages"
              className="rounded-lg px-2.5 py-1.5 text-[0.8125rem] font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)]"
            >
              Réglages
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-lg px-2.5 py-1.5 text-[0.8125rem] font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                title={user.email ?? undefined}
              >
                Quitter
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
