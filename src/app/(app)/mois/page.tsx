import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SlotChip } from "@/components/SlotVisuals";
import { loadDays } from "@/lib/queries";
import {
  addMonths,
  capitalize,
  formatDuration,
  formatMonthYear,
  isoWeekNumber,
  isSameMonth,
  monthGrid,
  parseDateParam,
  todayISO,
  WEEKDAY_SHORT,
} from "@/lib/date";
import { totalMinutes } from "@/lib/schedule";

export const metadata = { title: "Mois — Mon planning A/B" };

/** Nombre de créneaux affichés dans une case avant le repli « +N ». */
const MAX_CHIPS = 3;

export default async function MoisPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const date = parseDateParam(d);
  const dates = monthGrid(date);
  const { days } = await loadDays(dates);

  const today = todayISO();
  const inMonth = days.filter((day) => isSameMonth(day.date, date));
  const minutes = totalMinutes(inMonth);
  const rows = Array.from({ length: 6 }, (_, i) => days.slice(i * 7, i * 7 + 7));

  return (
    <>
      <PageHeader
        view="mois"
        date={date}
        title={capitalize(formatMonthYear(date))}
        prev={`/mois?d=${addMonths(date, -1)}`}
        next={`/mois?d=${addMonths(date, 1)}`}
        today={`/mois?d=${todayISO()}`}
        subtitle={
          minutes === 0
            ? "Aucun créneau ce mois-ci."
            : `${formatDuration(minutes)} planifiées sur le mois.`
        }
      />

      <div className="card overflow-hidden">
        {/* En-tête des jours de la semaine */}
        <div className="grid grid-cols-[2rem_repeat(7,1fr)] border-b border-[var(--border)] bg-[var(--surface-muted)]">
          <div />
          {WEEKDAY_SHORT.map((label) => (
            <div
              key={label}
              className="py-1.5 text-center text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--muted)]"
            >
              {label}
            </div>
          ))}
        </div>

        {rows.map((row, r) => (
          <div
            key={row[0].date}
            className={`grid grid-cols-[2rem_repeat(7,1fr)] ${
              r < rows.length - 1 ? "border-b border-[var(--border)]" : ""
            }`}
          >
            {/* Rail latéral : le type de semaine, comme sur le planning papier */}
            <div
              className={`flex flex-col items-center justify-center gap-0.5 border-r border-[var(--border)] ${
                row[0].weekType === "A"
                  ? "bg-[color-mix(in_oklab,#4f46e5_10%,transparent)] text-[color-mix(in_oklab,#4f46e5_70%,var(--foreground))]"
                  : "bg-[color-mix(in_oklab,#0d9488_10%,transparent)] text-[color-mix(in_oklab,#0d9488_70%,var(--foreground))]"
              }`}
              title={`Semaine ${isoWeekNumber(row[0].date)} — semaine ${row[0].weekType}`}
            >
              <span className="text-[0.6rem] font-semibold opacity-70">
                {isoWeekNumber(row[0].date)}
              </span>
              <span className="text-[0.72rem] font-black">{row[0].weekType}</span>
            </div>

            {row.map((day) => {
              const isToday = day.date === today;
              const current = isSameMonth(day.date, date);
              const extra = day.slots.length - MAX_CHIPS;

              return (
                <Link
                  key={day.date}
                  href={`/jour?d=${day.date}`}
                  className={`flex min-h-[5.25rem] flex-col gap-1 border-r border-[var(--border)] p-1 last:border-r-0 hover:bg-[var(--surface-muted)] sm:min-h-[6.5rem] ${
                    current ? "" : "opacity-40"
                  } ${isToday ? "bg-[var(--accent-soft)]" : ""}`}
                >
                  <div className="flex items-center justify-between gap-1 px-0.5">
                    <span
                      className={`grid size-5 place-items-center rounded-full text-[0.72rem] font-bold ${
                        isToday
                          ? "bg-[var(--accent)] text-white dark:text-[#10121a]"
                          : ""
                      }`}
                    >
                      {Number(day.date.slice(8, 10))}
                    </span>
                    {day.customized && (
                      <span
                        aria-label="Journée modifiée"
                        title="Journée modifiée"
                        className="size-1.5 rounded-full bg-[#f59e0b]"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-0.5">
                    {day.slots.slice(0, MAX_CHIPS).map((slot) => (
                      <SlotChip key={slot.id} slot={slot} />
                    ))}
                    {extra > 0 && (
                      <span className="px-1 text-[0.62rem] font-semibold text-[var(--muted)]">
                        +{extra} autre{extra > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#f59e0b]" /> journée modifiée
        </span>
        <span>La colonne de gauche donne le numéro de la semaine, puis son type (A ou B).</span>
      </div>
    </>
  );
}
