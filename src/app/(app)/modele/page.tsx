import Link from "next/link";
import { SlotForm } from "@/components/SlotForm";
import { SubmitButton } from "@/components/SubmitButton";
import { SlotRow } from "@/components/SlotVisuals";
import { WeekHoursForm, type DayHours } from "@/components/WeekHoursForm";
import {
  copyWeekAction,
  deleteTemplateSlotAction,
  saveTemplateSlotAction,
} from "@/lib/actions";
import { getSettings, getTemplateSlots } from "@/lib/queries";
import {
  formatDuration,
  hhmm,
  timeToMinutes,
  todayISO,
  WEEKDAY_LABELS,
} from "@/lib/date";
import { OTHER, weekTypeFor } from "@/lib/schedule";
import type { ResolvedSlot, WeekType } from "@/lib/types";

export const metadata = { title: "Modèle A/B — Mon planning A/B" };

export default async function ModelePage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const week: WeekType = s === "B" ? "B" : "A";

  const [settings, slots] = await Promise.all([getSettings(), getTemplateSlots()]);
  const currentWeek = weekTypeFor(todayISO(), settings);

  const forWeek = slots.filter((slot) => slot.week_type === week);
  const total = forWeek.reduce(
    (sum, slot) => sum + (timeToMinutes(hhmm(slot.end_time)) - timeToMinutes(hhmm(slot.start_time))),
    0,
  );

  const byWeekday = (weekday: number): ResolvedSlot[] =>
    forWeek
      .filter((slot) => slot.weekday === weekday)
      .map((slot) => ({
        id: slot.id,
        start: hhmm(slot.start_time),
        end: hhmm(slot.end_time),
        startMin: timeToMinutes(hhmm(slot.start_time)),
        endMin: timeToMinutes(hhmm(slot.end_time)),
        title: slot.title,
        location: slot.location,
        color: slot.color,
      }))
      .sort((a, b) => a.startMin - b.startMin);

  const hours: DayHours[] = WEEKDAY_LABELS.map((_, i) => {
    const weekday = i + 1;
    const daySlots = byWeekday(weekday);
    if (daySlots.length === 0) return { weekday, mode: "off" };
    if (daySlots.length === 1) {
      return { weekday, mode: "work", start: daySlots[0].start, end: daySlots[0].end };
    }
    return { weekday, mode: "multi", count: daySlots.length };
  });
  // Le détail s'ouvre d'office dès qu'un jour sort du simple « une plage ».
  const hasDetail = hours.some((h) => h.mode === "multi");

  return (
    <>
      <header className="mb-5">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Modèle A/B</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)]">
          Les deux semaines types de votre planning papier. Elles se répètent en
          alternance&nbsp;: A, B, A, B… Un créneau ajouté ici revient toutes les deux
          semaines. La semaine en cours est une{" "}
          <strong className="font-semibold text-[var(--foreground)]">
            semaine {currentWeek}
          </strong>
          .{" "}
          <Link href="/reglages" className="text-[var(--accent)] hover:underline">
            Modifier le point de départ
          </Link>
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Choisir la semaine type"
          className="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-0.5"
        >
          {(["A", "B"] as const).map((type) => (
            <Link
              key={type}
              href={`/modele?s=${type}`}
              aria-current={type === week ? "page" : undefined}
              className={`rounded-md px-4 py-1.5 text-[0.8125rem] font-semibold transition-colors ${
                type === week
                  ? "bg-[var(--accent)] text-white dark:text-[#10121a]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              Semaine {type}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted)]">
            {forWeek.length === 0
              ? "Vide"
              : `${forWeek.length} créneau${forWeek.length > 1 ? "x" : ""} · ${formatDuration(total)}`}
          </span>
          {forWeek.length > 0 && (
            <form action={copyWeekAction}>
              <input type="hidden" name="from" value={week} />
              <SubmitButton
                className="btn"
                confirm={`Remplacer entièrement la semaine ${OTHER[week]} par une copie de la semaine ${week} ?`}
                pendingLabel="Copie…"
              >
                Copier vers la semaine {OTHER[week]}
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-1 text-sm font-semibold">Horaires de la semaine {week}</h2>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Pour chaque jour, indiquez si vous travaillez et à quelles heures.
        </p>
        <WeekHoursForm key={week} week={week} days={hours} />
      </section>

      <details className="group" open={hasDetail}>
        <summary className="mb-3 cursor-pointer text-sm font-semibold">
          Détail des créneaux{" "}
          <span className="font-normal text-[var(--muted)]">
            — plusieurs créneaux par jour, intitulé, lieu, couleur
          </span>
        </summary>

      <div className="grid gap-3 lg:grid-cols-2">
        {WEEKDAY_LABELS.map((label, i) => {
          const weekday = i + 1;
          const daySlots = byWeekday(weekday);

          return (
            <section key={label} className="card p-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{label}</h2>
                <SlotForm
                  action={saveTemplateSlotAction}
                  hidden={{ week_type: week, weekday: String(weekday) }}
                  heading={`${label} — semaine ${week}`}
                  trigger="+ Ajouter"
                  triggerClassName="btn btn-ghost"
                  triggerTitle={`Ajouter un créneau le ${label.toLowerCase()} de la semaine ${week}`}
                />
              </div>

              {daySlots.length === 0 ? (
                <p className="py-3 text-center text-xs text-[var(--muted)]">
                  Rien de prévu
                </p>
              ) : (
                <ul className="space-y-2">
                  {daySlots.map((slot) => (
                    <SlotRow
                      key={slot.id}
                      slot={slot}
                      actions={
                        <>
                          <SlotForm
                            action={saveTemplateSlotAction}
                            hidden={{ week_type: week, weekday: String(weekday) }}
                            initial={{
                              id: slot.id,
                              title: slot.title,
                              location: slot.location,
                              start: slot.start,
                              end: slot.end,
                              color: slot.color,
                            }}
                            heading="Modifier ce créneau"
                            trigger="Modifier"
                            triggerClassName="btn btn-ghost !text-inherit"
                          />
                          <form action={deleteTemplateSlotAction}>
                            <input type="hidden" name="id" value={slot.id} />
                            <SubmitButton
                              className="btn btn-danger"
                              confirm="Supprimer ce créneau du modèle ?"
                              pendingLabel="…"
                            >
                              Supprimer
                            </SubmitButton>
                          </form>
                        </>
                      }
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      </details>

      <p className="mt-4 text-xs text-[var(--muted)]">
        Les journées déjà modifiées à la main dans la vue jour ne suivent plus le
        modèle&nbsp;: elles ne changeront pas ici.
      </p>
    </>
  );
}
