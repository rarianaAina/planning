import type {
  DayOverride,
  ResolvedDay,
  ResolvedSlot,
  Settings,
  TemplateSlot,
  WeekType,
} from "./types";
import { hhmm, isoWeekday, mondayOf, timeToMinutes, weeksBetween } from "./date";

export const OTHER: Record<WeekType, WeekType> = { A: "B", B: "A" };

/**
 * Type de semaine (A ou B) pour une date donnée, par alternance à partir
 * de la semaine de référence enregistrée dans les réglages.
 */
export function weekTypeFor(iso: string, settings: Settings): WeekType {
  const diff = weeksBetween(settings.anchor_monday, mondayOf(iso));
  // `%` en JS garde le signe : on ramène dans {0, 1}.
  const parity = ((diff % 2) + 2) % 2;
  return parity === 0 ? settings.anchor_week_type : OTHER[settings.anchor_week_type];
}

function sortSlots(slots: ResolvedSlot[]): ResolvedSlot[] {
  return slots.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
}

/**
 * Résout une liste de dates en journées affichables.
 * Règle : si un `day_override` existe pour la date, il remplace
 * intégralement le modèle A/B ce jour-là.
 */
export function resolveDays(
  dates: string[],
  settings: Settings,
  templateSlots: TemplateSlot[],
  overrides: DayOverride[],
): ResolvedDay[] {
  const byDay = new Map(overrides.map((o) => [o.day, o]));

  return dates.map((date) => {
    const weekType = weekTypeFor(date, settings);
    const weekday = isoWeekday(date);
    const override = byDay.get(date);

    if (override) {
      return {
        date,
        weekday,
        weekType,
        customized: true,
        overrideId: override.id,
        slots: sortSlots(
          (override.override_slots ?? []).map((s) => ({
            id: s.id,
            start: hhmm(s.start_time),
            end: hhmm(s.end_time),
            startMin: timeToMinutes(hhmm(s.start_time)),
            endMin: timeToMinutes(hhmm(s.end_time)),
            title: s.title,
            location: s.location,
            color: s.color,
          })),
        ),
      };
    }

    return {
      date,
      weekday,
      weekType,
      customized: false,
      overrideId: null,
      slots: sortSlots(
        templateSlots
          .filter((s) => s.week_type === weekType && s.weekday === weekday)
          .map((s) => ({
            id: s.id,
            start: hhmm(s.start_time),
            end: hhmm(s.end_time),
            startMin: timeToMinutes(hhmm(s.start_time)),
            endMin: timeToMinutes(hhmm(s.end_time)),
            title: s.title,
            location: s.location,
            color: s.color,
          })),
      ),
    };
  });
}

/**
 * Plage horaire à afficher dans les grilles, arrondie à l'heure et
 * élargie d'une heure de marge. Retombe sur 8h–19h si rien n'est prévu.
 */
export function timeWindow(days: ResolvedDay[]): { from: number; to: number } {
  const slots = days.flatMap((d) => d.slots);
  if (slots.length === 0) return { from: 8 * 60, to: 19 * 60 };

  const min = Math.min(...slots.map((s) => s.startMin));
  const max = Math.max(...slots.map((s) => s.endMin));
  const from = Math.max(0, Math.floor(min / 60) * 60 - 60);
  const to = Math.min(24 * 60, Math.ceil(max / 60) * 60 + 60);
  // Au moins 6 heures visibles, sinon la grille est écrasée.
  if (to - from < 6 * 60) return { from, to: Math.min(24 * 60, from + 6 * 60) };
  return { from, to };
}

/** Total des minutes planifiées sur un ensemble de journées. */
export function totalMinutes(days: ResolvedDay[]): number {
  return days.reduce(
    (sum, d) => sum + d.slots.reduce((s, x) => s + (x.endMin - x.startMin), 0),
    0,
  );
}

/**
 * Répartit les créneaux qui se chevauchent en colonnes côte à côte,
 * pour qu'aucun ne masque un autre dans les vues grille.
 */
export function layoutSlots(
  slots: ResolvedSlot[],
): Array<{ slot: ResolvedSlot; column: number; columns: number }> {
  const result: Array<{ slot: ResolvedSlot; column: number; columns: number }> = [];
  let cluster: ResolvedSlot[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const columnEnds: number[] = [];
    const assigned = cluster.map((slot) => {
      let col = columnEnds.findIndex((end) => end <= slot.startMin);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(slot.endMin);
      } else {
        columnEnds[col] = slot.endMin;
      }
      return { slot, column: col };
    });
    const columns = columnEnds.length;
    assigned.forEach((a) => result.push({ ...a, columns }));
    cluster = [];
    clusterEnd = -1;
  };

  for (const slot of slots) {
    if (cluster.length > 0 && slot.startMin >= clusterEnd) flush();
    cluster.push(slot);
    clusterEnd = Math.max(clusterEnd, slot.endMin);
  }
  flush();

  return result;
}
