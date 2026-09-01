import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { CustomBadge, WeekBadge } from "@/components/WeekBadge";
import { SlotBlock } from "@/components/SlotVisuals";
import { loadDays } from "@/lib/queries";
import {
  addDays,
  formatDuration,
  formatWeekRange,
  minutesToTime,
  parseDateParam,
  todayISO,
  WEEKDAY_SHORT,
  weekDates,
} from "@/lib/date";
import { layoutSlots, timeWindow, totalMinutes } from "@/lib/schedule";

export const metadata = { title: "Semaine — Mon planning A/B" };

/** Hauteur d'une heure, en pixels. */
const HOUR = 56;

export default async function SemainePage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const date = parseDateParam(d);
  const dates = weekDates(date);
  const { days } = await loadDays(dates);

  const { from, to } = timeWindow(days);
  const height = ((to - from) / 60) * HOUR;
  const hours = Array.from(
    { length: Math.floor((to - from) / 60) + 1 },
    (_, i) => from + i * 60,
  );
  const today = todayISO();
  const minutes = totalMinutes(days);

  return (
    <>
      <PageHeader
        view="semaine"
        date={date}
        title={formatWeekRange(date)}
        prev={`/semaine?d=${addDays(date, -7)}`}
        next={`/semaine?d=${addDays(date, 7)}`}
        today={`/semaine?d=${todayISO()}`}
        meta={<WeekBadge type={days[0].weekType} />}
        subtitle={
          minutes === 0
            ? "Aucun créneau cette semaine."
            : `${formatDuration(minutes)} planifiées sur la semaine.`
        }
      />

      <div className="card overflow-hidden">
        <div className="scroll-slim overflow-x-auto">
          <div className="min-w-[46rem]">
            {/* En-têtes des jours */}
            <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-[var(--border)]">
              <div className="border-r border-[var(--border)]" />
              {days.map((day, i) => {
                const isToday = day.date === today;
                return (
                  <Link
                    key={day.date}
                    href={`/jour?d=${day.date}`}
                    className={`flex flex-col items-center gap-0.5 border-r border-[var(--border)] px-1 py-2 last:border-r-0 hover:bg-[var(--surface-muted)] ${
                      isToday ? "bg-[var(--accent-soft)]" : ""
                    }`}
                  >
                    <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {WEEKDAY_SHORT[i]}
                    </span>
                    <span
                      className={`grid size-6 place-items-center rounded-full text-sm font-bold ${
                        isToday
                          ? "bg-[var(--accent)] text-white dark:text-[#10121a]"
                          : ""
                      }`}
                    >
                      {Number(day.date.slice(8, 10))}
                    </span>
                    {day.customized && <CustomBadge className="!px-1 !text-[0.6rem]" />}
                  </Link>
                );
              })}
            </div>

            {/* Grille horaire */}
            <div className="grid grid-cols-[3rem_repeat(7,1fr)]">
              {/* Axe des heures */}
              <div
                className="relative border-r border-[var(--border)]"
                style={{ height }}
              >
                {hours.slice(0, -1).map((m) => (
                  <span
                    key={m}
                    className="absolute right-1.5 -translate-y-1/2 font-mono text-[0.65rem] text-[var(--muted)]"
                    style={{ top: ((m - from) / 60) * HOUR }}
                  >
                    {minutesToTime(m)}
                  </span>
                ))}
              </div>

              {days.map((day) => (
                <div
                  key={day.date}
                  className={`relative border-r border-[var(--border)] last:border-r-0 ${
                    day.date === today ? "bg-[color-mix(in_oklab,var(--accent)_5%,transparent)]" : ""
                  }`}
                  style={{
                    height,
                    backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${HOUR}px)`,
                  }}
                >
                  {layoutSlots(day.slots).map(({ slot, column, columns }) => (
                    <SlotBlock
                      key={slot.id}
                      slot={slot}
                      href={`/jour?d=${day.date}`}
                      style={{
                        top: ((slot.startMin - from) / 60) * HOUR,
                        height: Math.max(
                          20,
                          ((slot.endMin - slot.startMin) / 60) * HOUR - 2,
                        ),
                        left: `calc(${(column / columns) * 100}% + 2px)`,
                        width: `calc(${100 / columns}% - 4px)`,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--muted)]">
        Touchez un jour ou un créneau pour l&rsquo;ouvrir en vue jour et le modifier.
      </p>
    </>
  );
}
