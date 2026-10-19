import Link from "next/link";
import { SettingsForm } from "@/components/SettingsForm";
import { WeekBadge } from "@/components/WeekBadge";
import { getSettings } from "@/lib/queries";
import { addDays, formatWeekRange, mondayOf, todayISO } from "@/lib/date";
import { weekTypeFor } from "@/lib/schedule";

export const metadata = { title: "Réglages — Mon planning A/B" };

export default async function ReglagesPage() {
  const settings = await getSettings();

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
    </div>
  );
}
