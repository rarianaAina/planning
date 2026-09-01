import Link from "next/link";
import { slotStyle } from "./SlotVisuals";
import { CustomBadge } from "./WeekBadge";
import { formatDuration, formatShortDate, WEEKDAY_LABELS } from "@/lib/date";
import type { ResolvedDay } from "@/lib/types";

/**
 * Les sept jours en liste verticale. C'est la présentation par défaut sur
 * téléphone : tout se lit d'un pouce, sans défilement latéral, contrairement
 * à la grille horaire à sept colonnes.
 */
export function DayList({ days, today }: { days: ResolvedDay[]; today: string }) {
  return (
    <ul className="space-y-2">
      {days.map((day) => {
        const isToday = day.date === today;
        const minutes = day.slots.reduce((s, x) => s + (x.endMin - x.startMin), 0);

        return (
          <li key={day.date}>
            <Link
              href={`/jour?d=${day.date}`}
              className={`card block overflow-hidden transition-colors hover:border-[var(--border-strong)] ${
                isToday ? "border-[var(--accent)]" : ""
              }`}
            >
              <div
                className={`flex items-center gap-2 px-3 py-2 ${
                  isToday ? "bg-[var(--accent-soft)]" : "bg-[var(--surface-muted)]"
                }`}
              >
                <span className="text-sm font-bold">
                  {WEEKDAY_LABELS[day.weekday - 1]}
                </span>
                <span className="text-sm text-[var(--muted)]">
                  {formatShortDate(day.date)}
                </span>
                {isToday && (
                  <span className="badge badge-a">Aujourd&rsquo;hui</span>
                )}
                {day.customized && <CustomBadge />}
                <span className="ml-auto shrink-0 text-xs font-semibold text-[var(--muted)]">
                  {minutes > 0 ? formatDuration(minutes) : "Libre"}
                </span>
              </div>

              {day.slots.length > 0 && (
                <div className="space-y-1.5 p-2">
                  {day.slots.map((slot) => (
                    <div
                      key={slot.id}
                      style={slotStyle(slot.color)}
                      className="slot rounded-md px-2.5 py-1.5"
                    >
                      <p className="font-mono text-[0.7rem] opacity-75">
                        {slot.start} – {slot.end}
                      </p>
                      <p className="text-sm font-semibold leading-snug">
                        {slot.title}
                      </p>
                      {slot.location && (
                        <p className="text-xs opacity-75">{slot.location}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
