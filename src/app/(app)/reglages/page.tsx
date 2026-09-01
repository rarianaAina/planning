import Link from "next/link";
import { ClaimAccountForm } from "@/components/ClaimAccountForm";
import { SettingsForm } from "@/components/SettingsForm";
import { SubmitButton } from "@/components/SubmitButton";
import { WeekBadge } from "@/components/WeekBadge";
import { signOutAction } from "@/lib/actions";
import { getSettings, requireUser } from "@/lib/queries";
import { addDays, formatWeekRange, mondayOf, todayISO } from "@/lib/date";
import { weekTypeFor } from "@/lib/schedule";

export const metadata = { title: "Réglages — Mon planning A/B" };

export default async function ReglagesPage() {
  const [{ user }, settings] = await Promise.all([requireUser(), getSettings()]);

  const thisMonday = mondayOf(todayISO());
  const upcoming = Array.from({ length: 6 }, (_, i) => {
    const monday = addDays(thisMonday, i * 7);
    return { monday, type: weekTypeFor(monday, settings) };
  });

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-5">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Réglages</h1>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          Indiquez une semaine dont vous êtes sûr, et si elle est de type A ou B.
          Toutes les autres en découlent par alternance.
        </p>
      </header>

      <SettingsForm settings={settings} />

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">Prochaines semaines</h2>
        <ul className="card divide-y divide-[var(--border)] overflow-hidden">
          {upcoming.map(({ monday, type }, i) => (
            <li key={monday}>
              <Link
                href={`/semaine?d=${monday}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-[var(--surface-muted)]"
              >
                <span>
                  {formatWeekRange(monday)}
                  {i === 0 && (
                    <span className="ml-2 text-xs text-[var(--muted)]">
                      (semaine en cours)
                    </span>
                  )}
                </span>
                <WeekBadge type={type} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="compte" className="mt-6 scroll-mt-20">
        <h2 className="mb-2 text-sm font-semibold">Compte</h2>

        {user.is_anonymous ? (
          <>
            <p className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-[var(--muted)]">
              Vous utilisez l&rsquo;application <strong>sans compte</strong>. Votre
              planning est bien enregistré, mais rattaché à ce navigateur
              uniquement&nbsp;: en effaçant les données du navigateur ou en
              passant sur un autre appareil, vous ne le retrouveriez pas.
              Associez-lui une adresse e-mail pour le conserver — tout ce que
              vous avez déjà saisi est gardé.
            </p>
            <ClaimAccountForm />
          </>
        ) : (
          <>
            <div className="card px-4 py-3 text-sm">
              <span className="text-[var(--muted)]">Connecté en tant que </span>
              <span className="font-medium">{user.email}</span>
            </div>
            <form action={signOutAction} className="mt-3">
              <SubmitButton className="btn" pendingLabel="…">
                Se déconnecter
              </SubmitButton>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
