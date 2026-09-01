"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("suivant") || "/semaine";
  const guestUnavailable = params.get("invite") === "impossible";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [guestPending, setGuestPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onGuest() {
    setGuestPending(true);
    setError(null);
    setNotice(null);

    const { error } = await createClient().auth.signInAnonymously();
    if (error) {
      setError(translate(error.message));
      setGuestPending(false);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(translate(error.message));
        setPending(false);
        return;
      }
      // Session absente = confirmation par e-mail activée sur le projet.
      if (!data.session) {
        setNotice(
          "Compte créé. Ouvrez l'e-mail de confirmation, puis revenez vous connecter.",
        );
        setMode("signin");
        setPending(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(translate(error.message));
        setPending(false);
        return;
      }
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <>
      {!guestUnavailable && (
        <div className="card mb-4 p-5">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={onGuest}
            disabled={guestPending || pending}
          >
            {guestPending ? "Ouverture…" : "Utiliser sans compte"}
          </button>
          <p className="mt-2.5 text-center text-xs text-[var(--muted)]">
            Accès immédiat. Le planning est enregistré pour ce navigateur ; vous
            pourrez lui associer un e-mail plus tard pour le retrouver ailleurs.
          </p>
        </div>
      )}

      {guestUnavailable && (
        <p className="card mb-4 p-4 text-sm text-[var(--muted)]">
          L&rsquo;accès sans compte n&rsquo;est pas disponible : la connexion
          anonyme doit être activée dans Supabase (Authentication → Sign In /
          Providers → Anonymous Sign-Ins). En attendant, connectez-vous ci-dessous.
        </p>
      )}

      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          ou
        </span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="email">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            className="field"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            className="field"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === "signup" && (
            <p className="mt-1.5 text-xs text-[var(--muted)]">6 caractères minimum.</p>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-3 py-2 text-sm text-[var(--danger)]"
          >
            {error}
          </p>
        )}

        {notice && (
          <p className="rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]">
            {notice}
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending
            ? "Un instant…"
            : mode === "signin"
              ? "Se connecter"
              : "Créer le compte"}
        </button>

        <p className="text-center text-sm text-[var(--muted)]">
          {mode === "signin" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
          <button
            type="button"
            className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
          >
            {mode === "signin" ? "Créer un compte" : "Se connecter"}
          </button>
        </p>
      </form>
    </>
  );
}

/** Les messages Supabase sont en anglais : on traduit les plus fréquents. */
function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Un compte existe déjà avec cette adresse.";
  }
  if (m.includes("email not confirmed")) {
    return "Adresse e-mail pas encore confirmée : vérifiez votre boîte de réception.";
  }
  if (m.includes("password should be at least")) {
    return "Le mot de passe doit faire au moins 6 caractères.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  return message;
}
