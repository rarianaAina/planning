import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SlotForm } from "@/components/SlotForm";
import { SubmitButton } from "@/components/SubmitButton";
import { CustomBadge, WeekBadge } from "@/components/WeekBadge";
import { SlotRow } from "@/components/SlotVisuals";
import {
  clearDayAction,
  deleteDaySlotAction,
  resetDayAction,
  saveDaySlotAction,
} from "@/lib/actions";
import { loadDays } from "@/lib/queries";
import {
  addDays,
  capitalize,
  formatDuration,
  formatLongDate,
  isoWeekNumber,
  parseDateParam,
  todayISO,
} from "@/lib/date";
import { totalMinutes } from "@/lib/schedule";

export const metadata = { title: "Jour — Mon planning A/B" };

export default async function JourPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const date = parseDateParam(d);
  const { days } = await loadDays([date]);
  const day = days[0];
  const minutes = totalMinutes([day]);
  const isToday = date === todayISO();

  return (
    <>
      <PageHeader
        view="jour"
        date={date}
        title={capitalize(formatLongDate(date))}
        prev={`/jour?d=${addDays(date, -1)}`}
        next={`/jour?d=${addDays(date, 1)}`}
        today={`/jour?d=${todayISO()}`}
        meta={
          <>
            <WeekBadge type={day.weekType} />
            {day.customized && <CustomBadge />}
            {isToday && <span className="badge">Aujourd&rsquo;hui</span>}
          </>
        }
        subtitle={`Semaine ${isoWeekNumber(date)} · ${
          day.slots.length === 0
            ? "aucun créneau prévu"
            : `${day.slots.length} créneau${day.slots.length > 1 ? "x" : ""} · ${formatDuration(minutes)} au total`
        }`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SlotForm
          action={saveDaySlotAction}
          hidden={{ date }}
          heading="Ajouter un créneau ce jour-là"
          trigger="+ Ajouter un créneau"
          triggerClassName="btn btn-primary"
        />

        {day.slots.length > 0 && (
          <form action={clearDayAction}>
            <input type="hidden" name="date" value={date} />
            <SubmitButton
              className="btn"
              confirm="Vider entièrement cette journée ?"
              pendingLabel="…"
            >
              Vider la journée
            </SubmitButton>
          </form>
        )}

        {day.customized && (
          <form action={resetDayAction}>
            <input type="hidden" name="date" value={date} />
            <SubmitButton
              className="btn"
              title="Réappliquer le modèle de la semaine"
              confirm="Rétablir le modèle de la semaine pour ce jour ? Les modifications de cette journée seront perdues."
              pendingLabel="…"
            >
              Revenir au modèle
            </SubmitButton>
          </form>
        )}
      </div>

      {day.customized && (
        <p className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--muted)]">
          Cette journée a été modifiée : elle ne suit plus le modèle de la semaine{" "}
          {day.weekType}. Modifier le modèle n&rsquo;aura donc plus d&rsquo;effet
          sur elle.
        </p>
      )}

      {day.slots.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-sm font-medium">Journée libre</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-[var(--muted)]">
            Rien n&rsquo;est prévu. Ajoutez un créneau ponctuel ici, ou complétez la{" "}
            <Link href="/modele" className="text-[var(--accent)] hover:underline">
              semaine {day.weekType} du modèle
            </Link>{" "}
            pour qu&rsquo;il revienne chaque quinzaine.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {day.slots.map((slot) => (
            <SlotRow
              key={slot.id}
              slot={slot}
              actions={
                <>
                  <SlotForm
                    action={saveDaySlotAction}
                    hidden={{ date }}
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
                    triggerTitle="Modifier ce créneau"
                  />
                  <form action={deleteDaySlotAction}>
                    <input type="hidden" name="date" value={date} />
                    <input type="hidden" name="id" value={slot.id} />
                    <SubmitButton
                      className="btn btn-danger"
                      title="Supprimer ce créneau"
                      confirm="Supprimer ce créneau ?"
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
    </>
  );
}
