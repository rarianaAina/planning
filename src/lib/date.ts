/**
 * Helpers de dates. Tout se manipule en heure locale via des chaînes
 * `YYYY-MM-DD` : aucun objet Date n'est jamais sérialisé, ce qui évite
 * les décalages de fuseau entre le serveur et le navigateur.
 */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function addMonths(iso: string, n: number): string {
  const d = fromISODate(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  // Reste dans le mois si le jour n'existe pas (31 -> 30/28).
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISODate(d);
}

/** 1 = lundi … 7 = dimanche */
export function isoWeekday(iso: string): number {
  const js = fromISODate(iso).getDay(); // 0 = dimanche
  return js === 0 ? 7 : js;
}

/** Lundi de la semaine contenant `iso`. */
export function mondayOf(iso: string): string {
  return addDays(iso, -(isoWeekday(iso) - 1));
}

/** Les 7 dates de la semaine contenant `iso`, du lundi au dimanche. */
export function weekDates(iso: string): string[] {
  const monday = mondayOf(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Nombre entier de semaines entre deux lundis (peut être négatif). */
export function weeksBetween(fromMonday: string, toMonday: string): number {
  const ms = fromISODate(toMonday).getTime() - fromISODate(fromMonday).getTime();
  return Math.round(ms / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Grille du mois : 6 lignes de 7 jours commençant au lundi précédant
 * le 1er du mois. Toujours 42 cases pour une hauteur stable.
 */
export function monthGrid(iso: string): string[] {
  const d = fromISODate(iso);
  const first = toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
  const start = mondayOf(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** "08:30:00" ou "08:30" -> "08:30" */
export function hhmm(time: string): string {
  return time.slice(0, 5);
}

/** "08:30" -> 510 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Durée lisible : 90 -> "1 h 30", 60 -> "1 h", 45 -> "45 min" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", opts);

export const WEEKDAY_LABELS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** "lundi 1 septembre 2026" */
export function formatLongDate(iso: string): string {
  return fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .format(fromISODate(iso));
}

/** "1 sept." */
export function formatShortDate(iso: string): string {
  return fmt({ day: "numeric", month: "short" }).format(fromISODate(iso));
}

/** "septembre 2026" */
export function formatMonthYear(iso: string): string {
  return fmt({ month: "long", year: "numeric" }).format(fromISODate(iso));
}

/** "Semaine du 1 au 7 septembre 2026" */
export function formatWeekRange(iso: string): string {
  const dates = weekDates(iso);
  const start = fromISODate(dates[0]);
  const end = fromISODate(dates[6]);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = sameMonth
    ? fmt({ day: "numeric" }).format(start)
    : fmt({ day: "numeric", month: "long" }).format(start);
  const endLabel = fmt({ day: "numeric", month: "long", year: "numeric" })
    .format(end);
  return `${startLabel} – ${endLabel}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Valide un paramètre d'URL `?d=` et retombe sur aujourd'hui si besoin. */
export function parseDateParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = fromISODate(raw);
    if (!Number.isNaN(d.getTime()) && toISODate(d) === raw) return raw;
  }
  return todayISO();
}

/**
 * Numéro de semaine ISO-8601 : la semaine 1 est celle qui contient le
 * premier jeudi de l'année. C'est la numérotation utilisée en France.
 */
export function isoWeekNumber(iso: string): number {
  const target = fromISODate(iso);
  // On se place sur le jeudi de la semaine : c'est lui qui porte l'année.
  target.setDate(target.getDate() - (isoWeekday(iso) - 1) + 3);

  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const offset = ((firstThursday.getDay() + 6) % 7) - 3;
  firstThursday.setDate(firstThursday.getDate() - offset);

  const week = Math.round(
    (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  return 1 + week;
}

/**
 * « du 3 au 9 août 2026 », en n'écrivant le mois et l'année qu'une fois
 * quand la semaine ne les franchit pas.
 */
export function formatDayRange(iso: string): string {
  const dates = weekDates(iso);
  const start = fromISODate(dates[0]);
  const end = fromISODate(dates[6]);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  const startLabel = sameMonth
    ? fmt({ day: "numeric" }).format(start)
    : sameYear
      ? fmt({ day: "numeric", month: "long" }).format(start)
      : fmt({ day: "numeric", month: "long", year: "numeric" }).format(start);

  const endLabel = fmt({ day: "numeric", month: "long", year: "numeric" })
    .format(end);

  return `du ${startLabel} au ${endLabel}`;
}
