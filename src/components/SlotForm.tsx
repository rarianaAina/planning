"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { COLORS, COLOR_NAMES, DEFAULT_COLOR } from "@/lib/colors";
import type { ActionState } from "@/lib/actions";

export type SlotInitial = {
  id?: string;
  title?: string;
  location?: string | null;
  start?: string;
  end?: string;
  color?: string;
};

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  /** Champs de contexte (date, semaine, jour) envoyés tels quels. */
  hidden?: Record<string, string>;
  initial?: SlotInitial;
  heading: string;
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerTitle?: string;
};

function Footer({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button type="button" className="btn" onClick={onCancel} disabled={pending}>
        Annuler
      </button>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}

export function SlotForm({
  action,
  hidden = {},
  initial = {},
  heading,
  trigger,
  triggerClassName = "btn",
  triggerTitle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const handled = useRef<ActionState | null>(null);

  // Ferme sur succès. La comparaison d'identité évite de refermer
  // instantanément une réouverture après un précédent succès.
  useEffect(() => {
    if (state.ok && handled.current !== state) {
      handled.current = state;
      setOpen(false);
    }
  }, [state]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        title={triggerTitle}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="card w-full max-w-md rounded-b-none p-5 shadow-xl sm:rounded-b-2xl">
            <h2 className="mb-4 text-base font-semibold">{heading}</h2>

            <form action={formAction} className="space-y-3.5">
              {Object.entries(hidden).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}
              {initial.id && <input type="hidden" name="id" value={initial.id} />}

              <div>
                <label className="label" htmlFor="slot-title">
                  Intitulé
                </label>
                <input
                  id="slot-title"
                  name="title"
                  className="field"
                  defaultValue={initial.title ?? ""}
                  placeholder="Travail, Cours, Réunion…"
                  maxLength={120}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="slot-start">
                    Début
                  </label>
                  <input
                    id="slot-start"
                    type="time"
                    name="start_time"
                    className="field"
                    defaultValue={initial.start ?? "08:00"}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="slot-end">
                    Fin
                  </label>
                  <input
                    id="slot-end"
                    type="time"
                    name="end_time"
                    className="field"
                    defaultValue={initial.end ?? "17:00"}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="slot-location">
                  Lieu <span className="font-normal">(facultatif)</span>
                </label>
                <input
                  id="slot-location"
                  name="location"
                  className="field"
                  defaultValue={initial.location ?? ""}
                  placeholder="Salle B12, Site Nord…"
                  maxLength={120}
                />
              </div>

              <fieldset>
                <legend className="label">Couleur</legend>
                <div className="flex flex-wrap gap-2">
                  {COLOR_NAMES.map((name) => (
                    <label
                      key={name}
                      className="cursor-pointer"
                      title={COLORS[name].label}
                    >
                      <input
                        type="radio"
                        name="color"
                        value={name}
                        defaultChecked={(initial.color ?? DEFAULT_COLOR) === name}
                        className="peer sr-only"
                      />
                      <span
                        className="block size-7 rounded-full ring-offset-2 ring-offset-[var(--surface)] peer-checked:ring-2 peer-focus-visible:ring-2 ring-[var(--foreground)]"
                        style={{ background: COLORS[name].hex }}
                      />
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

              <Footer onCancel={() => setOpen(false)} />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
