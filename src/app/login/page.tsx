import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Connexion — Mon planning A/B" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <span
          aria-hidden
          className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-[var(--accent)] text-sm font-black text-white dark:text-[#10121a]"
        >
          AB
        </span>
        <h1 className="text-xl font-bold tracking-tight">Mon planning A/B</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Votre emploi du temps en semaines alternées, par jour, semaine ou mois.
        </p>
      </div>

      <Suspense fallback={<div className="card h-80 animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
