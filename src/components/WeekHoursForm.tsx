"use client";

import { useActionState, useState } from "react";
import { saveWeekHoursAction, type ActionState } from "@/lib/actions";
import { WEEKDAY_LABELS } from "@/lib/date";
import type { WeekType } from "@/lib/types";

/** État d'un jour du modèle tel qu'affiché dans la saisie rapide. */
export type DayHours =
  | { weekday: number; mode: "off" }
  | { weekday: number; mode: "work"; start: string; end: string }
  | { weekday: number; mode: "multi"; count: number };

type Mode = "off" | "work";

/**
 * Saisie rapide d'une semaine type : pour chaque jour, « Repos » ou
 * « Travail » avec une heure de début et de fin. Un seul bouton enregistre
 * les sept jours. Les jours à plusieurs créneaux se modifient dans le détail.
 */
export function WeekHoursForm({ week, days }: { week: WeekType; days: DayHours[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveWeekHoursAction,
    {},
  );
  const initialModes = (): Record<number, Mode> =>
    Object.fromEntries(
      days.filter((d) => d.mode !== "multi").map((d) => [d.weekday, d.mode as Mode]),
    );
  const [modes, setModes] = useState(initialModes);
  const [dirty, setDirty] = useState(false);

  // Le modèle a changé côté serveur (enregistrement, ou modification dans
  // le détail) : on repart de son état réel.
  const signature = JSON.stringify(days);
  const [seen, setSeen] = useState(signature);
  if (seen !== signature) {
    setSeen(signature);
    setModes(initialModes());
  }

  return (
    <form
      action={formAction}
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
      className="card divide-y divide-[var(--border)] overflow-hidden"
    >
      <input type="hidden" name="week_type" value={week} />

      {days.map((day) => {
        const label = WEEKDAY_LABELS[day.weekday - 1];
        const n = day.weekday;

        if (day.mode === "multi") {
          return (
            <div key={n} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="w-24 text-sm font-semibold">{label}</span>
              <span className="text-sm text-[var(--muted)]">
                {day.count} créneaux — à modifier dans le détail ci-dessous
              </span>
              <input type="hidden" name={`d${n}_mode`} value="keep" />
            </div>
          );
        }

        const mode = modes[n] ?? "off";
        const start = day.mode === "work" ? day.start : "09:00";
        const end = day.mode === "work" ? day.end : "17:00";

        return (
          <div key={n} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <span className="w-24 text-sm font-semibold">{label}</span>

            <div
              role="radiogroup"
              aria-label={`${label} : repos ou travail`}
              className="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-0.5"
            >
              {(["off", "work"] as const).map((value) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name={`d${n}_mode`}
                    value={value}
                    checked={mode === value}
                    onChange={() => setModes((m) => ({ ...m, [n]: value }))}
                    className="peer sr-only"
                  />
                  <span className="block rounded-md px-3 py-1 text-[0.8125rem] font-semibold text-[var(--muted)] peer-checked:bg-[var(--accent)] peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--accent)] dark:peer-checked:text-[#10121a]">
                    {value === "off" ? "Repos" : "Travail"}
                  </span>
                </label>
              ))}
            </div>

            {mode === "work" && (
              <div key={`${start}-${end}`} className="flex items-center gap-2 text-sm">
                <label className="sr-only" htmlFor={`d${n}-start`}>
                  {label} — début
                </label>
                <input
                  id={`d${n}-start`}
                  type="time"
                  name={`d${n}_start`}
                  defaultValue={start}
                  className="field !w-auto"
                  required
                />
                <span className="text-[var(--muted)]">à</span>
                <label className="sr-only" htmlFor={`d${n}-end`}>
                  {label} — fin
                </label>
                <input
                  id={`d${n}-end`}
                  type="time"
                  name={`d${n}_end`}
                  defaultValue={end}
                  className="field !w-auto"
                  required
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-3 bg-[var(--surface-muted)] px-4 py-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : `Enregistrer la semaine ${week}`}
        </button>
        {state.error && (
          <p role="alert" className="text-sm text-[var(--danger)]">
            {state.error}
          </p>
        )}
        {state.ok && !pending && !dirty && (
          <p className="text-sm text-[var(--accent)]">Semaine {week} enregistrée.</p>
        )}
      </div>
    </form>
  );
}
