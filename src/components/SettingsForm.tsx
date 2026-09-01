"use client";

import { useActionState } from "react";
import { saveSettingsAction, type ActionState } from "@/lib/actions";
import type { Settings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveSettingsAction,
    {},
  );

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <div>
        <label className="label" htmlFor="reference">
          Semaine de référence
        </label>
        <input
          id="reference"
          type="date"
          name="reference"
          className="field"
          defaultValue={settings.anchor_monday}
          required
        />
        <p className="mt-1.5 text-xs text-[var(--muted)]">
          N&rsquo;importe quel jour de la semaine convient : la semaine entière est
          prise en compte.
        </p>
      </div>

      <fieldset>
        <legend className="label">Cette semaine-là est une…</legend>
        <div className="flex gap-2">
          {(["A", "B"] as const).map((type) => (
            <label key={type} className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="week_type"
                value={type}
                defaultChecked={settings.anchor_week_type === type}
                className="peer sr-only"
              />
              <span className="block rounded-lg border border-[var(--border-strong)] px-3 py-2 text-center text-sm font-semibold text-[var(--muted)] peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent-soft)] peer-checked:text-[var(--accent)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--accent)]">
                Semaine {type}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-3 py-2 text-sm text-[var(--danger)]"
        >
          {state.error}
        </p>
      )}

      {state.ok && !pending && (
        <p className="rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]">
          Alternance enregistrée.
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
