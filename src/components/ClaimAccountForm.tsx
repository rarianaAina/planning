"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Transforme la session invitée en compte permanent. L'identifiant Supabase
 * de l'utilisateur ne change pas : le planning déjà saisi est conservé tel
 * quel, rien n'est à recopier.
 */
export function ClaimAccountForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    const { data, error } = await createClient().auth.updateUser({
      email,
      password,
    });

    if (error) {
      setError(translate(error.message));
      setPending(false);
      return;
    }

    // Si le projet exige une confirmation, l'adresse reste « en attente »
    // dans `new_email` tant que le lien reçu n'a pas été ouvert.
    if (data.user?.new_email || data.user?.is_anonymous) {
      setNotice(
        `Un e-mail de confirmation a été envoyé à ${email}. Ouvrez le lien qu'il contient pour terminer. Votre planning reste accessible ici en attendant.`,
      );
      setPending(false);
      return;
    }

    setNotice("Compte enregistré. Votre planning est désormais sauvegardé.");
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <div>
        <label className="label" htmlFor="claim-email">
          Adresse e-mail
        </label>
        <input
          id="claim-email"
          type="email"
          className="field"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="claim-password">
          Mot de passe
        </label>
        <input
          id="claim-password"
          type="password"
          className="field"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p className="mt-1.5 text-xs text-[var(--muted)]">6 caractères minimum.</p>
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

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer mon planning"}
      </button>
    </form>
  );
}

function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Un compte existe déjà avec cette adresse. Connectez-vous plutôt depuis l'écran de connexion — attention, le planning saisi en invité ne sera pas transféré.";
  }
  if (m.includes("password should be at least")) {
    return "Le mot de passe doit faire au moins 6 caractères.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  return message;
}
